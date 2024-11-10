import React from 'react';
import { Sprout, TreeDeciduous, TreePine, Palmtree, Shovel, Leaf } from 'lucide-react';
import type { PlantedTree, ShopItem } from '../types';
import { TREES } from '../data/trees';
import { getTillingRequired } from '../hooks/useGameState';

interface TreeFarmProps {
  trees: PlantedTree[];
  tilledBoxes: Record<number, number>;
  onBoxClick: (e: React.MouseEvent, position: number) => void;
  selectedSeed: ShopItem | null;
  recentlyMaturedTrees: Record<string, number>;
  autoTillers: Record<number, number>;
}

const TreeIcons = {
  oak: TreeDeciduous,
  pine: TreePine,
  willow: Palmtree,
};

export function TreeFarm({ 
  trees, 
  tilledBoxes, 
  onBoxClick, 
  selectedSeed,
  recentlyMaturedTrees,
  autoTillers
}: TreeFarmProps) {
  const getTillingProgress = (position: number): number => {
    const required = getTillingRequired(position);
    return ((tilledBoxes[position] || 0) / required) * 100;
  };

  const getGrowthProgress = (tree: PlantedTree): number => {
    if (tree.maturedAt) return 100;
    const elapsed = Date.now() - tree.plantedAt;
    const total = TREES[tree.type].growthTime;
    return Math.min(100, (elapsed / total) * 100);
  };

  const getRemainingTime = (tree: PlantedTree): string => {
    if (tree.maturedAt) return 'Mature';
    const elapsed = Date.now() - tree.plantedAt;
    const total = TREES[tree.type].growthTime;
    const remaining = Math.max(0, total - elapsed);
    return `${Math.ceil(remaining / 1000)}s`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div 
        className="grid grid-cols-4 gap-2 p-4 rounded-xl bg-gradient-to-b from-emerald-950/50 to-emerald-900/50 backdrop-blur-sm border border-emerald-800/30"
      >
        {Array.from({ length: 16 }).map((_, position) => {
          const tree = trees.find(t => t.position === position);
          const isRecentlyMatured = tree?.maturedAt && tree.id in recentlyMaturedTrees;
          const tillingProgress = getTillingProgress(position);
          const growthProgress = tree ? getGrowthProgress(tree) : 0;
          const required = getTillingRequired(position);
          const isTilled = tillingProgress >= 100;
          const canPlantHere = selectedSeed && isTilled && !tree;
          const hasAutoTiller = position in autoTillers;

          return (
            <button
              key={position}
              onClick={(e) => onBoxClick(e, position)}
              disabled={tillingProgress >= 100 && !canPlantHere}
              className={`aspect-square rounded-lg transition-all duration-300 relative overflow-hidden
                ${tree ? 'bg-emerald-800/20' : 
                  canPlantHere ? 'bg-emerald-600/30 hover:bg-emerald-500/30' :
                  isTilled ? 'bg-amber-900/30' :
                  'hover:bg-emerald-800/10'}`}
              style={{
                background: !tree && tillingProgress > 0 && tillingProgress < 100 
                  ? `linear-gradient(to top, rgba(180, 83, 9, 0.3) ${tillingProgress}%, rgba(6, 78, 59, 0.2) ${tillingProgress}%)`
                  : undefined
              }}
            >
              {tree ? (
                <div className="w-full h-full flex items-center justify-center">
                  {tree.maturedAt ? (
                    <div className="relative group">
                      <div className={`transition-all duration-500 ${isRecentlyMatured ? 'animate-mature' : 'hover:scale-110'}`}>
                        {React.createElement(TreeIcons[tree.type], {
                          className: `w-12 h-12 ${
                            tree.type === 'oak' ? 'text-emerald-400' :
                            tree.type === 'pine' ? 'text-green-500' :
                            'text-emerald-300'
                          } relative z-10`,
                        })}
                      </div>
                      {isRecentlyMatured && (
                        <>
                          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                            <Leaf className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-300 animate-leaf-1" />
                            <Leaf className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-400 animate-leaf-2" />
                            <Leaf className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-300 animate-leaf-3" />
                            <Leaf className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-400 animate-leaf-4" />
                          </div>
                        </>
                      )}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute inset-0 bg-emerald-400/20 blur-lg rounded-full transform scale-125" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-xs text-emerald-300/90 font-medium">
                          {TREES[tree.type].title}
                        </div>
                        <div className="relative">
                          <Sprout className="w-8 h-8 text-emerald-400 animate-seed-pulse" />
                          <div className="absolute inset-0 bg-emerald-400/10 rounded-full blur-xl animate-seed-pulse" />
                        </div>
                        <div className="text-xs text-emerald-300/70">
                          {getRemainingTime(tree)}
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-950/30">
                          <div 
                            className="h-full bg-emerald-400/50 transition-all duration-300"
                            style={{ width: `${growthProgress}%` }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  {(tillingProgress > 0 || hasAutoTiller) && (
                    <>
                      <Shovel className={`w-6 h-6 
                        ${canPlantHere ? 'text-emerald-400' : 
                          isTilled ? 'text-amber-600' : 
                          'text-emerald-600/50'}`} 
                      />
                      <div className="absolute bottom-1 left-0 w-full text-center text-xs text-emerald-200/70">
                        {Math.floor(tilledBoxes[position] || 0)}/{required}
                      </div>
                    </>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}