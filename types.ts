
export interface Point {
  x: number;
  y: number;
}

export interface Node extends Point {
  id: number;
  parentId: number | null;
  cost: number; // Cost from root to this node
  children: number[];
}

export interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type AlgorithmType = 'RRT' | 'RRT*';

export interface SolverParams {
  stepSize: number;
  maxIterations: number;
  goalBias: number; // 0 to 1
  searchRadius: number; // For RRT* rewiring
}

export interface SimulationState {
  nodes: Node[];
  path: number[]; // Array of node IDs representing the path
  goalReached: boolean;
  iteration: number;
}

export type CodeStep = 
  | 'SAMPLE' 
  | 'NEAREST' 
  | 'STEER' 
  | 'COLLISION_CHECK' 
  | 'NEIGHBORS' // RRT*
  | 'CHOOSE_PARENT' // RRT*
  | 'ADD_NODE' 
  | 'REWIRE' // RRT*
  | 'IDLE';
