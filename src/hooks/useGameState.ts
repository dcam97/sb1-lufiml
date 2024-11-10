import { useState, useEffect } from 'react';
import { Achievement, GameState, PlantedTree, TreeType, Upgrade } from '../types';
import { achievements } from '../data/achievements';
import { TREES } from '../data/trees';
import { upgrades as initialUpgrades } from '../data/upgrades';

const SPECIAL_EVENT_CHANCE = 0.1;
const SPECIAL_EVENT_DURATION = 30000;
const CLICK_BOOST_DURATION = 300000;

export const getTillingRequired = (position: number): number => {
  const base = 30;
  const multiplier = 1.5;
  const requirement = Math.floor(base * Math.pow(multiplier, position));
  return Math.min(requirement, 10000);
};

export function useGameState() {
  const [state, setState] = useState<GameState>({
    oxygen: 1,
    plantedTrees: [],
    achievements: achievements,
    clickPower: 1,
    specialEventActive: false,
    specialEventMultiplier: 1,
    totalClicks: 0,
    totalOxygenGenerated: 0,
    tilledBoxes: {},
    tillingPower: 1,
    highestOxygenReached: 1,
    recentlyMaturedTrees: {},
    upgrades: initialUpgrades.reduce((acc, upgrade) => ({ ...acc, [upgrade.id]: upgrade }), {}),
    autoTillers: {}
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        const now = Date.now();
        let oxygenGained = 0;
        const updatedTrees = prev.plantedTrees.map(tree => {
          if (!tree.maturedAt && now - tree.plantedAt >= TREES[tree.type].growthTime) {
            const newRecentlyMatured = {
              ...prev.recentlyMaturedTrees,
              [tree.id]: now
            };
            setTimeout(() => {
              setState(current => ({
                ...current,
                recentlyMaturedTrees: Object.fromEntries(
                  Object.entries(current.recentlyMaturedTrees)
                    .filter(([id]) => id !== tree.id)
                )
              }));
            }, 2000);
            return { ...tree, maturedAt: now };
          }
          if (tree.maturedAt) {
            oxygenGained += TREES[tree.type].baseProduction;
          }
          return tree;
        });

        const newOxygen = prev.oxygen + oxygenGained;
        return {
          ...prev,
          plantedTrees: updatedTrees,
          oxygen: newOxygen,
          totalOxygenGenerated: prev.totalOxygenGenerated + oxygenGained,
          highestOxygenReached: Math.max(prev.highestOxygenReached, newOxygen)
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!state.specialEventActive && Math.random() < SPECIAL_EVENT_CHANCE) {
        setState(prev => ({
          ...prev,
          specialEventActive: true,
          specialEventMultiplier: 2 + Math.floor(Math.random() * 3),
        }));

        setTimeout(() => {
          setState(prev => ({
            ...prev,
            specialEventActive: false,
            specialEventMultiplier: 1,
          }));
        }, SPECIAL_EVENT_DURATION);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [state.specialEventActive]);

  useEffect(() => {
    setState(prev => ({
      ...prev,
      achievements: prev.achievements.map(achievement => ({
        ...achievement,
        unlocked: achievement.condition(prev) && !achievement.unlocked
          ? (addOxygen(achievement.reward), true)
          : achievement.unlocked
      }))
    }));
  }, [state.oxygen, state.plantedTrees, state.totalClicks, state.totalOxygenGenerated]);

  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        const newTilledBoxes = { ...prev.tilledBoxes };
        let changed = false;

        Object.entries(prev.autoTillers).forEach(([position, upgradeId]) => {
          const upgrade = prev.upgrades[upgradeId];
          if (upgrade) {
            const currentTilling = newTilledBoxes[parseInt(position)] || 0;
            const maxTilling = getTillingRequired(parseInt(position));
            if (currentTilling < maxTilling) {
              newTilledBoxes[parseInt(position)] = Math.min(
                currentTilling + upgrade.power,
                maxTilling
              );
              changed = true;
            }
          }
        });

        return changed ? { ...prev, tilledBoxes: newTilledBoxes } : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const addOxygen = (amount: number) => {
    setState(prev => {
      const newOxygen = Math.floor(prev.oxygen + amount);
      return {
        ...prev,
        oxygen: newOxygen,
        totalOxygenGenerated: prev.totalOxygenGenerated + amount,
        highestOxygenReached: Math.max(prev.highestOxygenReached, newOxygen)
      };
    });
  };

  const spendOxygen = (amount: number) => {
    setState(prev => ({
      ...prev,
      oxygen: Math.max(0, prev.oxygen - amount),
    }));
  };

  const plantTree = (type: TreeType, position: number): boolean => {
    if (state.tilledBoxes[position] >= getTillingRequired(position)) {
      const tree: PlantedTree = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        plantedAt: Date.now(),
        maturedAt: null,
        position,
      };

      setState(prev => ({
        ...prev,
        plantedTrees: [...prev.plantedTrees, tree],
        tilledBoxes: {
          ...prev.tilledBoxes,
          [position]: 0
        }
      }));
      return true;
    }
    return false;
  };

  const removeTree = (id: string) => {
    setState(prev => ({
      ...prev,
      plantedTrees: prev.plantedTrees.filter(tree => tree.id !== id),
    }));
  };

  const incrementClicks = () => {
    setState(prev => ({
      ...prev,
      totalClicks: prev.totalClicks + 1,
    }));
  };

  const tillBox = (position: number): boolean => {
    if (!state.plantedTrees.some(tree => tree.position === position)) {
      const currentTilling = state.tilledBoxes[position] || 0;
      const required = getTillingRequired(position);
      
      if (currentTilling < required) {
        setState(prev => ({
          ...prev,
          tilledBoxes: {
            ...prev.tilledBoxes,
            [position]: Math.min(required, currentTilling + prev.tillingPower)
          }
        }));
        return true;
      }
    }
    return false;
  };

  const hasTilledPlots = (): boolean => {
    return Object.entries(state.tilledBoxes).some(([position, clicks]) => 
      clicks >= getTillingRequired(parseInt(position))
    );
  };

  const matureAllTrees = () => {
    setState(prev => ({
      ...prev,
      plantedTrees: prev.plantedTrees.map(tree => ({
        ...tree,
        maturedAt: tree.maturedAt || Date.now(),
      })),
    }));
  };

  const addClickPowerBoost = (multiplier: number) => {
    setState(prev => ({
      ...prev,
      clickPower: prev.clickPower * multiplier,
    }));

    setTimeout(() => {
      setState(prev => ({
        ...prev,
        clickPower: prev.clickPower / multiplier,
      }));
    }, CLICK_BOOST_DURATION);
  };

  const purchaseUpgrade = (upgrade: Upgrade, position?: number) => {
    if (state.oxygen >= upgrade.price) {
      setState(prev => {
        const newState = { ...prev };
        
        if (upgrade.type === 'tool') {
          newState.tillingPower += upgrade.power;
          newState.upgrades[upgrade.id] = {
            ...upgrade,
            owned: (upgrade.owned || 0) + 1
          };
        } else if (upgrade.type === 'automation' && position !== undefined) {
          newState.autoTillers[position] = upgrade.id;
          newState.upgrades[upgrade.id] = {
            ...upgrade,
            owned: (upgrade.owned || 0) + 1
          };
        }
        
        newState.oxygen -= upgrade.price;
        return newState;
      });
      return true;
    }
    return false;
  };

  return { 
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
    TILLING_REQUIRED: getTillingRequired
  };
}