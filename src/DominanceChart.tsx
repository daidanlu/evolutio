import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

interface Props {
    data: { name: string; value: number }[];
    generation: number;
}

const COLOR_MAP: Record<string, string> = {
    "Tit For Tat": "#60a5fa",    // blue-400
    "Always Defect": "#ef4444",  // red-500
    "Grim Trigger": "#a855f7",   // purple-500
    "Always Cooperate": "#4ade80", // green-400
    "Random": "#facc15",         // yellow-400
    "Pavlov": "#f97316",         // orange-500
    "Generous TFT": "#ec4899",   // pink-500
    "Joss": "#f87171",           // red-400
};

export function DominanceChart({ data, generation }: Props) {
    const activeData = data.filter(d => d.value > 0);

    return (
        <div className="w-full h-72 mt-4 bg-gray-900 border border-gray-700 rounded p-4 flex flex-col shadow-lg">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-2">
                <h3 className="text-xs font-bold text-cyan-400 tracking-widest uppercase">
                    <span className="text-gray-400 mr-2">{"//"}</span>
                    Ecosystem Dominance
                </h3>
                <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">
                    GEN {generation}
                </span>
            </div>

            <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={activeData}
                            cx="50%"
                            cy="50%"
                            innerRadius="60%"
                            outerRadius="90%"
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                            animationDuration={300}
                        >
                            {activeData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLOR_MAP[entry.name] || "#ffffff"}
                                />
                            ))}
                        </Pie>
                        <RechartsTooltip
                            contentStyle={{
                                backgroundColor: "#000",
                                borderColor: "#374151",
                                fontFamily: "monospace",
                                fontSize: "12px"
                            }}
                            itemStyle={{ color: "#e5e7eb" }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-white">{activeData.length}</span>
                    <span className="text-[8px] text-gray-500 uppercase tracking-widest mt-1">Species</span>
                </div>
            </div>
        </div>
    );
}