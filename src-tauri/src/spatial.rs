#[derive(Clone, PartialEq, Debug)]
pub enum Strategy {
    Cooperate,
    Defect,
}

impl Strategy {
    #[inline]
    pub fn as_u8(&self) -> u8 {
        match self {
            Strategy::Cooperate => 1,
            Strategy::Defect => 0,
        }
    }
}

#[derive(Clone, Debug)]
pub struct SpatialGrid<T> {
    pub width: usize,
    pub height: usize,
    pub cells: Vec<T>,
}

impl<T: Clone> SpatialGrid<T> {
    pub fn new(width: usize, height: usize, initial_value: T) -> Self {
        Self {
            width,
            height,
            cells: vec![initial_value; width * height],
        }
    }

    #[inline]
    pub fn get_index(&self, x: usize, y: usize) -> usize {
        y * self.width + x
    }

    pub fn get(&self, x: usize, y: usize) -> &T {
        &self.cells[self.get_index(x, y)]
    }

    pub fn get_moore_neighbors_indices(&self, x: usize, y: usize) -> Vec<usize> {
        let mut neighbors = Vec::with_capacity(8);

        let w = self.width as isize;
        let h = self.height as isize;
        let cx = x as isize;
        let cy = y as isize;

        for dy in -1..=1 {
            for dx in -1..=1 {
                if dx == 0 && dy == 0 {
                    continue;
                }

                let nx = (cx + dx).rem_euclid(w) as usize;
                let ny = (cy + dy).rem_euclid(h) as usize;

                neighbors.push(self.get_index(nx, ny));
            }
        }

        neighbors
    }

    /// play_match is a closure that takes the policies of two agents and returns the score of the first agent.
    pub fn next_generation<F>(&mut self, play_match: F) where F: Fn(&T, &T) -> f32 {
        let total_cells = self.width * self.height;

        // phase 1: local tournament
        let mut scores = vec![0.0; total_cells];

        for y in 0..self.height {
            for x in 0..self.width {
                let idx = self.get_index(x, y);
                let my_strategy = &self.cells[idx];
                let neighbors_indices = self.get_moore_neighbors_indices(x, y);

                let mut my_total_score = 0.0;

                for &n_idx in &neighbors_indices {
                    let neighbor_strategy = &self.cells[n_idx];
                    my_total_score += play_match(my_strategy, neighbor_strategy);
                }

                scores[idx] = my_total_score;
            }
        }

        // phase 2: Darwinian local imitation
        // Create a snapshot of the current universe. All reads are performed in the old universe (self.cells and scores), and all writes are performed in the new universe (next_gen_cells) to eliminate race conditions.
        let mut next_gen_cells = self.cells.clone();

        for y in 0..self.height {
            for x in 0..self.width {
                let idx = self.get_index(x, y);
                let neighbors_indices = self.get_moore_neighbors_indices(x, y);

                // suppose current idx is the best strategy
                let mut best_score = scores[idx];
                let mut best_strategy = self.cells[idx].clone();

                for &n_idx in &neighbors_indices {
                    let neighbor_score = scores[n_idx];

                    // find a better strategy in my neighbors
                    if neighbor_score > best_score {
                        best_score = neighbor_score;
                        // replace my strategy to the best neighbor's
                        best_strategy = self.cells[n_idx].clone();
                    }
                }

                next_gen_cells[idx] = best_strategy;
            }
        }

        // phase 3: state commit
        // Use new state to replace old state
        self.cells = next_gen_cells;
    }

    // random initialization
    pub fn new_random<G>(width: usize, height: usize, mut generator: G) -> Self
        where G: FnMut() -> T
    {
        let total_cells = width * height;
        let mut cells = Vec::with_capacity(total_cells);

        for _ in 0..total_cells {
            cells.push(generator());
        }

        Self {
            width,
            height,
            cells,
        }
    }
}

impl SpatialGrid<Strategy> {
    pub fn to_byte_array(&self) -> Vec<u8> {
        self.cells
            .iter()
            .map(|strategy| strategy.as_u8())
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_toroidal_boundary_conditions() {
        let grid = SpatialGrid::new(10, 10, 0);

        let neighbors = grid.get_moore_neighbors_indices(0, 0);

        assert_eq!(neighbors.len(), 8, "Agent should always have exactly 8 neighbors.");

        let top_left_neighbor_index = 99;

        assert!(
            neighbors.contains(&top_left_neighbor_index),
            "Math Engine Error: Top-left neighbor of (0,0) did not wrap around to bottom-right corner (9,9)!"
        );

        let top_neighbor_index = 90;
        assert!(
            neighbors.contains(&top_neighbor_index),
            "Math Engine Error: Top neighbor of (0,0) did not wrap around to the bottom edge (0,9)!"
        );
    }

    #[test]
    fn test_evolution_defector_invasion() {
        // default: all cooperators in 3*3 grid
        let mut grid = SpatialGrid::new(3, 3, Strategy::Cooperate);

        // place a defector at (1, 1), y * width + x = 1 * 3 + 1 = 4
        grid.cells[4] = Strategy::Defect;

        // Define the payoff matrix closure of the classic Prisoner's Dilemma.
        let play_match = |p1: &Strategy, p2: &Strategy| -> f32 {
            match (p1, p2) {
                (Strategy::Cooperate, Strategy::Cooperate) => 3.0,
                (Strategy::Cooperate, Strategy::Defect) => 0.0,
                (Strategy::Defect, Strategy::Cooperate) => 5.0,
                (Strategy::Defect, Strategy::Defect) => 1.0,
            }
        };

        // In a 3x3 circular grid, the defector in the middle plays against the 8 cooperators, scoring: 8 * 5 = 40 points. The other cooperators play against each other 7 times and against the defector once, scoring: 7 * 3 + 1 * 0 = 21 points. Because 40 > 21, all cooperators will imitate the richest neighbor (the defector) in the next generation.
        grid.next_generation(play_match);

        for (i, cell) in grid.cells.iter().enumerate() {
            assert_eq!(
                *cell,
                Strategy::Defect,
                "Grid cell at index {} did not imitate the Defector!",
                i
            );
        }
    }

    #[test]
    fn test_random_initialization() {
        let grid = SpatialGrid::new_random(10, 10, || {
            if rand::random::<bool>() { Strategy::Cooperate } else { Strategy::Defect }
        });

        assert_eq!(grid.width, 10);
        assert_eq!(grid.height, 10);
        assert_eq!(grid.cells.len(), 100);

        let cooperators = grid.cells
            .iter()
            .filter(|&s| *s == Strategy::Cooperate)
            .count();
        let defectors = grid.cells
            .iter()
            .filter(|&s| *s == Strategy::Defect)
            .count();

        println!("Random world generated: {} Cooperators, {} Defectors", cooperators, defectors);
        assert_eq!(cooperators + defectors, 100);
    }
}
