import React from 'react';
import { Activity, Route, MapPin } from 'lucide-react';

interface StatsProps {
  nodeCount: number;
  pathLength: number | null;
  found: boolean;
  algorithm: string;
}

const Stats: React.FC<StatsProps> = ({ nodeCount, pathLength, found, algorithm }) => {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col items-center">
        <Activity className="w-5 h-5 text-blue-400 mb-1" />
        <span className="text-xs text-slate-400 uppercase tracking-wider">Nodes</span>
        <span className="text-xl font-bold text-white">{nodeCount}</span>
      </div>
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col items-center">
        <Route className="w-5 h-5 text-emerald-400 mb-1" />
        <span className="text-xs text-slate-400 uppercase tracking-wider">Path Cost</span>
        <span className="text-xl font-bold text-white">
          {pathLength ? pathLength.toFixed(0) : '--'}
        </span>
      </div>
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col items-center">
        <MapPin className={`w-5 h-5 mb-1 ${found ? 'text-emerald-400' : 'text-rose-400'}`} />
        <span className="text-xs text-slate-400 uppercase tracking-wider">Status</span>
        <span className={`text-xl font-bold ${found ? 'text-emerald-400' : 'text-slate-500'}`}>
          {found ? 'FOUND' : 'SEARCHING'}
        </span>
      </div>
    </div>
  );
};

export default Stats;
