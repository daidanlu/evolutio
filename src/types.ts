// Action enum
export type Action = "Cooperate" | "Defect";

// MatchResult struct
export interface MatchResult {
  player_name: String;
  opponent_name: String;
  rounds: [Action, Action][];
  player_score: number;
  opponent_score: number;
}