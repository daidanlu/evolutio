export interface Payoff {
    t: number;
    r: number;
    p: number;
    s: number;
}

interface Props {
    speed: number;
    setSpeed: (v: number) => void;
    rounds: number;
    setRounds: (v: number) => void;
    noise: number;
    setNoise: (v: number) => void;
    generations: number;
    setGenerations: (val: number) => void;
    payoff: Payoff;
    setPayoff: (p: Payoff) => void;
}

const PRESETS = [
    { name: "PRISONER", vals: { t: 5, r: 3, p: 1, s: 0 }, color: "text-red-400", border: "border-red-900", bg: "hover:bg-red-900/30" },
    { name: "SNOWDRIFT", vals: { t: 5, r: 3, p: 0, s: 1 }, color: "text-blue-400", border: "border-blue-900", bg: "hover:bg-blue-900/30" },
    { name: "STAG HUNT", vals: { t: 3, r: 5, p: 1, s: 0 }, color: "text-green-400", border: "border-green-900", bg: "hover:bg-green-900/30" },
    { name: "HARMONY", vals: { t: 1, r: 5, p: 0, s: 3 }, color: "text-yellow-400", border: "border-yellow-900", bg: "hover:bg-yellow-900/30" },
];

export function SettingsPanel({
    speed, setSpeed, rounds, setRounds, noise, setNoise, generations, setGenerations, payoff, setPayoff
}: Props) {
    return (
        <div className="p-4 bg-gray-800 rounded border border-gray-700 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Simulation Parameters</h3>

            <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-gray-300">
                    <span>Speed (Delay)</span>
                    <span className="font-mono text-green-400">{speed}ms</span>
                </div>
                <input type="range" min="50" max="1000" step="50" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500" />
            </div>

            <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-gray-300">
                    <span>Total Rounds</span>
                    <span className="font-mono text-green-400">{rounds}</span>
                </div>
                <input type="number" min="1" max="100" value={rounds} onChange={(e) => setRounds(Number(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded p-1 text-xs text-center text-white focus:border-green-500 outline-none" />
            </div>

            <div className="flex flex-col gap-1 mt-2">
                <div className="flex justify-between text-xs text-gray-300">
                    <span>Generations (Evolution)</span>
                    <span className="font-mono text-purple-400">{generations}</span>
                </div>
                <input type="range" min="10" max="200" step="10" value={generations} onChange={(e) => setGenerations(Number(e.target.value))} className="w-full accent-purple-500 cursor-pointer" />
            </div>

            <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-gray-700">
                <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1 flex justify-between items-center">
                    <span>Payoff Matrix Law</span>
                </h3>

                <div className="flex flex-wrap gap-1 mb-2">
                    {PRESETS.map(preset => (
                        <button
                            key={preset.name}
                            onClick={() => setPayoff(preset.vals)}
                            className={`flex-1 text-[8px] font-bold px-1 py-1 rounded border bg-black transition-all text-center ${preset.color} ${preset.border} ${preset.bg}`}
                            title={`Set to ${preset.name} (${preset.vals.t}, ${preset.vals.r}, ${preset.vals.p}, ${preset.vals.s})`}
                        >
                            {preset.name}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {/* T: Temptation */}
                    <div className="flex flex-col bg-gray-900 p-2 rounded border border-gray-600">
                        <div className="flex justify-between items-center w-full mb-1">
                            <span className="font-bold text-red-400" title="Temptation">T</span>
                            <input type="number" value={payoff.t} onChange={e => setPayoff({ ...payoff, t: Number(e.target.value) })} className="w-10 bg-black border border-gray-700 rounded text-white font-mono text-center outline-none focus:border-blue-500 focus:text-blue-400 transition-all" />
                        </div>
                        <span className="text-[9px] text-gray-500 uppercase tracking-tighter">Defect/Coop</span>
                    </div>

                    {/* R: Reward */}
                    <div className="flex flex-col bg-gray-900 p-2 rounded border border-gray-600">
                        <div className="flex justify-between items-center w-full mb-1">
                            <span className="font-bold text-green-400" title="Reward">R</span>
                            <input type="number" value={payoff.r} onChange={e => setPayoff({ ...payoff, r: Number(e.target.value) })} className="w-10 bg-black border border-gray-700 rounded text-white font-mono text-center outline-none focus:border-blue-500 focus:text-blue-400 transition-all" />
                        </div>
                        <span className="text-[9px] text-gray-500 uppercase tracking-tighter">Coop/Coop</span>
                    </div>

                    {/* P: Punishment */}
                    <div className="flex flex-col bg-gray-900 p-2 rounded border border-gray-600">
                        <div className="flex justify-between items-center w-full mb-1">
                            <span className="font-bold text-gray-400" title="Punishment">P</span>
                            <input type="number" value={payoff.p} onChange={e => setPayoff({ ...payoff, p: Number(e.target.value) })} className="w-10 bg-black border border-gray-700 rounded text-white font-mono text-center outline-none focus:border-blue-500 focus:text-blue-400 transition-all" />
                        </div>
                        <span className="text-[9px] text-gray-500 uppercase tracking-tighter">Defect/Defect</span>
                    </div>

                    {/* S: Sucker */}
                    <div className="flex flex-col bg-gray-900 p-2 rounded border border-gray-600">
                        <div className="flex justify-between items-center w-full mb-1">
                            <span className="font-bold text-yellow-500" title="Sucker">S</span>
                            <input type="number" value={payoff.s} onChange={e => setPayoff({ ...payoff, s: Number(e.target.value) })} className="w-10 bg-black border border-gray-700 rounded text-white font-mono text-center outline-none focus:border-blue-500 focus:text-blue-400 transition-all" />
                        </div>
                        <span className="text-[9px] text-gray-500 uppercase tracking-tighter">Coop/Defect</span>
                    </div>
                </div>
            </div>

            <div className="mt-2">
                <label className="block text-xs font-bold text-gray-400 mb-1">
                    SIGNAL NOISE: {(noise * 100).toFixed(0)}%
                </label>
                <input type="range" min="0" max="0.5" step="0.01" value={noise} onChange={(e) => setNoise(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500" />
            </div>
        </div>
    );
}