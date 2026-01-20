
import React, { useEffect, useRef, useState } from 'react';
import { Node, Obstacle, Point } from '../types';

interface CanvasProps {
  nodes: Node[];
  path: number[]; // Node IDs
  obstacles: Obstacle[];
  start: Point;
  goal: Point;
  width: number;
  height: number;
  onObstacleAdd: (obs: Obstacle) => void;
  onObstacleRemove: (index: number) => void;
  onStartMove: (p: Point) => void;
  onGoalMove: (p: Point) => void;
  isRunning: boolean;
  
  // Visualization Props
  tempSample: Point | null;
  tempNewPoint: Point | null;
  tempNearest: Node | null;
}

const Canvas: React.FC<CanvasProps> = ({ 
  nodes, path, obstacles, start, goal, width, height,
  onObstacleAdd, onObstacleRemove, onStartMove, onGoalMove, isRunning,
  tempSample, tempNewPoint, tempNearest
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [interactionMode, setInteractionMode] = useState<'none' | 'drawing' | 'movingStart' | 'movingGoal'>('none');
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [mousePos, setMousePos] = useState<Point | null>(null);

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0f172a'; // slate-900 matches bg
    ctx.fillRect(0, 0, width, height);

    // Draw Obstacles
    ctx.fillStyle = '#334155'; // slate-700
    ctx.strokeStyle = '#475569'; // slate-600
    obstacles.forEach(obs => {
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
    });

    // Draw Drawing Preview
    if (interactionMode === 'drawing' && dragStart && mousePos) {
       ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
       ctx.strokeStyle = '#94a3b8';
       ctx.setLineDash([5, 5]);
       const w = Math.abs(mousePos.x - dragStart.x);
       const h = Math.abs(mousePos.y - dragStart.y);
       const x = Math.min(mousePos.x, dragStart.x);
       const y = Math.min(mousePos.y, dragStart.y);
       ctx.fillRect(x, y, w, h);
       ctx.strokeRect(x, y, w, h);
       ctx.setLineDash([]);
    }

    // Draw Tree Edges
    ctx.lineWidth = 1;
    nodes.forEach(node => {
      if (node.parentId !== null) {
        const parent = nodes[node.parentId];
        // Gradient for depth perception? Keep it simple first.
        ctx.strokeStyle = '#64748b'; // slate-500
        ctx.beginPath();
        ctx.moveTo(parent.x, parent.y);
        ctx.lineTo(node.x, node.y);
        ctx.stroke();
      }
    });

    // Draw Nodes (only if count is low, otherwise too cluttered)
    if (nodes.length < 1000) {
      ctx.fillStyle = '#94a3b8'; // slate-400
      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // --- Visualization of Micro-Steps ---
    
    // Draw Temp Sample (Random Point)
    if (tempSample) {
        ctx.fillStyle = '#f59e0b'; // amber-500
        ctx.beginPath();
        ctx.arc(tempSample.x, tempSample.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.font = '10px Arial';
        ctx.fillText('q_rand', tempSample.x + 8, tempSample.y);
    }

    // Draw Line to Nearest
    if (tempNearest && tempSample) {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)'; // faint amber
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(tempNearest.x, tempNearest.y);
        ctx.lineTo(tempSample.x, tempSample.y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Highlight nearest node
        ctx.strokeStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(tempNearest.x, tempNearest.y, 6, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Draw Candidate Edge (Steer)
    if (tempNewPoint && tempNearest) {
        ctx.strokeStyle = '#fbbf24'; // amber-400 brighter
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tempNearest.x, tempNearest.y);
        ctx.lineTo(tempNewPoint.x, tempNewPoint.y);
        ctx.stroke();
        ctx.lineWidth = 1;

        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(tempNewPoint.x, tempNewPoint.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText('q_new', tempNewPoint.x + 8, tempNewPoint.y);
    }

    // ------------------------------------

    // Draw Path
    if (path.length > 0) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#10b981'; // emerald-500
      ctx.beginPath();
      const startNode = nodes[path[0]];
      ctx.moveTo(startNode.x, startNode.y);
      for (let i = 1; i < path.length; i++) {
        const n = nodes[path[i]];
        ctx.lineTo(n.x, n.y);
      }
      ctx.stroke();
    }

    // Draw Start
    ctx.fillStyle = '#3b82f6'; // blue-500
    ctx.beginPath();
    ctx.arc(start.x, start.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', start.x, start.y);

    // Draw Goal
    ctx.fillStyle = '#ef4444'; // red-500
    ctx.beginPath();
    ctx.arc(goal.x, goal.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.fillText('G', goal.x, goal.y);

  }, [nodes, path, obstacles, start, goal, width, height, interactionMode, dragStart, mousePos, tempSample, tempNewPoint, tempNearest]);

  // Event Handlers for Interaction
  const getMousePos = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only left click for actions
    if (e.button !== 0) return;
    if (isRunning) return;

    const pos = getMousePos(e);
    
    // Check if clicking start or goal
    const distStart = Math.sqrt(Math.pow(pos.x - start.x, 2) + Math.pow(pos.y - start.y, 2));
    const distGoal = Math.sqrt(Math.pow(pos.x - goal.x, 2) + Math.pow(pos.y - goal.y, 2));

    if (distStart < 15) {
      setInteractionMode('movingStart');
    } else if (distGoal < 15) {
      setInteractionMode('movingGoal');
    } else {
      setInteractionMode('drawing');
      setDragStart(pos);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    setMousePos(pos);

    if (interactionMode === 'none') return;

    if (interactionMode === 'movingStart') {
      onStartMove(pos);
    } else if (interactionMode === 'movingGoal') {
      onGoalMove(pos);
    } 
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (interactionMode === 'drawing' && dragStart) {
      const pos = getMousePos(e);
      const w = Math.abs(pos.x - dragStart.x);
      const h = Math.abs(pos.y - dragStart.y);
      if (w > 5 && h > 5) {
        const x = Math.min(pos.x, dragStart.x);
        const y = Math.min(pos.y, dragStart.y);
        onObstacleAdd({ x, y, w, h });
      }
    }
    setInteractionMode('none');
    setDragStart(null);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isRunning) return;
    
    const pos = getMousePos(e);
    // Check if clicked on any obstacle (iterate backwards to get top-most if overlap)
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        if (pos.x >= obs.x && pos.x <= obs.x + obs.w && pos.y >= obs.y && pos.y <= obs.y + obs.h) {
            onObstacleRemove(i);
            return;
        }
    }
  };

  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-700 shadow-2xl">
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="cursor-crosshair block bg-slate-950"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={handleContextMenu}
        />
        <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded border border-slate-700 text-xs text-slate-300 pointer-events-none select-none">
            <span className="text-blue-400 font-bold">Left Drag</span> S/G to move • 
            <span className="text-emerald-400 font-bold ml-1">Drag Space</span> to draw walls • 
            <span className="text-rose-400 font-bold ml-1">Right Click</span> wall to delete
        </div>
    </div>
  );
};

export default Canvas;
