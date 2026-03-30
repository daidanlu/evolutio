import React, { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface SpatialCanvasProps {
    width: number;
    height: number;
    trigger: number
    payoff: { t: number; r: number; p: number; s: number };
    noise: number;
}

export const SpatialCanvas: React.FC<SpatialCanvasProps> = ({ width, height, trigger, payoff, noise }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [generation, setGeneration] = useState(0);
    const [population, setPopulation] = useState({ blue: 0, red: 0 });

    const renderDataToCanvas = (rawData: Uint8Array) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        let blueCount = 0;
        let redCount = 0;

        for (let i = 0; i < rawData.length; i++) {
            const strategy = rawData[i];
            const pixelIndex = i * 4;

            if (strategy === 1) {
                blueCount++;
                data[pixelIndex] = 14; data[pixelIndex + 1] = 165;
                data[pixelIndex + 2] = 233; data[pixelIndex + 3] = 255;
            } else {
                redCount++;
                data[pixelIndex] = 220; data[pixelIndex + 1] = 38;
                data[pixelIndex + 2] = 38; data[pixelIndex + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);


        setPopulation({ blue: blueCount, red: redCount });
    };


    useEffect(() => {
        if (trigger === 0) return;
        setIsPlaying(false);
        setGeneration(0);
        const initGrid = async () => {
            try {
                const rawData: Uint8Array = await invoke("init_spatial_grid", { width, height });
                renderDataToCanvas(rawData);
            } catch (error) {
                console.error("Failed to init grid:", error);
            }
        };
        initGrid();
    }, [width, height, trigger]);


    const stepGrid = async () => {
        try {
            const rawData: Uint8Array = await invoke("step_spatial_grid", {
                payoffMatrix: payoff,
                noise: noise
            });
            renderDataToCanvas(rawData);
            setGeneration(prev => prev + 1);
        } catch (error) {
            console.error("Failed to step grid:", error);
            setIsPlaying(false);
        }
    };

    useEffect(() => {
        let intervalId: number;
        if (isPlaying) {
            intervalId = window.setInterval(() => {
                stepGrid();
            }, 50);
        }
        return () => {
            if (intervalId) window.clearInterval(intervalId);
        };
    }, [isPlaying, payoff, noise]);

    const totalCells = width * height;
    const bluePercent = ((population.blue / totalCells) * 100).toFixed(1);
    const redPercent = ((population.red / totalCells) * 100).toFixed(1);

    return (
        <div className="flex flex-col items-center p-4 bg-gray-900 rounded-xl border border-gray-700 shadow-2xl">
            <div className="flex justify-between w-full mb-2 px-2 items-center">
                <h3 className="text-gray-300 font-bold font-mono text-sm tracking-wider">
                    SPATIAL CA
                </h3>
                <span className="text-xs text-green-500 font-mono border border-green-800 bg-green-900/30 px-2 py-0.5 rounded">
                    GEN: {generation}
                </span>
            </div>

            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{
                    width: `${width * 4}px`,
                    height: `${height * 4}px`,
                    imageRendering: "pixelated",
                }}
                className="border border-gray-600 shadow-[0_0_15px_rgba(0,0,0,0.5)] rounded-sm mb-4"
            />


            <div className="flex gap-2 w-full justify-center mb-4">
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`px-6 py-1 text-sm font-bold border rounded transition-colors ${isPlaying
                        ? "text-red-400 border-red-700 hover:bg-red-900/30"
                        : "text-green-400 border-green-700 hover:bg-green-900/30"
                        }`}
                >
                    {isPlaying ? "[||] PAUSE" : "[>] PLAY"}
                </button>
                <button
                    onClick={stepGrid}
                    disabled={isPlaying}
                    className="px-4 py-1 text-sm font-bold text-gray-400 border border-gray-600 rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    STEP +1
                </button>
            </div>


            <div className="w-full mt-2 px-2">
                <div className="flex justify-between text-[10px] font-mono mb-1">
                    <span className="text-sky-400 font-bold tracking-widest">COOP ({bluePercent}%)</span>
                    <span className="text-red-500 font-bold tracking-widest">DEFECT ({redPercent}%)</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden flex shadow-inner border border-gray-700">
                    <div
                        className="h-full bg-sky-500 transition-all duration-75"
                        style={{ width: `${bluePercent}%` }}
                    />
                    <div
                        className="h-full bg-red-600 transition-all duration-75"
                        style={{ width: `${redPercent}%` }}
                    />
                </div>
            </div>
        </div>
    );
};