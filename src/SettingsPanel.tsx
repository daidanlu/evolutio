interface Props {
    speed: number;
    setSpeed: (v: number) => void;
    rounds: number;
    setRounds: (v: number) => void;
    noise: number;
    setNoise: (v: number) => void;
    generations: number;
    setGenerations: (val: number) => void;
}

export function SettingsPanel({ speed, setSpeed, rounds, setRounds, noise, setNoise, generations, setGenerations }: Props) {
    return (
        <div className="p-4 bg-gray-800 rounded border border-gray-700 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Simulation Parameters</h3>

            {/* Speed ​​control (slider) */}
            <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-gray-300">
                    <span>Speed (Delay)</span>
                    <span className="font-mono text-green-400">{speed}ms</span>
                </div>
                <input
                    type="range"
                    min="50" max="1000" step="50"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
                <div className="flex justify-between text-[10px] text-gray-500">
                    <span>Fast (50ms)</span>
                    <span>Slow (1000ms)</span>
                </div>
            </div>

            {/* Number of rounds control (numeric input) */}
            <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-gray-300">
                    <span>Total Rounds</span>
                    <span className="font-mono text-green-400">{rounds}</span>
                </div>
                <input
                    type="number"
                    min="1" max="100"
                    value={rounds}
                    onChange={(e) => setRounds(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-600 rounded p-1 text-xs text-center text-white focus:border-green-500 outline-none"
                />
            </div>

            <div className="flex flex-col gap-1 mt-2">
                <div className="flex justify-between text-xs text-gray-300">
                    <span>Generations (Evolution)</span>
                    <span className="font-mono text-purple-400">{generations}</span>
                </div>
                <input
                    type="range"
                    min="10"
                    max="200"
                    step="10"
                    value={generations}
                    onChange={(e) => setGenerations(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">
                    SIGNAL NOISE: {(noise * 100).toFixed(0)}%
                </label>
                <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.01"
                    value={noise}
                    onChange={(e) => setNoise(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <p className="text-[10px] text-gray-600 mt-1">
                    Probability of "trembling hand" error.
                </p>
            </div>
        </div>
    );
}