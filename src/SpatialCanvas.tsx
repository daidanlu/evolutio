import React, { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface SpatialCanvasProps {
    width: number;
    height: number;
    trigger: number
    payoff: { t: number; r: number; p: number; s: number };
}

export const SpatialCanvas: React.FC<SpatialCanvasProps> = ({ width, height, trigger, payoff }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [generation, setGeneration] = useState(0);

    const renderDataToCanvas = (rawData: Uint8Array) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        for (let i = 0; i < rawData.length; i++) {
            const strategy = rawData[i];
            const pixelIndex = i * 4;

            if (strategy === 1) {
                data[pixelIndex] = 14; data[pixelIndex + 1] = 165;
                data[pixelIndex + 2] = 233; data[pixelIndex + 3] = 255;
            } else {
                data[pixelIndex] = 220; data[pixelIndex + 1] = 38;
                data[pixelIndex + 2] = 38; data[pixelIndex + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);
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
            const rawData: Uint8Array = await invoke("step_spatial_grid", { payoffMatrix: payoff });
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
    }, [isPlaying, payoff]);

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


            <div className="flex gap-2">
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
        </div>
    );
};