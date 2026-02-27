use serde::{ Deserialize, Serialize };
use rand::prelude::*;

// --- 1. Basic Data Structures ---
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum Action {
    Cooperate,
    Defect,
}

impl Action {
    fn toggle(&self) -> Self {
        match self {
            Action::Cooperate => Action::Defect,
            Action::Defect => Action::Cooperate,
        }
    }
}

pub type Round = (Action, Action);

#[derive(Debug, Serialize, Deserialize)]
pub struct MatchResult {
    pub player_name: String,
    pub opponent_name: String,
    pub rounds: Vec<Round>,
    pub player_score: i32,
    pub opponent_score: i32,
}


#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct PayoffMatrix {
    pub t: i32, // Temptation
    pub r: i32, // Reward
    pub p: i32, // Punishment
    pub s: i32, // Sucker
}

// --- 2. Strategy Trait ---
pub trait Strategy: Send + Sync {
    fn name(&self) -> String;
    fn next_move(&self, history: &[Round], matrix: &PayoffMatrix) -> Action;
}

// --- 3. Strategy Implementations ---
pub struct TitForTat;
impl Strategy for TitForTat {
    fn name(&self) -> String { "Tit-For-Tat".to_string() }
    fn next_move(&self, history: &[Round], _matrix: &PayoffMatrix) -> Action {
        match history.last() {
            Some(&(_, opponent_last_move)) => opponent_last_move,
            None => Action::Cooperate,
        }
    }
}

pub struct AlwaysDefect;
impl Strategy for AlwaysDefect {
    fn name(&self) -> String { "Always Defect".to_string() }
    fn next_move(&self, _history: &[Round], _matrix: &PayoffMatrix) -> Action {
        Action::Defect
    }
}

pub struct GrimTrigger;
impl Strategy for GrimTrigger {
    fn name(&self) -> String { "Grim Trigger".to_string() }
    fn next_move(&self, history: &[Round], _matrix: &PayoffMatrix) -> Action {
        let has_opponent_cheated = history.iter().any(|(_, opp)| *opp == Action::Defect);
        if has_opponent_cheated { Action::Defect } else { Action::Cooperate }
    }
}

pub struct AlwaysCooperate;
impl Strategy for AlwaysCooperate {
    fn name(&self) -> String { "Always Cooperate".to_string() }
    fn next_move(&self, _history: &[Round], _matrix: &PayoffMatrix) -> Action {
        Action::Cooperate
    }
}

pub struct Random;
impl Strategy for Random {
    fn name(&self) -> String { "Random".to_string() }
    fn next_move(&self, _history: &[Round], _matrix: &PayoffMatrix) -> Action {
        if rand::rng().random_bool(0.5) { Action::Cooperate } else { Action::Defect }
    }
}

pub struct Pavlov;
impl Strategy for Pavlov {
    fn name(&self) -> String { "Pavlov".to_string() }
    fn next_move(&self, history: &[Round], matrix: &PayoffMatrix) -> Action {
        match history.last() {
            None => Action::Cooperate,
            Some(&(my_last, opp_last)) => {
                let (my_score, _) = calculate_payoff(my_last, opp_last, matrix);
                if my_score >= matrix.r {
                    my_last 
                } else {
                    my_last.toggle()
                }
            }
        }
    }
}

pub struct GenerousTFT;
impl Strategy for GenerousTFT {
    fn name(&self) -> String { "Generous TFT".to_string() }
    fn next_move(&self, history: &[Round], _matrix: &PayoffMatrix) -> Action {
        match history.last() {
            None => Action::Cooperate,
            Some(&(_, opp_last)) => {
                match opp_last {
                    Action::Cooperate => Action::Cooperate,
                    Action::Defect => {
                        if rand::rng().random_bool(0.1) { Action::Cooperate } else { Action::Defect }
                    }
                }
            }
        }
    }
}

pub struct Joss;
impl Strategy for Joss {
    fn name(&self) -> String { "Joss".to_string() }
    fn next_move(&self, history: &[Round], _matrix: &PayoffMatrix) -> Action {
        match history.last() {
            None => Action::Cooperate,
            Some(&(_, opp_last)) => {
                if opp_last == Action::Defect {
                    Action::Defect
                } else {
                    if rand::rng().random_bool(0.1) { Action::Defect } else { Action::Cooperate }
                }
            }
        }
    }
}

// --- 4. Strategy Factory ---
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
        _ => Box::new(AlwaysDefect),
    }
}

// --- 5. Tauri Commands ---
pub fn calculate_payoff(a1: Action, a2: Action, matrix: &PayoffMatrix) -> (i32, i32) {
    match (a1, a2) {
        (Action::Defect, Action::Cooperate) => (matrix.t, matrix.s),
        (Action::Cooperate, Action::Cooperate) => (matrix.r, matrix.r),
        (Action::Defect, Action::Defect) => (matrix.p, matrix.p),
        (Action::Cooperate, Action::Defect) => (matrix.s, matrix.t),
    }
}

