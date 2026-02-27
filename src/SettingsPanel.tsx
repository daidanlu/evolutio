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
                <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Payoff Matrix Law</h3>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="flex justify-between items-center bg-gray-900 p-1 rounded border border-gray-600">
                        <span className="text-gray-400 pl-1" title="Temptation">T (Defect/Coop)</span>
                        <input type="number" value={payoff.t} onChange={e => setPayoff({ ...payoff, t: Number(e.target.value) })} className="w-10 bg-transparent text-white font-mono text-center outline-none focus:text-blue-400" />
                    </div>
                    <div className="flex justify-between items-center bg-gray-900 p-1 rounded border border-gray-600">
                        <span className="text-gray-400 pl-1" title="Reward">R (Coop/Coop)</span>
                        <input type="number" value={payoff.r} onChange={e => setPayoff({ ...payoff, r: Number(e.target.value) })} className="w-10 bg-transparent text-white font-mono text-center outline-none focus:text-blue-400" />
                    </div>
                    <div className="flex justify-between items-center bg-gray-900 p-1 rounded border border-gray-600">
                        <span className="text-gray-400 pl-1" title="Punishment">P (Defect/Defect)</span>
                        <input type="number" value={payoff.p} onChange={e => setPayoff({ ...payoff, p: Number(e.target.value) })} className="w-10 bg-transparent text-white font-mono text-center outline-none focus:text-blue-400" />
                    </div>
                    <div className="flex justify-between items-center bg-gray-900 p-1 rounded border border-gray-600">
                        <span className="text-gray-400 pl-1" title="Sucker">S (Coop/Defect)</span>
                        <input type="number" value={payoff.s} onChange={e => setPayoff({ ...payoff, s: Number(e.target.value) })} className="w-10 bg-transparent text-white font-mono text-center outline-none focus:text-blue-400" />
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