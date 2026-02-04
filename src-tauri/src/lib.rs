use serde::{Serialize, Deserialize};

// 1. Define actions (atomic units)
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum Action {
    Cooperate,
    Defect,
}

// 2. Define the game results (for front-end display)
#[derive(Debug, Serialize, Deserialize)]
pub struct MatchResult {
    pub player_name: String,
    pub opponent_name: String,
    pub rounds: Vec<(Action, Action)>, // History of each round
    pub player_score: i32,
    pub opponent_score: i32,
}

// 3. Strategy Trait Definition
pub trait Strategy {
    fn name(&self) -> String;
    fn next_move(&self, history: &[(Action, Action)]) -> Action;
}

// 4. Placeholder
#[tauri::command]
fn greet_engine() -> String {
    "Core Engine: v0.1.0 Ready".to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet_engine])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}