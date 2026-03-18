import React, { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

interface SpatialCanvasProps {
    width: number;
    height: number;
    trigger: number;
}

export const SpatialCanvas: React.FC<SpatialCanvasProps> = ({ width, height, trigger }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const drawGrid = async () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            try {
                const rawData: Uint8Array = await invoke("init_spatial_grid", { width, height });
                const imageData = ctx.createImageData(width, height);
                const data = imageData.data;

                for (let i = 0; i < rawData.length; i++) {
                    const strategy = rawData[i];
                    const pixelIndex = i * 4;

                    if (strategy === 1) {
                        data[pixelIndex] = 14;
                        data[pixelIndex + 1] = 165;
                        data[pixelIndex + 2] = 233;
                        data[pixelIndex + 3] = 255;
                    } else {
                        data[pixelIndex] = 220;
                        data[pixelIndex + 1] = 38;
                        data[pixelIndex + 2] = 38;
                        data[pixelIndex + 3] = 255;
                    }
                }
                ctx.putImageData(imageData, 0, 0);
            } catch (error) {
                console.error("Failed to initialize spatial grid:", error);
            }
        };

        drawGrid();
    }, [width, height, trigger]);

    return (
        <div className="flex flex-col items-center p-4 bg-gray-900 rounded-xl border border-gray-700 shadow-2xl">
            <h3 className="text-gray-300 font-bold mb-4 font-mono text-sm tracking-wider">
                SPATIAL ECOSYSTEM (2D CA)
            </h3>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{
                    width: `${width * 4}px`,
                    height: `${height * 4}px`,
                    imageRendering: "pixelated",
                }}
                className="border border-gray-600 shadow-[0_0_15px_rgba(0,0,0,0.5)] rounded-sm"
            />
        </div>
    );
};