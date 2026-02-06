import { Action } from "./types";

interface GameGridProps {
    rounds: [Action, Action][];
}

export function GameGrid({ rounds }: GameGridProps) {
    return (
        <div className="flex flex-col gap-2 p-4 bg-gray-800 rounded-lg border border-gray-700 mt-4">
            <h3 className="text-xs text-gray-400 uppercase tracking-widest">Match DNA Visualization</h3>

            {/* Render the timeline: from left to right */}
            <div className="flex gap-1 overflow-x-auto pb-2">
                {rounds.map((round, index) => (
                    <div key={index} className="flex flex-col gap-1 min-w-[20px]">
                        {/* Player 1's actions */}
                        <div
                            className={`h-5 w-5 rounded-sm border border-opacity-20 border-white transition-all ${round[0] === "Cooperate" ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" : "bg-red-600 shadow-[0_0_5px_rgba(220,38,38,0.5)]"
                                }`}
                            title={`Round ${index + 1} P1: ${round[0]}`}
                        />
                        {/* Player 2's actions */}
                        <div
                            className={`h-5 w-5 rounded-sm border border-opacity-20 border-white transition-all ${round[1] === "Cooperate" ? "bg-green-500" : "bg-red-600"
                                }`}
                            title={`Round ${index + 1} P2: ${round[1]}`}
                        />
                    </div>
                ))}
            </div>

            {/* legend */}
            <div className="flex gap-4 text-[10px] text-gray-500 font-mono">
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full"></div>COOPERATE</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-600 rounded-full"></div>DEFECT</div>
            </div>
        </div>
    );
}