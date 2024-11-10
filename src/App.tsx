import React, { useState } from 'react';
import { ResourceDisplay } from './components/ResourceDisplay';
import { TreeFarm } from './components/TreeFarm';
import { TreeDashboard } from './components/TreeDashboard';
import { AchievementPanel } from './components/AchievementPanel';
import { SpecialEvent } from './components/SpecialEvent';
import { Shopkeeper } from './components/Shopkeeper';
import { Workshop } from './components/Workshop';
import { Store, Wrench } from 'lucide-react';
import { useGameState } from './hooks/useGameState';
import { TREES } from './data/trees';
import type { TreeType, ShopItem, Upgrade } from './types';

export default function App() {
  const { 
    state, 
    addOxygen,
    spendOxygen, 
    plantTree, 
    removeTree, 
    incrementClicks,
    matureAllTrees,
    addClickPowerBoost,
    tillBox,
    hasTilledPlots,
    purchaseUpgrade,
    TILLING_REQUIRED
  } = useGameState();
  
  const [clickEffect, setClickEffect] = useState<{ x: number; y: number } | null>(null);
  const [selectedSeed, setSelectedSeed] = useState<ShopItem | null>(null);
  const [showShopkeeper, setShowShopkeeper] = useState(false);
  const [showWorkshop, setShowWorkshop] = useState(false);

  const totalMultiplier = (1 + 
    state.plantedTrees.reduce((acc, tree) => {
      if (tree.maturedAt) {
        return acc + TREES[tree.type].baseMultiplier;
      }
      return acc;
    }, 0)
  ) * state.specialEventMultiplier * state.clickPower;

  const autoGeneration = state.plantedTrees.reduce((acc, tree) => {
    if (tree.maturedAt) {
      return acc + TREES[tree.type].baseProduction;
    }
    return acc;
  }, 0);

  const handleBoxClick = (e: React.MouseEvent, position: number) => {
    e.stopPropagation();

    if (selectedSeed) {
      if (state.tilledBoxes[position] >= TILLING_REQUIRED(position) && selectedSeed.treeType) {
        if (!plantTree(selectedSeed.treeType, position)) {
          addOxygen(selectedSeed.price);
        }
        setSelectedSeed(null);
      }
    } else {
      if (tillBox(position)) {
        incrementClicks();
        
        setClickEffect({ x: e.clientX, y: e.clientY });
        setTimeout(() => setClickEffect(null), 500);
      }
    }
  };

  const handleShopPurchase = (item: ShopItem) => {
    if (state.oxygen >= item.price) {
      spendOxygen(item.price);
      
      switch (item.type) {
        case 'seed':
          setSelectedSeed(item);
          setShowShopkeeper(false);
          if (!hasTilledPlots()) {
            addOxygen(item.price);
            setSelectedSeed(null);
          }
          break;
        case 'powerup':
          if (item.multiplier) {
            addClickPowerBoost(item.multiplier);
          }
          break;
        case 'special':
          if (item.id === 'growth-crystal') {
            matureAllTrees();
          }
          break;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 p-4">
      <div className="container mx-auto">
        <ResourceDisplay 
          oxygen={state.oxygen}
          totalMultiplier={totalMultiplier}
          autoGeneration={autoGeneration}
        />

        <div className="fixed top-4 right-4 flex gap-2">
          <button
            onClick={() => setShowWorkshop(true)}
            className="bg-emerald-700/80 hover:bg-emerald-600/80 p-3 rounded-lg transition-colors flex items-center gap-2"
          >
            <Wrench className="w-5 h-5" />
            <span>Workshop</span>
          </button>
          <button
            onClick={() => setShowShopkeeper(true)}
            className="bg-emerald-700/80 hover:bg-emerald-600/80 p-3 rounded-lg transition-colors flex items-center gap-2"
          >
            <Store className="w-5 h-5" />
            <span>Shop</span>
          </button>
        </div>

        {selectedSeed && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-emerald-800/90 px-4 py-2 rounded-lg text-emerald-100">
            Click on a tilled plot to plant {selectedSeed.name}
            <button 
              onClick={() => {
                addOxygen(selectedSeed.price);
                setSelectedSeed(null);
              }}
              className="ml-3 text-emerald-400 hover:text-emerald-300"
            >
              Cancel
            </button>
          </div>
        )}

        <TreeFarm 
          trees={state.plantedTrees}
          tilledBoxes={state.tilledBoxes}
          onBoxClick={handleBoxClick}
          selectedSeed={selectedSeed}
          recentlyMaturedTrees={state.recentlyMaturedTrees}
          autoTillers={state.autoTillers}
        />

        <TreeDashboard 
          trees={state.plantedTrees}
          onRemoveTree={removeTree}
        />
        
        <AchievementPanel achievements={state.achievements} />
        
        <SpecialEvent active={state.specialEventActive} multiplier={state.specialEventMultiplier} />

        {showShopkeeper && (
          <Shopkeeper 
            apiKey={import.meta.env.VITE_XAI_API_KEY}
            onClose={() => setShowShopkeeper(false)}
            oxygen={state.oxygen}
            onPurchase={handleShopPurchase}
            highestOxygenReached={state.highestOxygenReached}
            hasTilledPlots={hasTilledPlots()}
          />
        )}

        {showWorkshop && (
          <Workshop 
            onClose={() => setShowWorkshop(false)}
            oxygen={state.oxygen}
            upgrades={state.upgrades}
            onPurchase={purchaseUpgrade}
            highestOxygenReached={state.highestOxygenReached}
            autoTillers={state.autoTillers}
          />
        )}

        {clickEffect && (
          <div
            className="fixed pointer-events-none text-green-300 font-bold text-xl animate-bounce"
            style={{
              left: clickEffect.x - 10,
              top: clickEffect.y - 10,
            }}
          >
            +{Math.ceil(totalMultiplier)}
          </div>
        )}
      </div>
    </div>
  );
}