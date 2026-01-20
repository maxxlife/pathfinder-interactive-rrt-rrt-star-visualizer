
import { Node, Point, Obstacle, AlgorithmType, SolverParams, CodeStep } from '../types';
import { dist, steer, checkCollision, samplePoint } from '../utils/geo';

export class RRTTree {
  nodes: Node[] = [];
  width: number;
  height: number;
  start: Point;
  goal: Point;
  obstacles: Obstacle[];
  params: SolverParams;
  goalNodeId: number | null = null;
  algorithm: AlgorithmType;

  // State for micro-stepping
  microState: CodeStep = 'SAMPLE';
  
  // Temporary variables for visualization/stepping
  tempSample: Point | null = null;
  tempNearestNode: Node | null = null;
  tempNewPoint: Point | null = null;
  tempNeighbors: number[] = [];
  tempBestParent: number | null = null;

  constructor(
    width: number, 
    height: number, 
    start: Point, 
    goal: Point, 
    obstacles: Obstacle[], 
    params: SolverParams,
    algorithm: AlgorithmType
  ) {
    this.width = width;
    this.height = height;
    this.start = start;
    this.goal = goal;
    this.obstacles = obstacles;
    this.params = params;
    this.algorithm = algorithm;
    
    // Initialize root
    this.nodes.push({
      id: 0,
      x: start.x,
      y: start.y,
      parentId: null,
      cost: 0,
      children: []
    });
  }

  // Executes one micro-step of the algorithm
  // Returns true if the iteration is still ongoing, false if the iteration completed (node added or discarded)
  stepMicro(): boolean {
    if (this.nodes.length >= this.params.maxIterations) return false;

    switch (this.microState) {
      case 'SAMPLE':
        // 1. Sample
        if (Math.random() < this.params.goalBias) {
          this.tempSample = this.goal;
        } else {
          this.tempSample = samplePoint(this.width, this.height);
        }
        this.microState = 'NEAREST';
        return true;

      case 'NEAREST':
        // 2. Nearest Neighbor
        if (!this.tempSample) {
             this.microState = 'SAMPLE'; // Should not happen
             return true; 
        }
        
        let nearestNodeIndex = -1;
        let minDist = Infinity;
        
        for (let i = 0; i < this.nodes.length; i++) {
          const d = dist(this.nodes[i], this.tempSample);
          if (d < minDist) {
            minDist = d;
            nearestNodeIndex = i;
          }
        }
        this.tempNearestNode = this.nodes[nearestNodeIndex];
        this.microState = 'STEER';
        return true;

      case 'STEER':
        // 3. Steer
        if (!this.tempNearestNode || !this.tempSample) {
            this.microState = 'SAMPLE';
            return true;
        }
        this.tempNewPoint = steer(this.tempNearestNode, this.tempSample, this.params.stepSize);
        this.microState = 'COLLISION_CHECK';
        return true;

      case 'COLLISION_CHECK':
        // 4. Collision Check
        if (!this.tempNearestNode || !this.tempNewPoint) {
             this.microState = 'SAMPLE';
             return true;
        }

        if (checkCollision(this.tempNearestNode, this.tempNewPoint, this.obstacles)) {
          // Collision: discard and restart iteration
          this.resetTemp();
          this.microState = 'SAMPLE';
          return false; // Iteration ended (failed)
        }

        // No collision
        if (this.algorithm === 'RRT*') {
            this.microState = 'NEIGHBORS';
        } else {
            this.microState = 'ADD_NODE';
        }
        return true;

      case 'NEIGHBORS':
         // 5a. RRT* Find Neighbors
         if (!this.tempNewPoint) { this.microState = 'SAMPLE'; return true; }
         this.tempNeighbors = [];
         const searchRadius = this.params.searchRadius;
         for (let i = 0; i < this.nodes.length; i++) {
            if (dist(this.nodes[i], this.tempNewPoint) <= searchRadius) {
                this.tempNeighbors.push(i);
            }
         }
         this.microState = 'CHOOSE_PARENT';
         return true;

      case 'CHOOSE_PARENT':
         // 5b. RRT* Choose Best Parent
         if (!this.tempNewPoint || !this.tempNearestNode) { this.microState = 'SAMPLE'; return true; }
         
         let bestParentIdx = this.tempNearestNode.id;
         let minCost = this.tempNearestNode.cost + dist(this.tempNearestNode, this.tempNewPoint);

         for (const neighborIdx of this.tempNeighbors) {
            const neighbor = this.nodes[neighborIdx];
            const potentialCost = neighbor.cost + dist(neighbor, this.tempNewPoint);
            if (potentialCost < minCost) {
                if (!checkCollision(neighbor, this.tempNewPoint, this.obstacles)) {
                    minCost = potentialCost;
                    bestParentIdx = neighborIdx;
                }
            }
         }
         this.tempBestParent = bestParentIdx;
         this.microState = 'ADD_NODE';
         return true;

      case 'ADD_NODE':
         // 5. Add Node
         if (!this.tempNewPoint) { this.microState = 'SAMPLE'; return true; }

         let finalParentIdx = this.tempNearestNode?.id || 0;
         let cost = 0;

         if (this.algorithm === 'RRT*' && this.tempBestParent !== null) {
             finalParentIdx = this.tempBestParent;
         }

         const parent = this.nodes[finalParentIdx];
         cost = parent.cost + dist(parent, this.tempNewPoint);

         const newNodeId = this.nodes.length;
         const newNode: Node = {
            id: newNodeId,
            x: this.tempNewPoint.x,
            y: this.tempNewPoint.y,
            parentId: finalParentIdx,
            cost: cost,
            children: []
         };

         this.nodes.push(newNode);
         this.nodes[finalParentIdx].children.push(newNodeId);

         if (this.algorithm === 'RRT*') {
             this.microState = 'REWIRE';
         } else {
             // RRT Done
             this.resetTemp();
             this.microState = 'SAMPLE';
             return false; // Iteration complete
         }
         return true;

      case 'REWIRE':
          // 6. RRT* Rewire
          if (this.algorithm === 'RRT*' && this.tempNewPoint) {
              const newNodeId = this.nodes.length - 1;
              const newNode = this.nodes[newNodeId];

              // Neighbors were calculated in NEIGHBORS step, but we need to check them again 
              // for rewiring direction (neighbor -> new node -> parent?)
              // No, rewiring is: can I reach neighbor CHEAPER through newNode?
              
              for (const neighborIdx of this.tempNeighbors) {
                  // Don't rewire the parent we just attached to
                  if (neighborIdx === newNode.parentId) continue;

                  const neighbor = this.nodes[neighborIdx];
                  const newCostThroughNewNode = newNode.cost + dist(newNode, neighbor);

                  if (newCostThroughNewNode < neighbor.cost) {
                      if (!checkCollision(newNode, neighbor, this.obstacles)) {
                           // Re-parent neighbor to newNode
                           if (neighbor.parentId !== null) {
                               const oldParent = this.nodes[neighbor.parentId];
                               oldParent.children = oldParent.children.filter(id => id !== neighbor.id);
                           }
                           neighbor.parentId = newNodeId;
                           neighbor.cost = newCostThroughNewNode;
                           newNode.children.push(neighbor.id);
                           this.updateCost(neighbor.id);
                      }
                  }
              }
          }
          this.resetTemp();
          this.microState = 'SAMPLE';
          return false; // Iteration complete

      default:
        this.microState = 'SAMPLE';
        return true;
    }
  }

