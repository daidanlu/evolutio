export interface StrategyMeta {
  id: string;
  name: string;
  description: string;
  color: string;
}

export const STRATEGIES: StrategyMeta[] = [
  { id: "tit_for_tat", name: "Tit For Tat", description: "Starts with cooperation, then mimics your last move.", color: "text-blue-400" },
  { id: "always_defect", name: "Always Defect", description: "The agent of chaos. Never cooperates.", color: "text-red-500" },
  { id: "always_cooperate", name: "Always Cooperate", description: "The saint. Always cooperates.", color: "text-green-400" },
  { id: "random", name: "Random", description: "Unpredictable. Flips a coin every time.", color: "text-yellow-400" },
];