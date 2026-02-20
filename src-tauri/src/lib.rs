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

// --- Strategy G: Generous Tit-For-Tat ---
// Logic: Basically the same as TFT, but there is a 10% probability of forgiveness (continued cooperation) when the opponent betrays.
pub struct GenerousTFT;

impl Strategy for GenerousTFT {
    fn name(&self) -> String {
        "Generous TFT".to_string()
    }

    fn next_move(&self, history: &[Round]) -> Action {
        match history.last() {
            None => Action::Cooperate, // round 1: cooperate
            Some(&(_, opp_last)) => {
                match opp_last {
                    Action::Cooperate => Action::Cooperate,
                    Action::Defect => {
                        let mut rng = rand::rng();
                        // 10% chance of forgiveness (Cooperate), 90% chance of revenge (Defect)
                        if rng.random_bool(0.1) {
                            Action::Cooperate
                        } else {
                            Action::Defect
                        }
                    }
                }
            }
        }
    }
}

// --- Strategy H: Joss ---
// Logic: 90% like Tit for Tat, but with a 10% probability of suddenly betraying.
pub struct Joss;

impl Strategy for Joss {
    fn name(&self) -> String {
        "Joss".to_string()
    }

    fn next_move(&self, history: &[Round]) -> Action {
        match history.last() {
            None => Action::Cooperate,
            Some(&(_, opp_last)) => {
                if opp_last == Action::Defect {
                    Action::Defect
                } else {
                    let mut rng = rand::rng();
                    // If Joss's opponent cooperates, there's a 10% chance Joss will betray them (Sneaky Defect)
                    if rng.random_bool(0.1) {
                        Action::Defect
                    } else {
                        Action::Cooperate
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
        "generous_tft" => Box::new(GenerousTFT),
        "joss" => Box::new(Joss),
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
        "pavlov",
        "generous_tft",
        "joss"
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

#[derive(Debug, Serialize, Clone)]
pub struct Generation {
    pub gen_number: u32,
    pub populations: Vec<(String, u32)>,
}

#[tauri::command]
fn run_evolution(rounds: u32, noise: f64) -> Vec<Generation> {
    // 1. Define the gene pool: List of all participating strategies.
    let all_ids = vec![
        "tit_for_tat",
        "always_defect",
        "grim_trigger",
        "always_cooperate",
        "random",
        "pavlov",
        "generous_tft",
        "joss"
    ];

    // population of TFT, AD, GT, AC, Rnd, Pav, GTFT, Joss
    let mut population: Vec<u32> = vec![3, 5, 2, 20, 2, 2, 3, 3];
    let generations = 50; // Simulate for 50 generations (cycles).
    let mut history = Vec::new();

    let mut rng = rand::rng();

    // --- MAIN EVOLUTION LOOP ---
    for gen in 1..=generations {
        // Record current population state for frontend visualization.
        let current_pop_display: Vec<(String, u32)> = all_ids
            .iter()
            .zip(population.iter())
            .map(|(id, &count)| (create_strategy(id).name(), count))
            .collect();
        history.push(Generation { gen_number: gen, populations: current_pop_display });

        // Extinction Check: Filter out extinct strategies (count == 0).
        let active_strategies: Vec<usize> = population
            .iter()
            .enumerate()
            .filter(|(_, &count)| count > 0)
            .map(|(i, _)| i)
            .collect();

        // Termination Condition: If only 1 (or 0) species remains, evolution stops early.
        if active_strategies.len() <= 1 {
            break;
        }

        // 2. Tournament Phase: Calculate fitness for each species.
        let mut scores = vec![0; all_ids.len()];

        // Loop through every pair of active strategies (i vs j).
        for &i in &active_strategies {
            for &j in &active_strategies {
                // Instead of simulating 40x40 individual matches (slow), simulating 1 representative match between Strategy i and Strategy j. Then multiply the score by the number of opponents.

                let p1 = create_strategy(all_ids[i]);
                let p2 = create_strategy(all_ids[j]);

                let mut p1_total = 0;

                // Run a single representative match.
                let mut history_vec = Vec::with_capacity(rounds as usize);
                for _ in 0..rounds {
                    let mut a1 = p1.next_move(&history_vec);
                    // Flip perspective for Player 2
                    let hist_p2: Vec<Round> = history_vec
                        .iter()
                        .map(|(m, o)| (*o, *m))
                        .collect();
                    let mut a2 = p2.next_move(&hist_p2);

                    // Apply Noise (Trembling Hand)
                    if rng.random_bool(noise) {
                        a1 = a1.toggle();
                    }
                    if rng.random_bool(noise) {
                        a2 = a2.toggle();
                    }

                    history_vec.push((a1, a2));
                    let (s1, _) = calculate_payoff(a1, a2);
                    p1_total += s1;
                }

                // Total Score += (Avg Score against j) * (Number of j opponents)
                // If playing against self (i==j), opponent count is population - 1.
                let opponent_count = if i == j { population[j] - 1 } else { population[j] };
                if opponent_count > 0 {
                    scores[i] += p1_total * (opponent_count as i32);
                }
            }
        }

        // 3. Selection Phase: Reproduction & Elimination.
        let mut best_idx = 0;
        let mut max_score = -1;
        let mut worst_idx = 0;
        let mut min_score = i32::MAX;

        for &i in &active_strategies {
            // Calculate Average Fitness per Individual to compare gene quality instead of total biomass.
            let avg_score = scores[i];

            if avg_score > max_score {
                max_score = avg_score;
                best_idx = i;
            }
            if avg_score < min_score {
                min_score = avg_score;
                worst_idx = i;
            }
        }

        // Apply Natural Selection:
        // The fittest strategy grows (+1).
        // The weakest strategy shrinks (-1).
        if best_idx != worst_idx {
            population[best_idx] += 1;
            population[worst_idx] -= 1;
        }
    }

    history
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
        .invoke_handler(
            tauri::generate_handler![greet_engine, run_game, run_tournament, run_evolution]
        )
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