  // Legacy step function for fast execution (runs until one node attempt is finished)
  step(): boolean {
    // Run until iteration finishes
    // We loop until stepMicro returns false.
    // However, to prevent infinite loops if something breaks, we put a safety cap
    let ops = 0;
    while(this.stepMicro() && ops < 20) {
        ops++;
    }
    return true;
  }

  resetTemp() {
    this.tempSample = null;
    this.tempNearestNode = null;
    this.tempNewPoint = null;
    this.tempNeighbors = [];
    this.tempBestParent = null;
  }

  updateCost(nodeId: number) {
    const node = this.nodes[nodeId];
    for (const childId of node.children) {
      const child = this.nodes[childId];
      child.cost = node.cost + dist(node, child);
      this.updateCost(childId);
    }
  }

  getPath(): number[] {
    let closestNode = -1;
    
    let candidates: number[] = [];
    for(let i=0; i<this.nodes.length; i++) {
        if (dist(this.nodes[i], this.goal) <= this.params.stepSize * 1.5) {
            candidates.push(i);
        }
    }

    if (candidates.length === 0) return [];

    candidates.sort((a, b) => this.nodes[a].cost - this.nodes[b].cost);
    closestNode = candidates[0];

    const path: number[] = [];
    let curr: number | null = closestNode;
    while (curr !== null) {
      path.push(curr);
      curr = this.nodes[curr].parentId;
    }
    return path.reverse();
  }
}
