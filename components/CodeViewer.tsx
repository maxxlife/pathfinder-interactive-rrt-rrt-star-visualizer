
import React from 'react';
import { AlgorithmType, CodeStep } from '../types';
import { X, Code, MessageSquareQuote } from 'lucide-react';

interface CodeViewerProps {
  algorithm: AlgorithmType;
  currentStep: CodeStep;
  isOpen: boolean;
  onClose: () => void;
}

const RRT_CODE = [
  { 
    id: 'SAMPLE', 
    text: 'q_rand = Sample(space)', 
    comment: 'Randomly select a coordinate in the free space. To ensure we eventually reach the target, we occasionally (5-10% of the time) pick the Goal position directly as our random sample.' 
  },
  { 
    id: 'NEAREST', 
    text: 'q_nearest = Nearest(tree, q_rand)', 
    comment: 'Iterate through all nodes currently in the tree to find the one single node (q_nearest) that is closest to our random sample point.' 
  },
  { 
    id: 'STEER', 
    text: 'q_new = Steer(q_nearest, q_rand, step_size)', 
    comment: 'Attempt to move from the nearest node towards the random point. We limit the distance by a fixed "Step Size" to ensure the tree grows incrementally and safely.' 
  },
  { 
    id: 'COLLISION_CHECK', 
    text: 'if CollisionFree(obstacles, q_nearest, q_new):', 
    comment: 'Check if the straight-line path between the nearest node and the new candidate point intersects with any obstacles. If it hits a wall, we discard this attempt.' 
  },
  { 
    id: 'ADD_NODE', 
    text: '    Tree.add_node(q_new)', 
    comment: 'Success! The path is clear. We add the new point to our tree and create a parent-child relationship with the nearest node.' 
  },
];

const RRT_STAR_CODE = [
  { 
    id: 'SAMPLE', 
    text: 'q_rand = Sample(space)', 
    comment: 'Randomly select a coordinate in the configuration space. This stochastic sampling allows the algorithm to explore high-dimensional spaces efficiently.' 
  },
  { 
    id: 'NEAREST', 
    text: 'q_nearest = Nearest(tree, q_rand)', 
    comment: 'Find the node in the existing tree that is geometrically closest to the random sample. This will serve as the initial anchor for our new point.' 
  },
  { 
    id: 'STEER', 
    text: 'q_new = Steer(q_nearest, q_rand, step_size)', 
    comment: 'Generate a new candidate state (q_new) by advancing a specific "Step Size" from the nearest node towards the random sample.' 
  },
  { 
    id: 'COLLISION_CHECK', 
    text: 'if CollisionFree(obstacles, q_nearest, q_new):', 
    comment: 'Verify that the path segment connecting the nearest node to the new candidate is strictly obstacle-free.' 
  },
  { 
    id: 'NEIGHBORS', 
    text: '    neighbors = Near(tree, q_new, radius)', 
    comment: 'Search for all existing nodes within a fixed radius of the new point. These are potential alternative parents or children for optimization.' 
  },
  { 
    id: 'CHOOSE_PARENT', 
    text: '    q_min = ChooseParent(neighbors, q_nearest)', 
    comment: 'Compare the total path cost (distance from start) through all neighboring nodes. Connect the new point to the neighbor that offers the shortest total path.' 
  },
  { 
    id: 'ADD_NODE', 
    text: '    Tree.add_node(q_new, parent=q_min)', 
    comment: 'Add the new node to the tree, linked to the "best parent" found in the previous step, minimizing the cost to reach this point.' 
  },
  { 
    id: 'REWIRE', 
    text: '    Rewire(tree, neighbors, q_new)', 
    comment: 'The key optimization step: Check if any neighbors can be reached more cheaply by going through the NEW node. If so, "rewire" them to use the new node as their parent.' 
  },
];

const CodeViewer: React.FC<CodeViewerProps> = ({ algorithm, currentStep, isOpen, onClose }) => {
  if (!isOpen) return null;

  const codeLines = algorithm === 'RRT' ? RRT_CODE : RRT_STAR_CODE;

  // Helper to check if line is active
  const isActive = (lineId: string) => {
      // Mapping some states to same lines if needed
      if (lineId === 'EDGE' && currentStep === 'ADD_NODE') return true; 
      return lineId === currentStep;
  };
  
  const activeLineInfo = codeLines.find(l => isActive(l.id));

  return (
    <div className="absolute top-20 right-6 w-96 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden flex flex-col z-20 font-mono text-sm">
      {/* Header */}
      <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
        <h3 className="font-bold text-slate-200 flex items-center gap-2">
           <Code size={16} className="text-blue-400"/>
           Algorithm Trace
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Code Display */}
      <div className="p-4 bg-slate-950/90 text-slate-300 space-y-1 max-h-[300px] overflow-y-auto">
        {codeLines.map((line, idx) => {
          const active = isActive(line.id);
          return (
            <div 
              key={idx}
              className={`px-2 py-1.5 rounded transition-all duration-200 ${
                active 
                  ? 'bg-blue-900/40 text-blue-100 border-l-4 border-blue-500 font-medium pl-2 shadow-lg shadow-blue-900/10' 
                  : 'opacity-60 border-l-4 border-transparent pl-2'
              }`}
            >
              <span className={`text-[10px] w-6 inline-block select-none ${active ? 'text-blue-300' : 'text-slate-600'}`}>
                {(idx + 1).toString().padStart(2, '0')}
              </span>
              {line.text}
            </div>
          );
        })}
      </div>

      {/* Dynamic Comment Section */}
      <div className="bg-slate-800/80 p-4 border-t border-slate-700 min-h-[100px]">
        <div className="flex items-start gap-3">
             <MessageSquareQuote className={`flex-shrink-0 mt-1 ${activeLineInfo ? 'text-amber-400' : 'text-slate-600'}`} size={18} />
             <div className="space-y-1">
                 <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                    Current Operation
                 </span>
                 <p className={`text-xs leading-relaxed ${activeLineInfo ? 'text-slate-200' : 'text-slate-500 italic'}`}>
                    {activeLineInfo ? activeLineInfo.comment : "Waiting to start..."}
                 </p>
             </div>
        </div>
      </div>
      
      {/* Footer Hint */}
      <div className="bg-slate-900 p-2 text-[10px] text-slate-600 text-center border-t border-slate-800">
          Step-by-step execution mode active
      </div>
    </div>
  );
};

export default CodeViewer;
