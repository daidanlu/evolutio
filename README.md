# Evolutio: The Evolution of Cooperation

> "We are used to thinking about competitions in which there is only one winner... But the world is rarely like that." — Robert Axelrod

**Evolutio** is a high-performance simulation engine designed to visualize game theory dynamics, specifically focusing on the **Iterated Prisoner's Dilemma (IPD)** and **Spatial Chaos**.

Built with **Rust** for the simulation core and **React (Tauri)** for visualization, this project aims to replicate and extend the findings of seminal papers in evolutionary biology and complex systems.

## Key Academic References

This project implements models described in:

1.  **Axelrod, R., & Hamilton, W. D. (1981).** *The Evolution of Cooperation*. Science.
    * *Goal:* Simulating the emergence of cooperation in a population of egoists.
2.  **Nowak, M. A., & May, R. M. (1992).** *Evolutionary games and spatial chaos*. Nature.
    * *Goal:* Visualizing kaleidoscopic patterns and chaos in spatial grids without memory.

## Tech Stack

* **Core Engine**: Rust (High-performance state management & computation)
* **Frontend**: React + TypeScript (UI & Controls)
* **Visualization**: Canvas API / WebGL (For rendering spatial grids)
* **Framework**: Tauri v2 (App runtime)

## Roadmap

### Phase 1: The Tournament Engine
- [ ] Define the `Strategy` trait in Rust.
- [ ] Implement classic strategies: *Tit-For-Tat*, *Always Defect*, *Always Cooperate*, *Random*.
- [ ] Build a round-robin tournament simulator.

### Phase 2: Ecological Dynamics
- [ ] Implement population dynamics (reproduction based on scores).
- [ ] Visualize population curves over generations.

### Phase 3: Spatial Chaos (Nowak & May)
- [ ] Implement 2D Grid Cellular Automata system.
- [ ] Implement Moore neighborhood interactions.
- [ ] Render real-time spatial evolution patterns.

## License

MIT