use serde::{ Deserialize, Serialize };
use rand::prelude::*;

// 1. Basic Data Structures (The Atoms)
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum Action {
    Cooperate,
    Defect,
}

// Record of a single round: (My Action, Opponent's Action)
// For a strategy, the history is viewed from its own perspective.
pub type Round = (Action, Action);

#[derive(Debug, Serialize, Deserialize)]
pub struct MatchResult {
    pub player_name: String,
    pub opponent_name: String,
    pub rounds: Vec<Round>,
    pub player_score: i32,
    pub opponent_score: i32,
}

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

// --- Strategy C: Grim Trigger ---
// // Logic: Default is cooperation. However, if any betrayal by the opponent is detected in the past, the defect of Grim Trigger will be permanent.
pub struct GrimTrigger;

impl Strategy for GrimTrigger {
    fn name(&self) -> String {
        "Grim Trigger".to_string()
    }

    fn next_move(&self, history: &[Round]) -> Action {
        let has_opponent_cheated = history.iter().any(|(_, opp)| *opp == Action::Defect);

        if has_opponent_cheated {
            Action::Defect
        } else {
            Action::Cooperate
        }
    }
}

// --- Strategy D: Always Cooperate ---
pub struct AlwaysCooperate;

impl Strategy for AlwaysCooperate {
    fn name(&self) -> String {
        "Always Cooperate".to_string()
    }
    fn next_move(&self, _history: &[Round]) -> Action {
        Action::Cooperate
    }
}

// --- Strategy E: Random ---
pub struct Random;

impl Strategy for Random {
    fn name(&self) -> String {
        "Random".to_string()
    }
    fn next_move(&self, _history: &[Round]) -> Action {
        let mut rng = rand::rng();
        if rng.random_bool(0.5) {
            Action::Cooperate
        } else {
            Action::Defect
        }
    }
}

// 4. Strategy Factory (The Builder)
// A helper function to create a Strategy object by name.
// Returns Box<dyn Strategy> (Trait Object) to allow dynamic dispatch.
pub fn create_strategy(id: &str) -> Box<dyn Strategy> {
    match id {
        "tit_for_tat" => Box::new(TitForTat),
        "always_defect" => Box::new(AlwaysDefect),
        "grim_trigger" => Box::new(GrimTrigger),
        "always_cooperate" => Box::new(AlwaysCooperate),
        "random" => Box::new(Random),
        // Default to AlwaysDefect if unknown id
        _ => Box::new(AlwaysDefect),
    }
}

#[tauri::command]
fn run_game(p1_id: String, p2_id: String, rounds: u32) -> MatchResult {
    let p1 = create_strategy(&p1_id);
    let p2 = create_strategy(&p2_id);

    let mut history: Vec<Round> = Vec::with_capacity(rounds as usize);
    let mut p1_score = 0;
    let mut p2_score = 0;

    for _ in 0..rounds {
        // 1. P1 thinking based on current history
        let a1 = p1.next_move(&history);
        // 2. P2 thinking based on history opponent changed to P1
        // (Action::Cooperate, Action::Defect) -> (Action::Defect, Action::Cooperate)
        let history_for_p2: Vec<Round> = history
            .iter()
            .map(|(my, opp)| (*opp, *my))
            .collect();
        let a2 = p2.next_move(&history_for_p2);

        // 3. record this round
        history.push((a1, a2));

        // 4. calculate scores
        let (s1, s2) = match (a1, a2) {
            (Action::Defect, Action::Cooperate) => (5, 0),
            (Action::Cooperate, Action::Cooperate) => (3, 3),
            (Action::Defect, Action::Defect) => (1, 1),
            (Action::Cooperate, Action::Defect) => (0, 5),
        };
        p1_score += s1;
        p2_score += s2;
    }

    MatchResult {
        player_name: p1.name(),
        opponent_name: p2.name(),
        rounds: history,
        player_score: p1_score,
        opponent_score: p2_score,
    }
}

// 5. Tauri Commands (The Bridge)
#[tauri::command]
fn greet_engine() -> String {
    "Core Engine: v0.3.0 (Online)".to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder
        ::default()
        // register run_game
        .invoke_handler(tauri::generate_handler![greet_engine, run_game])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
