use serde::{Deserialize, Serialize};

// 1. Basic Data Structures (The Atoms)
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum Action {
    Cooperate,
    Defect,
}

// Record of a single round: (My Action, Opponent's Action)
// For a strategy, the history is viewed from its own perspective.
pub type Round = (Action, Action);


// 2. Strategy Trait (The Interface)
// This is the Trait used to define shared behavior.
pub trait Strategy: Send + Sync {
    fn name(&self) -> String;
    fn next_move(&self, history: &[Round]) -> Action;
}


// 3. Strategy Implementations (The Agents)
// --- Strategy A: TitForTat ---
// Logic: Cooperate on the first move, then mimic the opponent's previous move.
pub struct TitForTat;

impl Strategy for TitForTat {
    fn name(&self) -> String {
        "Tit-For-Tat".to_string()
    }

    fn next_move(&self, history: &[Round]) -> Action {
        match history.last() {
            // If there is history, look at what the opponent (tuple index 1) did
            Some(&(_, opponent_last_move)) => opponent_last_move,
            // If history is empty (first round), start with Cooperation
            None => Action::Cooperate,
        }
    }
}

// --- Strategy B: AlwaysDefect ---
// Logic: Always Defect, regardless of history.
pub struct AlwaysDefect;

impl Strategy for AlwaysDefect {
    fn name(&self) -> String {
        "Always Defect".to_string()
    }

    fn next_move(&self, _history: &[Round]) -> Action {
        Action::Defect
    }
}


// 4. Strategy Factory (The Builder)
// A helper function to create a Strategy object by name.
// Returns Box<dyn Strategy> (Trait Object) to allow dynamic dispatch.
pub fn create_strategy(id: &str) -> Box<dyn Strategy> {
    match id {
        "tit_for_tat" => Box::new(TitForTat),
        "always_defect" => Box::new(AlwaysDefect),
        // Default to AlwaysDefect if the ID is unknown
        _ => Box::new(AlwaysDefect),
    }
}

// 5. Tauri Commands (The Bridge)
#[tauri::command]
fn greet_engine() -> String {
    "Core Engine: v0.2.0 (Strategies Loaded)".to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet_engine])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}