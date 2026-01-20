import { Point, Obstacle } from '../types';

export const dist = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

export const samplePoint = (width: number, height: number): Point => {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
  };
};

export const steer = (from: Point, to: Point, stepSize: number): Point => {
  const d = dist(from, to);
  if (d <= stepSize) return to;
  
  const theta = Math.atan2(to.y - from.y, to.x - from.x);
  return {
    x: from.x + stepSize * Math.cos(theta),
    y: from.y + stepSize * Math.sin(theta),
  };
};

// Check if a point is inside any obstacle
export const pointInObstacles = (p: Point, obstacles: Obstacle[]): boolean => {
  return obstacles.some(obs => 
    p.x >= obs.x && 
    p.x <= obs.x + obs.w && 
    p.y >= obs.y && 
    p.y <= obs.y + obs.h
  );
};

// Check if line segment between p1 and p2 intersects any obstacle
// Using a simplified sampling approach for performance in JS loop, 
// or standard line-AABB intersection.
export const lineIntersectsObstacle = (p1: Point, p2: Point, obstacle: Obstacle): boolean => {
  // Simple AABB check first
  const minX = Math.min(p1.x, p2.x);
  const maxX = Math.max(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxY = Math.max(p1.y, p2.y);

  if (maxX < obstacle.x || minX > obstacle.x + obstacle.w ||
      maxY < obstacle.y || minY > obstacle.y + obstacle.h) {
    return false;
  }

  // Check intersection with all 4 sides of the rectangle
  // This is a bit computationally expensive if done naively for thousands of nodes.
  // Optimization: Sampling along the line.
  const d = dist(p1, p2);
  const steps = Math.ceil(d / 5); // Check every 5 pixels
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = p1.x + t * (p2.x - p1.x);
    const y = p1.y + t * (p2.y - p1.y);
    if (x >= obstacle.x && x <= obstacle.x + obstacle.w &&
        y >= obstacle.y && y <= obstacle.y + obstacle.h) {
      return true;
    }
  }
  return false;
};

export const checkCollision = (p1: Point, p2: Point, obstacles: Obstacle[]): boolean => {
  return obstacles.some(obs => lineIntersectsObstacle(p1, p2, obs));
};
