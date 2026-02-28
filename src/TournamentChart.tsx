import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from "recharts";

interface Props {
  data: { name: string; score: number }[];
}

export function TournamentChart({ data }: Props) {
  const colors = [
    "#f59e0b",
    "#10b981",
    "#14b8a6",
    "#0ea5e9",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#6b7280",
  ];

  return (
    <div className="w-full h-72 mt-4 bg-gray-900 border border-gray-700 rounded p-4 flex flex-col shadow-lg">
      <h3 className="text-xs font-bold text-yellow-500 mb-2 tracking-widest uppercase border-b border-gray-800 pb-2">
        <span className="text-gray-400 mr-2">{"//"}</span>
        Tournament Leaderboard
      </h3>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
          >
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 11, fontFamily: "monospace" }}
              width={120}
            />
            <Tooltip
              cursor={{ fill: "#1f2937" }}
              contentStyle={{
                backgroundColor: "#000",
                borderColor: "#374151",
                color: "#10b981",
                fontFamily: "monospace",
              }}
            />
            <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
              <LabelList dataKey="score" position="right" fill="#9ca3af" fontSize={10} fontFamily="monospace" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}