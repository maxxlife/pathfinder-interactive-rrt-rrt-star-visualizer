
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Canvas from './components/Canvas';
import Stats from './components/Stats';
import CodeViewer from './components/CodeViewer';
import { AlgorithmType, Node, Obstacle, Point, SolverParams, CodeStep } from './types';
import { RRTTree } from './services/rrt';
import { getExplanation } from './services/ai';
import { Play, Pause, RotateCcw, Trash2, Info, BrainCircuit, StepForward, Grid3X3, Square, ArrowRight, Zap, Code } from 'lucide-react';

const WIDTH = 800;
const HEIGHT = 600;

function App() {
  // --- State ---
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('RRT');
  const [isRunning, setIsRunning] = useState(false);
  const [iteration, setIteration] = useState(0);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [path, setPath] = useState<number[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([
    { x: 300, y: 150, w: 50, h: 300 },
    { x: 500, y: 150, w: 50, h: 300 },
    { x: 350, y: 280, w: 150, h: 50 }
  ]);
  const [start, setStart] = useState<Point>({ x: 50, y: HEIGHT / 2 });
  const [goal, setGoal] = useState<Point>({ x: WIDTH - 50, y: HEIGHT / 2 });
  const [found, setFound] = useState(false);
  
  // Params
  const [stepSize, setStepSize] = useState(30);
  const [maxIterations, setMaxIterations] = useState(2000);
  const [goalBias, setGoalBias] = useState(0.05);
  const [searchRadius, setSearchRadius] = useState(60);

  // Code Visualization State
  const [isCodeOpen, setIsCodeOpen] = useState(false);
  const [currentCodeStep, setCurrentCodeStep] = useState<CodeStep>('SAMPLE');
  
  // Visual Temp State
  const [tempSample, setTempSample] = useState<Point | null>(null);
  const [tempNewPoint, setTempNewPoint] = useState<Point | null>(null);
  const [tempNearest, setTempNearest] = useState<Node | null>(null);

  // AI Explanation
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  // Solver Instance Ref
  const treeRef = useRef<RRTTree | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // --- Handlers ---

  const resetSimulation = useCallback(() => {
    setIsRunning(false);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setNodes([]);
    setPath([]);
    setIteration(0);
    setFound(false);
    // Reset visual temp vars
    setTempSample(null);
    setTempNewPoint(null);
    setTempNearest(null);
    setCurrentCodeStep('SAMPLE');
    
    treeRef.current = null;
  }, []);

  const handleClearObstacles = () => {
    setObstacles([]);
  };

  const handleRemoveObstacle = (index: number) => {
    const newObs = [...obstacles];
    newObs.splice(index, 1);
    setObstacles(newObs);
  };

  const loadPreset = (type: 'default' | 'maze' | 'narrow') => {
    resetSimulation();
    let newObs: Obstacle[] = [];
    if (type === 'default') {
        newObs = [
            { x: 300, y: 150, w: 50, h: 300 },
            { x: 500, y: 150, w: 50, h: 300 },
            { x: 350, y: 280, w: 150, h: 50 }
        ];
    } else if (type === 'narrow') {
        const gap = 40;
        const midY = HEIGHT / 2;
        newObs = [
             { x: 200, y: 0, w: 50, h: midY - gap },
             { x: 200, y: midY + gap, w: 50, h: midY - gap },
             { x: 500, y: 0, w: 50, h: midY - gap - 50 },
             { x: 500, y: midY + gap - 50, w: 50, h: midY - gap + 50 },
        ];
    } else if (type === 'maze') {
        for(let i=0; i<25; i++) {
            newObs.push({
                x: Math.random() * (WIDTH - 150) + 75,
                y: Math.random() * (HEIGHT - 100) + 50,
                w: Math.random() * 80 + 20,
                h: Math.random() * 80 + 20
            });
        }
    }
    setObstacles(newObs);
  };

  const initTree = () => {
    if (!treeRef.current) {
      const params: SolverParams = { stepSize, maxIterations, goalBias, searchRadius };
      treeRef.current = new RRTTree(WIDTH, HEIGHT, start, goal, obstacles, params, algorithm);
      setNodes(treeRef.current.nodes);
    }
  };

  // Sync state from tree to React state for rendering
  const syncTreeState = (tree: RRTTree) => {
      setNodes([...tree.nodes]);
      setIteration(tree.nodes.length);
      setCurrentCodeStep(tree.microState);
      setTempSample(tree.tempSample);
      setTempNewPoint(tree.tempNewPoint);
      setTempNearest(tree.tempNearestNode);
      
      const currentPath = tree.getPath();
      if (currentPath.length > 0) {
         setPath(currentPath);
         if (!found) {
            setFound(true);
            if(algorithm === 'RRT') setIsRunning(false);
         }
      }
      if (tree.nodes.length >= maxIterations) {
        setIsRunning(false);
      }
  };

  const step = () => {
    if (!treeRef.current) initTree();
    const tree = treeRef.current!;
    
    let changed = false;

    // If code view is open, we run slowly (or just normal speed but highlighting might blur)
    // Actually, if running automatically, we probably want to use the bulk step for performance,
    // OR if we want to visualize "execution", we stepMicro.
    // Let's use stepMicro but multiple times if not debugging?
    // No, if the user requested "execution steps", let's make the running speed decent but using micro steps if Code View is open might be too fast to see.
    // Let's assume: If Code View is OPEN, we slow down the auto-play? Or we just flash the lines.
    // Simpler: If Code View is OPEN, "Step" does 1 line. "Play" does full speed (iterations).
    
    // For "Play" loop:
    const stepsPerFrame = isCodeOpen ? 1 : 5; 
    
    for(let i=0; i<stepsPerFrame; i++) {
        // If code open, maybe we just run one micro step per frame?
        if (isCodeOpen) {
            // Run one microstep
             tree.stepMicro();
             changed = true;
        } else {
            // Run full iteration
            if(tree.step()) changed = true;
        }
    }

    if (changed) {
      syncTreeState(tree);
    }
  };

  const handleStep = () => {
    if (isRunning) {
        setIsRunning(false);
        return;
    }

    if (!treeRef.current) initTree();
    const tree = treeRef.current!;
    
    if (isCodeOpen) {
        // Step one line of code
        tree.stepMicro();
    } else {
        // Step one full iteration
        tree.step();
    }
    syncTreeState(tree);
  };

  const togglePlay = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      if (nodes.length >= maxIterations) {
          resetSimulation();
      } else if (found) {
          if (algorithm === 'RRT') {
             resetSimulation();
          }
      }
      setIsRunning(true);
    }
  };

  useEffect(() => {
    if (isRunning) {
      let lastTime = 0;
      const animate = (time: number) => {
        // If Code Open, slow down animation to make it readable?
        // Let's cap at 30fps if code open, 60fps if closed
        const limit = isCodeOpen ? 100 : 16; 
        
        if (time - lastTime > limit) { 
            step();
            lastTime = time;
        }
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
    return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRunning, algorithm, obstacles, start, goal, found, isCodeOpen]); 

  useEffect(() => {
    resetSimulation();
  }, [algorithm, stepSize, goalBias, searchRadius, obstacles, start, goal, resetSimulation]);


  const handleExplain = async () => {
    setLoadingExplanation(true);
    const topic = algorithm === 'RRT' 
        ? "Rapidly-exploring Random Trees (RRT) algorithm" 
        : "RRT* (Optimal RRT) algorithm";
    const text = await getExplanation(topic);
    setExplanation(text);
    setLoadingExplanation(false);
  };

  const pathCost = path.length > 0 && treeRef.current ? treeRef.current.nodes[path[0]].cost : null;
  
  const getPlayButtonText = () => {
    if (isRunning) return "Pause";
    if (found && algorithm === 'RRT*') return "Optimize";
    if (found || nodes.length >= maxIterations) return "Restart";
    return "Start";
  };

  const getPlayButtonIcon = () => {
     if (isRunning) return <Pause size={16} />;
     if (found && algorithm === 'RRT*') return <Zap size={16} />;
     if (found || nodes.length >= maxIterations) return <RotateCcw size={16} />;
     return <Play size={16} />;
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200">
      
      {/* Sidebar Controls */}
      <div className="w-80 flex-shrink-0 border-r border-slate-800 bg-slate-900 p-6 flex flex-col overflow-y-auto z-10">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BrainCircuit className="text-blue-500" />
            PathFinder
          </h1>
          <p className="text-xs text-slate-500 mt-1">Interactive RRT & RRT* Visualizer</p>
        </header>

        <div className="space-y-6 flex-grow">
          
          {/* Algorithm Toggle */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Algorithm</label>
            <div className="flex bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setAlgorithm('RRT')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${algorithm === 'RRT' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                RRT
              </button>
              <button
                onClick={() => setAlgorithm('RRT*')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${algorithm === 'RRT*' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                RRT*
              </button>
            </div>
            
             {/* Visual Difference Guide */}
            <div className={`p-3 rounded-lg border text-xs leading-relaxed transition-colors ${algorithm === 'RRT' ? 'bg-blue-900/20 border-blue-800 text-blue-200' : 'bg-emerald-900/20 border-emerald-800 text-emerald-200'}`}>
                <div className="font-bold mb-1 flex items-center gap-1">
                    {algorithm === 'RRT' ? <ArrowRight size={12}/> : <RotateCcw size={12}/>}
                    What to watch for:
                </div>
                {algorithm === 'RRT' ? (
                    <ul className="list-disc list-inside space-y-1 opacity-90">
                        <li>Tree grows randomly to fill space.</li>
                        <li>Path is jagged and <b>not optimized</b>.</li>
                        <li>Stops immediately when Goal is reached.</li>
                    </ul>
                ) : (
                    <ul className="list-disc list-inside space-y-1 opacity-90">
                        <li>Stops on first path found (like RRT).</li>
                        <li>Click <b>Optimize</b> to continue improving.</li>
                        <li>Path straightens as nodes <b>rewire</b>.</li>
                    </ul>
                )}
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Map Controls */}
          <div className="space-y-3">
             <label className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Map Presets</label>
             <div className="grid grid-cols-2 gap-2">
                <button onClick={() => loadPreset('default')} className="bg-slate-800 hover:bg-slate-700 p-2 rounded text-xs text-slate-300 transition-colors flex items-center justify-center gap-1">
                    <Square size={12}/> Default
                </button>
                <button onClick={() => loadPreset('narrow')} className="bg-slate-800 hover:bg-slate-700 p-2 rounded text-xs text-slate-300 transition-colors flex items-center justify-center gap-1">
                    <ArrowRight size={12}/> Narrow
                </button>
                <button onClick={() => loadPreset('maze')} className="bg-slate-800 hover:bg-slate-700 p-2 rounded text-xs text-slate-300 transition-colors flex items-center justify-center gap-1">
                    <Grid3X3 size={12}/> Random
                </button>
                <button onClick={handleClearObstacles} className="bg-slate-800 hover:bg-rose-900/30 text-rose-400 p-2 rounded text-xs transition-colors flex items-center justify-center gap-1">
                    <Trash2 size={12}/> Clear
                </button>
             </div>
             <p className="text-[10px] text-slate-500 mt-1">
                 Tip: Drag on canvas to draw custom walls. Right-click to delete.
             </p>
          </div>

          <hr className="border-slate-800" />

          {/* Parameters */}
          <div className="space-y-5">
            <label className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Parameters</label>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Step Size</span>
                <span className="text-slate-200">{stepSize}px</span>
              </div>
              <input 
                type="range" min="10" max="100" value={stepSize} 
                onChange={(e) => setStepSize(Number(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

             <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Max Iterations</span>
                <span className="text-slate-200">{maxIterations}</span>
              </div>
              <input 
                type="range" min="500" max="5000" step="500" value={maxIterations} 
                onChange={(e) => setMaxIterations(Number(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Goal Bias</span>
                <span className="text-slate-200">{(goalBias * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" min="0" max="0.5" step="0.01" value={goalBias} 
                onChange={(e) => setGoalBias(Number(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
            
             <div className="space-y-1">
               <div className="flex justify-between text-xs">
                 <span className="text-slate-400">Rewire Radius</span>
                 <span className="text-slate-200">{searchRadius}px</span>
               </div>
               <input 
                 type="range" min="20" max="150" step="10" value={searchRadius} 
                 onChange={(e) => setSearchRadius(Number(e.target.value))}
                 disabled={algorithm === 'RRT'}
                 className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50"
               />
             </div>
          </div>


           {/* AI Explanation Section */}
           <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                 <label className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                    <Info size={12}/> AI Explanation
                 </label>
                 <button 
                    onClick={handleExplain}
                    disabled={loadingExplanation}
                    className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded transition-colors disabled:opacity-50"
                 >
                    {loadingExplanation ? "Generating..." : "Ask AI"}
                 </button>
              </div>
              
              {explanation && (
                <div className="bg-slate-800/50 p-3 rounded border border-slate-700 text-xs text-slate-300 leading-relaxed max-h-40 overflow-y-auto">
                    {explanation}
                </div>
              )}
           </div>

        </div>

        <footer className="mt-4 text-[10px] text-slate-600">
           &copy; 2024 PathFinder Demo
        </footer>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col relative">
        <div className="absolute top-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none -z-10"></div>
        
        {/* Top Bar Stats */}
        <div className="p-6 pb-2 z-10">
             <Stats 
                nodeCount={nodes.length} 
                pathLength={pathCost} 
                found={found} 
                algorithm={algorithm}
             />
        </div>

        {/* Canvas Wrapper */}
        <div className="flex-1 p-6 pt-0 flex flex-col min-h-0 relative">
             {/* Code Viewer Overlay */}
             <CodeViewer 
                algorithm={algorithm}
                currentStep={currentCodeStep}
                isOpen={isCodeOpen}
                onClose={() => setIsCodeOpen(false)}
             />

             <div className="flex items-center justify-between mb-2">
                <div className="flex gap-2">
                    <button 
                        onClick={togglePlay}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm transition-all min-w-[100px] justify-center ${
                            isRunning 
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/50 hover:bg-amber-500/20' 
                            : found && algorithm === 'RRT*'
                                ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20'
                                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20'
                        }`}
                    >
                        {getPlayButtonIcon()}
                        {getPlayButtonText()}
                    </button>
                    
                    <button 
                        onClick={handleStep}
                        disabled={isRunning || (found && algorithm === 'RRT') || nodes.length >= maxIterations}
                        className="flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title={isCodeOpen ? "Step (One Line of Code)" : "Step (One Iteration)"}
                    >
                        <StepForward size={16} />
                        Step
                    </button>

                    <button 
                        onClick={resetSimulation}
                        className="flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all"
                    >
                        <RotateCcw size={16} />
                        Reset
                    </button>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsCodeOpen(!isCodeOpen)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                            isCodeOpen 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                    >
                        <Code size={14} />
                        {isCodeOpen ? "Hide Code" : "Show Code"}
                    </button>
                </div>
             </div>

             <div className="flex-1 bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-800 flex items-center justify-center relative">
                <Canvas 
                    nodes={nodes}
                    path={path}
                    obstacles={obstacles}
                    start={start}
                    goal={goal}
                    width={WIDTH}
                    height={HEIGHT}
                    onObstacleAdd={(obs) => setObstacles([...obstacles, obs])}
                    onObstacleRemove={handleRemoveObstacle}
                    onStartMove={setStart}
                    onGoalMove={setGoal}
                    isRunning={isRunning}
                    tempSample={tempSample}
                    tempNewPoint={tempNewPoint}
                    tempNearest={tempNearest}
                />
             </div>
        </div>
      </div>
    </div>
  );
}

export default App;