#[tauri::command]
fn run_game(p1_id: String, p2_id: String, rounds: u32, noise: f64, payoff_matrix: PayoffMatrix) -> MatchResult {
    let p1 = create_strategy(&p1_id);
    let p2 = create_strategy(&p2_id);
    let mut history: Vec<Round> = Vec::with_capacity(rounds as usize);
    let mut p1_score = 0;
    let mut p2_score = 0;
    let mut rng = rand::rng();

    for _ in 0..rounds {
        let mut a1 = p1.next_move(&history, &payoff_matrix);
        let history_for_p2: Vec<Round> = history.iter().map(|(my, opp)| (*opp, *my)).collect();
        let mut a2 = p2.next_move(&history_for_p2, &payoff_matrix);

        if rng.random_bool(noise) { a1 = a1.toggle(); }
        if rng.random_bool(noise) { a2 = a2.toggle(); }

        history.push((a1, a2));
        let (s1, s2) = calculate_payoff(a1, a2, &payoff_matrix);
        p1_score += s1;
        p2_score += s2;
    }

    MatchResult {
        player_name: p1.name(), opponent_name: p2.name(),
        rounds: history, player_score: p1_score, opponent_score: p2_score,
    }
}

#[derive(Debug, Serialize)]
pub struct TournamentResult {
    pub ranking: Vec<(String, i32)>,
}

#[tauri::command]
fn run_tournament(rounds: u32, noise: f64, payoff_matrix: PayoffMatrix) -> TournamentResult {
    let all_ids = vec!["tit_for_tat", "always_defect", "grim_trigger", "always_cooperate", "random", "pavlov", "generous_tft", "joss"];
    let mut total_scores = vec![0; all_ids.len()];

    for i in 0..all_ids.len() {
        for j in 0..all_ids.len() {
            let p1 = create_strategy(all_ids[i]);
            let p2 = create_strategy(all_ids[j]);
            let mut history = Vec::with_capacity(rounds as usize);
            let mut s1_sum = 0;
            let mut rng = rand::rng();

            for _ in 0..rounds {
                let mut a1 = p1.next_move(&history, &payoff_matrix);
                let history_for_p2: Vec<Round> = history.iter().map(|(my, opp)| (*opp, *my)).collect();
                let mut a2 = p2.next_move(&history_for_p2, &payoff_matrix);

                if rng.random_bool(noise) { a1 = a1.toggle(); }
                if rng.random_bool(noise) { a2 = a2.toggle(); }

                history.push((a1, a2));
                let (s1, _) = calculate_payoff(a1, a2, &payoff_matrix);
                s1_sum += s1;
            }
            total_scores[i] += s1_sum;
        }
    }

    let mut ranking: Vec<(String, i32)> = all_ids.into_iter().zip(total_scores.into_iter())
        .map(|(id, score)| (create_strategy(id).name(), score)).collect();
    ranking.sort_by(|a, b| b.1.cmp(&a.1));
    TournamentResult { ranking }
}

#[derive(Debug, Serialize, Clone)]
pub struct Generation {
    pub gen_number: u32,
    pub populations: Vec<(String, u32)>,
}

#[tauri::command]
fn run_evolution(rounds: u32, noise: f64, initial_populations: Vec<u32>, generations: u32, payoff_matrix: PayoffMatrix) -> Vec<Generation> {
    let all_ids = vec!["tit_for_tat", "always_defect", "grim_trigger", "always_cooperate", "random", "pavlov", "generous_tft", "joss"];
    let mut population = if initial_populations.len() == all_ids.len() { initial_populations } else { vec![5; all_ids.len()] };
    let mut history = Vec::new();
    let mut rng = rand::rng();

    for gen in 1..=generations {
        let current_pop_display: Vec<(String, u32)> = all_ids.iter().zip(population.iter())
            .map(|(id, &count)| (create_strategy(id).name(), count)).collect();
        history.push(Generation { gen_number: gen, populations: current_pop_display });

        let active_strategies: Vec<usize> = population.iter().enumerate().filter(|(_, &count)| count > 0).map(|(i, _)| i).collect();
        if active_strategies.len() <= 1 { break; }

        let mut scores = vec![0; all_ids.len()];

        for &i in &active_strategies {
            for &j in &active_strategies {
                let p1 = create_strategy(all_ids[i]);
                let p2 = create_strategy(all_ids[j]);
                let mut p1_total = 0;
                let mut history_vec = Vec::with_capacity(rounds as usize);

                for _ in 0..rounds {
                    let mut a1 = p1.next_move(&history_vec, &payoff_matrix);
                    let hist_p2: Vec<Round> = history_vec.iter().map(|(m, o)| (*o, *m)).collect();
                    let mut a2 = p2.next_move(&hist_p2, &payoff_matrix);

                    if rng.random_bool(noise) { a1 = a1.toggle(); }
                    if rng.random_bool(noise) { a2 = a2.toggle(); }

                    history_vec.push((a1, a2));
                    let (s1, _) = calculate_payoff(a1, a2, &payoff_matrix);
                    p1_total += s1;
                }

                let opponent_count = if i == j { population[j] - 1 } else { population[j] };
                if opponent_count > 0 { scores[i] += p1_total * (opponent_count as i32); }
            }
        }

        let mut best_idx = 0; let mut max_score = -1;
        let mut worst_idx = 0; let mut min_score = i32::MAX;

        for &i in &active_strategies {
            let avg_score = scores[i];
            if avg_score > max_score { max_score = avg_score; best_idx = i; }
            if avg_score < min_score { min_score = avg_score; worst_idx = i; }
        }

        if best_idx != worst_idx {
            population[best_idx] += 1;
            population[worst_idx] -= 1;
        }
    }
    history
}

#[tauri::command]
fn greet_engine() -> String {
    "Core Engine: v0.4.0 (Custom Payoff Ready)".to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet_engine, run_game, run_tournament, run_evolution])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}