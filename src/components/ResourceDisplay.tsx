import React from 'react';
import { Wind, MousePointerClick, Leaf } from 'lucide-react';

interface ResourceDisplayProps {
  oxygen: number;
  totalMultiplier: number;
  autoGeneration: number;
}

export function ResourceDisplay({ oxygen, totalMultiplier, autoGeneration }: ResourceDisplayProps) {
  return (
    <div className="text-center mb-8">
      <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-green-300 to-emerald-300 text-transparent bg-clip-text">
        Tree Farm Clicker
      </h1>
      <div className="inline-flex gap-6 px-6 py-3 rounded-xl bg-emerald-950/30 backdrop-blur-sm border border-emerald-800/30">
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-green-400" />
          <span className="text-xl font-semibold text-green-100">
            {oxygen.toLocaleString()} oxygen
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-emerald-100/70">
          <MousePointerClick className="w-4 h-4" />
          <span>×{totalMultiplier.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-emerald-100/70">
          <Wind className="w-4 h-4" />
          <span>{autoGeneration}/s</span>
        </div>
      </div>
    </div>
  );
}