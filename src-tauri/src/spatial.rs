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
}
