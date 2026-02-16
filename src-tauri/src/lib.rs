use serde::{ Deserialize, Serialize };
use rand::prelude::*;

// 1. Basic Data Structures (The Atoms)
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum Action {
    Cooperate,
    Defect,
}

impl Action {
    // Flip
    fn toggle(&self) -> Self {
        match self {
            Action::Cooperate => Action::Defect,
            Action::Defect => Action::Cooperate,
        }
    }
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

// --- Strategy F: Pavlov (Win-Stay, Lose-Shift) ---
pub struct Pavlov;

impl Strategy for Pavlov {
    fn name(&self) -> String {
        "Pavlov".to_string()
    }

    fn next_move(&self, history: &[Round]) -> Action {
        match history.last() {
            None => Action::Cooperate, // default cooperate
            Some(&(my_last, opp_last)) => {
                let (my_score, _) = calculate_payoff(my_last, opp_last);

                // Logic: if win (>=3) stay, otherwise shift
                if my_score >= 3 {
                    my_last // Win-Stay
                } else {
                    // Lose-Shift
                    match my_last {
                        Action::Cooperate => Action::Defect,
                        Action::Defect => Action::Cooperate,
                    }
                }
            }
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
        "pavlov" => Box::new(Pavlov),
        // Default to AlwaysDefect if unknown id
        _ => Box::new(AlwaysDefect),
    }
}

// 找到 src-tauri/src/lib.rs 的 run_game 部分，用下面的代码完全替换该函数：

#[tauri::command]
fn run_game(p1_id: String, p2_id: String, rounds: u32, noise: f64) -> MatchResult {
    let p1 = create_strategy(&p1_id);
    let p2 = create_strategy(&p2_id);

    let mut history: Vec<Round> = Vec::with_capacity(rounds as usize);
    let mut p1_score = 0;
    let mut p2_score = 0;
    let mut rng = rand::rng();

    for _ in 0..rounds {
        // 1. P1 thinking based on current history
        let mut a1 = p1.next_move(&history);

        // 2. P2 thinking based on history opponent changed to P1
        let history_for_p2: Vec<Round> = history
            .iter()
            .map(|(my, opp)| (*opp, *my))
            .collect();
        let mut a2 = p2.next_move(&history_for_p2);

        // noise in [0, 1]
        if rng.random_bool(noise) {
            a1 = a1.toggle();
        }
        if rng.random_bool(noise) {
            a2 = a2.toggle();
        }

        // 3. record this round
        history.push((a1, a2));

        // 4. calculate scores
        let (s1, s2) = calculate_payoff(a1, a2);
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

// --- Tournament Mode ---
#[derive(Debug, Serialize)]
pub struct TournamentResult {
    pub ranking: Vec<(String, i32)>, // A list of (strategy names, total scores)
}

#[tauri::command]
fn run_tournament(rounds: u32, noise: f64) -> TournamentResult {
    // 1. Define the IDs of all participants
    let all_ids = vec![
        "tit_for_tat",
        "always_defect",
        "grim_trigger",
        "always_cooperate",
        "random",
        "pavlov"
    ];

    // 2. Initialize the scoreboard (index corresponds to all_ids)
    let mut total_scores = vec![0; all_ids.len()];

    // 3. Two-on-one matches (double round-robin)
    for i in 0..all_ids.len() {
        for j in 0..all_ids.len() {
            // According to Axelrod's rules: Round Robin includes oneself.
            // Recreate instances because Box is one-time use
            let p1_id = all_ids[i];
            let p2_id = all_ids[j];

            let p1 = create_strategy(p1_id);
            let p2 = create_strategy(p2_id);

            let mut history = Vec::with_capacity(rounds as usize);
            let mut s1_sum = 0;
            let mut rng = rand::rng();

            for _ in 0..rounds {
                let mut a1 = p1.next_move(&history); // <--- mut
                // Flip the view of P2
                let history_for_p2: Vec<Round> = history
                    .iter()
                    .map(|(my, opp)| (*opp, *my))
                    .collect();
                let mut a2 = p2.next_move(&history_for_p2); // <--- mut

                if rng.random_bool(noise) {
                    a1 = a1.toggle();
                }
                if rng.random_bool(noise) {
                    a2 = a2.toggle();
                }

                history.push((a1, a2));

                let (s1, _) = calculate_payoff(a1, a2);
                s1_sum += s1;
            }

            total_scores[i] += s1_sum;
        }
    }

    // 4. Pack the results and sort them
    let mut ranking: Vec<(String, i32)> = all_ids
        .into_iter()
        .zip(total_scores.into_iter())
        .map(|(id, score)| {
            // Instantiate an object to get its name
            let temp_strat = create_strategy(id);
            (temp_strat.name(), score)
        })
        .collect();

    // Sort by score from highest to lowest
    ranking.sort_by(|a, b| b.1.cmp(&a.1));

    TournamentResult { ranking }
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
        .invoke_handler(tauri::generate_handler![greet_engine, run_game, run_tournament])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Auxiliary function for calculating single-game scores
pub fn calculate_payoff(a1: Action, a2: Action) -> (i32, i32) {
    match (a1, a2) {
        (Action::Defect, Action::Cooperate) => (5, 0),
        (Action::Cooperate, Action::Cooperate) => (3, 3),
        (Action::Defect, Action::Defect) => (1, 1),
        (Action::Cooperate, Action::Defect) => (0, 5),
    }
}
