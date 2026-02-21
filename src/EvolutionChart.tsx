import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const STRATEGY_COLORS: Record<string, string> = {
    "Tit-For-Tat": "#3b82f6", // Blue
    "Always Defect": "#ef4444", // Red
    "Grim Trigger": "#eab308", // Yellow
    "Always Cooperate": "#22c55e", // Green
    "Random": "#94a3b8", // Gray
    "Pavlov": "#a855f7", // Purple
    "Generous TFT": "#ec4899", // Pink
    "Joss": "#f97316" // Orange
};

interface GenerationData {
    gen_number: number;
    populations: [string, number][];
}

interface Props {
    data: GenerationData[];
}

export function EvolutionChart({ data }: Props) {
    if (!data || data.length === 0) return null;

    const chartData = data.map((gen) => {
        const dataPoint: any = { name: `Gen ${gen.gen_number}` };
        gen.populations.forEach(([strategyName, count]) => {
            dataPoint[strategyName] = count;
        });
        return dataPoint;
    });

    const strategyNames = data[0].populations.map(p => p[0]);

    return (
        <div className="w-full h-64 mt-4 bg-gray-900 border border-gray-700 rounded-lg p-2">
            <h3 className="text-xs text-gray-400 mb-2 font-bold text-center">POPULATION DYNAMICS</h3>
            <ResponsiveContainer width="100%" height="90%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tick={{ fill: '#9ca3af' }} />
                    <YAxis stroke="#9ca3af" fontSize={10} tick={{ fill: '#9ca3af' }} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', fontSize: '12px' }}
                        itemStyle={{ color: '#e5e7eb' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />

                    {strategyNames.map((name) => (
                        <Line
                            key={name}
                            type="monotone"
                            dataKey={name}
                            stroke={STRATEGY_COLORS[name] || "#ffffff"}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}