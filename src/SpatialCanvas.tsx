import React, { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface SpatialCanvasProps {
    width: number;
    height: number;
    trigger: number;
    payoff: { t: number; r: number; p: number; s: number };
    noise: number;
}

export const SpatialCanvas: React.FC<SpatialCanvasProps> = ({ width, height, trigger, payoff, noise }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [generation, setGeneration] = useState(0);
    const [population, setPopulation] = useState({ blue: 0, red: 0 });
    const [showSaved, setShowSaved] = useState(false);
    const [isPainting, setIsPainting] = useState(false);
    const [paintStrategy, setPaintStrategy] = useState<number>(1);
    const [brushSize, setBrushSize] = useState<number>(3);
    const [fps, setFps] = useState<number>(20);
    const [clustering, setClustering] = useState<string>("0.0");

    // Volatility and ESS states
    const [volatility, setVolatility] = useState<string>("0.00");
    const [isESS, setIsESS] = useState<boolean>(false);

    // Cache previous generation to visualize state transitions
    const prevDataRef = useRef<Uint8Array | null>(null);
    
    // Concurrency Lock: Prevents asynchronous invoke stack overflow during high FPS rendering
    const isProcessingRef = useRef<boolean>(false); 

    const renderDataToCanvas = (rawData: Uint8Array) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        let blueCount = 0;
        let redCount = 0;
        let mutatedCount = 0;

        const prevData = prevDataRef.current;

        for (let i = 0; i < rawData.length; i++) {
            const current = rawData[i];
            const previous = prevData ? prevData[i] : current; 
            const pixelIndex = i * 4;

            if (current === 1) {
                blueCount++;
                if (previous === 1) {
                    // Stable Cooperator (Blue)
                    data[pixelIndex] = 14; data[pixelIndex + 1] = 165; data[pixelIndex + 2] = 233; data[pixelIndex + 3] = 255;
                } else {
                    // Converted Cooperator (Green)
                    data[pixelIndex] = 52; data[pixelIndex + 1] = 211; data[pixelIndex + 2] = 153; data[pixelIndex + 3] = 255;
                    mutatedCount++;
                }
            } else {
                redCount++;
                if (previous === 0) {
                    // Stable Defector (Red)
                    data[pixelIndex] = 220; data[pixelIndex + 1] = 38; data[pixelIndex + 2] = 38; data[pixelIndex + 3] = 255;
                } else {
                    // Exploited Defector (Yellow)
                    data[pixelIndex] = 251; data[pixelIndex + 1] = 191; data[pixelIndex + 2] = 36; data[pixelIndex + 3] = 255;
                    mutatedCount++;
                }
            }
        }
        ctx.putImageData(imageData, 0, 0);
        setPopulation({ blue: blueCount, red: redCount });

        // Calculate Spatial Clustering Index (Assortativity)
        let sameEdges = 0;
        let totalEdges = 0;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                const current = rawData[idx];

                if (x < width - 1) {
                    totalEdges++;
                    if (current === rawData[idx + 1]) sameEdges++;
                }
                if (y < height - 1) {
                    totalEdges++;
                    if (current === rawData[idx + width]) sameEdges++;
                }
            }
        }

        const clusteringPercent = totalEdges > 0 ? ((sameEdges / totalEdges) * 100).toFixed(1) : "0.0";
        setClustering(clusteringPercent);

        // Calculate System Volatility metrics
        const volPercent = ((mutatedCount / (width * height)) * 100).toFixed(2);
        setVolatility(volPercent);

        // Stale Closure Bypass: Evaluate previous data reference to determine valid halting state
        if (prevData !== null && mutatedCount === 0) {
            setIsESS(true);
            setIsPlaying(false); // Force halt execution safely
        } else {
            setIsESS(false);
        }

        // Store current frame state for temporal comparison in the next generation
        prevDataRef.current = new Uint8Array(rawData);
    };

    const handlePaint = async (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isPainting || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        const scaleX = width / rect.width;
        const scaleY = height / rect.height;

        const x = Math.floor((e.clientX - rect.left) * scaleX);
        const y = Math.floor((e.clientY - rect.top) * scaleY);

        try {
            const rawData: Uint8Array = await invoke("paint_spatial_grid", {
                x: x,
                y: y,
                strategyVal: paintStrategy,
                brushSize: brushSize
            });
            renderDataToCanvas(rawData);
        } catch (error) {
            console.error("Failed to paint grid:", error);
        }
    };

    const startPainting = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsPainting(true);
        if (canvasRef.current) {
            setTimeout(() => setIsPainting(true), 0);
        }
    };

    // Genesis Matrix Macro: Overwrites the entire grid with a homogeneous strategy
    const executeWipe = async (strategyVal: number) => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;
        try {
            const rawData: Uint8Array = await invoke("paint_spatial_grid", {
                x: Math.floor(width / 2),
                y: Math.floor(height / 2),
                strategyVal: strategyVal,
                brushSize: Math.max(width, height) * 2 
            });
            prevDataRef.current = null;
            setGeneration(0);
            renderDataToCanvas(rawData);
        } catch (error) {
            console.error("Failed to execute grid wipe:", error);
        } finally {
            isProcessingRef.current = false;
        }
    };

    // Patient Zero Protocol: Injects a singular defector agent at the geometric center
    const executePatientZero = async () => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;
        try {
            const rawData: Uint8Array = await invoke("paint_spatial_grid", {
                x: Math.floor(width / 2),
                y: Math.floor(height / 2),
                strategyVal: 0, 
                brushSize: 1    
            });
            prevDataRef.current = null;
            setGeneration(0);
            renderDataToCanvas(rawData);
        } catch (error) {
            console.error("Failed to inject Patient Zero anomaly:", error);
        } finally {
            isProcessingRef.current = false;
        }
    };

    useEffect(() => {
        if (trigger === 0) return;
        setIsPlaying(false);
        setGeneration(0);
        setIsESS(false);
        prevDataRef.current = null; 
        isProcessingRef.current = false; 
        
        const initGrid = async () => {
            try {
                const rawData: Uint8Array = await invoke("init_spatial_grid", { width, height });
                renderDataToCanvas(rawData);
            } catch (error) {
                console.error("Failed to initialize spatial grid:", error);
            }
        };
        initGrid();
    }, [width, height, trigger]);

    const stepGrid = async () => {
        // Concurrency Lock Check: Drop frame if the previous IPC cycle is unresolved
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        try {
            const rawData: Uint8Array = await invoke("step_spatial_grid", {
                payoffMatrix: payoff,
                noise: noise
            });
            renderDataToCanvas(rawData);
            setGeneration(prev => prev + 1);
        } catch (error) {
            console.error("Failed to step computational grid:", error);
            setIsPlaying(false);
        } finally {
            isProcessingRef.current = false;
        }
    };

    useEffect(() => {
        let intervalId: number;
        if (isPlaying) {
            intervalId = window.setInterval(() => {
                stepGrid();
            }, 1000 / fps);
        }
        return () => {
            if (intervalId) window.clearInterval(intervalId);
        };
    }, [isPlaying, payoff, noise, fps]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }
            switch (e.code) {
                case "Space":
                    e.preventDefault();
                    setIsPlaying(prev => !prev);
                    break;
                case "ArrowRight":
                case "KeyS":
                    if (!isPlaying) stepGrid();
                    break;
                case "Digit1":
                case "KeyC":
                    setPaintStrategy(1);
                    break;
                case "Digit2":
                case "KeyD":
                    setPaintStrategy(0);
                    break;
                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isPlaying, stepGrid]);

    const totalCells = width * height;
    const bluePercent = ((population.blue / totalCells) * 100).toFixed(1);
    const redPercent = ((population.red / totalCells) * 100).toFixed(1);

    // Background Telemetry Synchronization
    useEffect(() => {
        if (isPlaying) {
            document.title = `[GEN ${generation}] COOP ${bluePercent}% | DEFECT ${redPercent}%`;
        } else {
            document.title = "EVOLUTIO | Axelrod Engine";
        }
        return () => { document.title = "EVOLUTIO | Axelrod Engine"; };
    }, [generation, bluePercent, redPercent, isPlaying]);

    const downloadSnapshot = () => {
        if (!canvasRef.current) return;
        const scale = 10;
        const offscreenCanvas = document.createElement("canvas");
        offscreenCanvas.width = width * scale;
        offscreenCanvas.height = height * scale;

        const offCtx = offscreenCanvas.getContext("2d");
        if (!offCtx) return;

        offCtx.imageSmoothingEnabled = false;
        offCtx.drawImage(
            canvasRef.current,
            0, 0, width, height,
            0, 0, offscreenCanvas.width, offscreenCanvas.height
        );

        const dataUrl = offscreenCanvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `evolutio_snapshot_gen${generation}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
    };

    // Dynamic Reactor Aura: Computes canvas box-shadow luminescence based on kinetic volatility
    const volNum = parseFloat(volatility);
    let canvasGlow = "shadow-[0_0_15px_rgba(0,0,0,0.5)] border-gray-600"; 
    if (isESS) {
        canvasGlow = "shadow-[0_0_40px_rgba(250,204,21,0.3)] border-yellow-500/50"; // ESS Absorbing State
    } else if (volNum > 10) {
        canvasGlow = "shadow-[0_0_50px_rgba(220,38,38,0.4)] border-red-500/50"; // High Kinetic Conflict
    } else if (volNum > 2) {
        canvasGlow = "shadow-[0_0_30px_rgba(245,158,11,0.3)] border-orange-500/40"; // Localized Boundary Shifts
    } else if (volNum > 0) {
        canvasGlow = "shadow-[0_0_30px_rgba(14,165,233,0.2)] border-sky-500/30"; // Stabilization Phase
    }

    return (
        <div className="flex flex-col items-center p-4 bg-gray-900 rounded-xl border border-gray-700 shadow-2xl">
            <div className="flex justify-between w-full mb-2 px-2 items-center">
                <div className="flex items-center gap-3">
                    <h3 className="text-gray-300 font-bold font-mono text-sm tracking-wider">
                        SPATIAL CA
                    </h3>
                    {isESS && (
                        <span className="text-[10px] font-bold text-yellow-400 bg-yellow-900/40 border border-yellow-500 px-1.5 py-0.5 rounded animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.4)]">
                            ESS REACHED
                        </span>
                    )}
                </div>
                <span className="text-xs text-green-500 font-mono border border-green-800 bg-green-900/30 px-2 py-0.5 rounded">
                    GEN: {generation}
                </span>
            </div>

            <div className="flex gap-2 w-full justify-center mb-2">
                <button
                    onClick={() => setPaintStrategy(1)}
                    className={`px-3 py-1 text-xs font-bold rounded border transition-all ${paintStrategy === 1 ? 'bg-sky-900/50 border-sky-500 text-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.4)]' : 'border-gray-600 text-gray-400 hover:border-gray-400'}`}
                >
                    BLUE (1)
                </button>
                <button
                    onClick={() => setPaintStrategy(0)}
                    className={`px-3 py-1 text-xs font-bold rounded border transition-all ${paintStrategy === 0 ? 'bg-red-900/50 border-red-500 text-red-400 shadow-[0_0_8px_rgba(220,38,38,0.4)]' : 'border-gray-600 text-gray-400 hover:border-gray-400'}`}
                >
                    RED (2)
                </button>
                <div className="flex items-center gap-2 px-2 text-xs text-gray-400 bg-gray-800 rounded border border-gray-700">
                    <span title="Brush Size">SIZE</span>
                    <input type="range" min="1" max="10" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-16 accent-gray-400 cursor-pointer" />
                </div>
                
                {/* Environmental Macro Operations */}
                <div className="flex gap-1 ml-2 pl-2 border-l border-gray-700">
                    <button 
                        onClick={() => executeWipe(1)} 
                        className="px-2 py-1 text-[10px] font-bold text-sky-400 border border-sky-800 rounded hover:bg-sky-900/50 transition-all"
                        title="Flood the entire grid with Cooperators"
                    >
                        FLOOD
                    </button>
                    <button 
                        onClick={executePatientZero} 
                        className="px-2 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-800 rounded hover:bg-emerald-900/50 transition-all"
                        title="Inject a single Defector (Patient Zero) in the center"
                    >
                        PT-ZERO
                    </button>
                    <button 
                        onClick={() => executeWipe(0)} 
                        className="px-2 py-1 text-[10px] font-bold text-red-500 border border-red-900 rounded hover:bg-red-900/50 transition-all"
                        title="Nuke the entire grid with Defectors"
                    >
                        NUKE
                    </button>
                </div>
            </div>

            {/* Spatial Grid Rendering Canvas */}
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{
                    width: `${width * 4}px`,
                    height: `${height * 4}px`,
                    imageRendering: "pixelated",
                    cursor: "crosshair"
                }}
                className={`border rounded-sm mb-4 transition-all duration-700 ${canvasGlow}`}
                onMouseDown={(e) => {
                    setIsPainting(true);
                    handlePaint(e);
                }}
                onMouseMove={handlePaint}
                onMouseUp={() => setIsPainting(false)}
                onMouseLeave={() => setIsPainting(false)}
            />

            <div className="flex gap-2 w-full justify-center mb-4">
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`px-6 py-1 text-sm font-bold border rounded transition-colors ${isPlaying
                        ? "text-red-400 border-red-700 hover:bg-red-900/30"
                        : "text-green-400 border-green-700 hover:bg-green-900/30"
                        }`}
                >
                    {isPlaying ? "PAUSE (Space)" : "PLAY (Space)"}
                </button>
                <button
                    onClick={stepGrid}
                    disabled={isPlaying}
                    className="px-4 py-1 text-sm font-bold text-gray-400 border border-gray-600 rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    STEP +1 (→)
                </button>
                <button
                    onClick={downloadSnapshot}
                    disabled={showSaved}
                    className={`px-4 py-1 text-sm font-bold border rounded transition-all duration-300 ${showSaved
                        ? "text-green-400 border-green-500 bg-green-900/30 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                        : "text-sky-400 border-sky-800 hover:bg-sky-900/30"
                        }`}
                >
                    {showSaved ? "SAVED!" : "SNAPSHOT"}
                </button>
                <div className="flex flex-col ml-2 pl-4 border-l border-gray-700">
                    <div className="flex justify-between items-center w-full mb-1">
                        <span className="text-[10px] font-bold text-gray-400 tracking-wider">SPEED</span>
                        <span className="text-[10px] text-sky-400 font-mono">{fps} FPS</span>
                    </div>
                    <input
                        type="range" min="1" max="60" value={fps}
                        onChange={(e) => setFps(Number(e.target.value))}
                        className="w-24 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                </div>
            </div>

            <div className="w-full mt-2 px-2 flex flex-col gap-1">
                <div className="flex justify-between items-end mb-1">
                    <div className="flex gap-4">
                        <span className="text-[10px] text-sky-400 font-bold tracking-widest">COOP ({bluePercent}%)</span>
                        <span className="text-[10px] text-red-500 font-bold tracking-widest">DEFECT ({redPercent}%)</span>
                    </div>
                    
                    <div className="flex gap-4 items-end">
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] text-gray-500 uppercase tracking-widest">Volatility</span>
                            <span className={`text-xs font-mono font-bold ${volatility === "0.00" ? 'text-gray-500' : 'text-orange-400'}`}>
                                {volatility}%
                            </span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] text-gray-500 uppercase tracking-widest">Clustering</span>
                            <span className="text-xs text-purple-400 font-mono font-bold">{clustering}%</span>
                        </div>
                    </div>
                </div>

                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden flex shadow-inner border border-gray-700">
                    <div className="h-full bg-sky-500 transition-all duration-75" style={{ width: `${bluePercent}%` }} />
                    <div className="h-full bg-red-600 transition-all duration-75" style={{ width: `${redPercent}%` }} />
                </div>
            </div>

            <div className="w-full px-2 mt-4 grid grid-cols-2 gap-x-2 gap-y-3 text-[9px] font-mono border-t border-gray-800 pt-3">
                <div className="flex items-center gap-2 text-sky-400"><div className="w-3 h-3 bg-[#0ea5e9]"></div> STABLE COOP</div>
                <div className="flex items-center gap-2 text-emerald-400"><div className="w-3 h-3 bg-[#34d399]"></div> NEW COOP (CONVERTED)</div>
                <div className="flex items-center gap-2 text-red-500"><div className="w-3 h-3 bg-[#dc2626]"></div> STABLE DEFECT</div>
                <div className="flex items-center gap-2 text-amber-400"><div className="w-3 h-3 bg-[#fbbf24]"></div> NEW DEFECT (EXPLOITED)</div>
            </div>
        </div>
    );
};