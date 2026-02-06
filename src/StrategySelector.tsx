import { STRATEGIES } from "./strategies";

interface Props {
    label: string;
    selectedId: string;
    onChange: (id: string) => void;
}

export function StrategySelector({ label, selectedId, onChange }: Props) {
    const current = STRATEGIES.find(s => s.id === selectedId) || STRATEGIES[0];

    return (
        <div className="p-3 bg-gray-800 rounded border border-gray-600 transition-all hover:border-green-500 group relative">
            <h3 className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">{label}</h3>

            {/* Dropdown selection logic */}
            <select
                value={selectedId}
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            >
                {STRATEGIES.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </select>

            {/* Visual presentation layer */}
            <div>
                <div className={`text-lg font-bold ${current.color} group-hover:text-white transition-colors`}>
                    {current.name}
                </div>
                <div className="text-[10px] text-gray-500 mt-1 leading-tight h-8">
                    {current.description}
                </div>
            </div>

            {/* Dropdown arrow indicator */}
            <div className="absolute top-3 right-3 text-gray-600 group-hover:text-green-500">
                ▼
            </div>
        </div>
    );
}