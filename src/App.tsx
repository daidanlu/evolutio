import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { MatchResult } from "./types";
import { GameGrid } from "./GameGrid";
import { StrategySelector } from "./StrategySelector";
import { STRATEGIES } from "./strategies";
import { SettingsPanel } from "./SettingsPanel";

function App() {
  const [status, setStatus] = useState("Initializing...");
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [matchData, setMatchData] = useState<MatchResult | null>(null);

  // --- State for Strategy Selection ---
  const [p1Strategy, setP1Strategy] = useState(STRATEGIES[0].id);
  const [p2Strategy, setP2Strategy] = useState(STRATEGIES[1].id);

  const [speed, setSpeed] = useState(100); // delay=100ms
  const [rounds, setRounds] = useState(20); // rounds=20
  const [noise, setNoise] = useState(0);

  // --- Simulation Handler ---
  const runSimulation = async () => {
    // 1. UI Feedback
    setLogs(prev => [
      ...prev,
      `> Initiating Uplink: [${p1Strategy}] VS [${p2Strategy}]`,
      `> Target: ${rounds} Rounds...`,
      `> Waiting for Core Engine response...`
    ]);

    try {
      // 2. Call the Rust Backend
      // 'run_game' matches the function name in lib.rs
      // { p1Id, p2Id, rounds } matches the arguments in Rust (p1_id, p2_id, rounds)
      const result = await invoke<MatchResult>("run_game", {
        p1Id: p1Strategy,
        p2Id: p2Strategy,
        rounds: rounds,
        noise: noise
      });

      // 3. Process the result
      setTimeout(() => {
        setMatchData(result);

        // Format logs from the real data
        const newLogs = result.rounds.map((r, i) =>
          `Round ${i + 1}: P1 [${r[0]}] | P2 [${r[1]}]`
        );

        newLogs.push(`----------------------------------`);
        newLogs.push(`RESULT: ${result.player_name} (${result.player_score}) - ${result.opponent_name} (${result.opponent_score})`);
        newLogs.push(`> Simulation Complete.`);

        setLogs(prev => [...prev, ...newLogs]);
      }, speed);

    } catch (error) {
      console.error("Rust Error:", error);
      setLogs(prev => [...prev, `[CRITICAL ERROR] Kernel Panic: ${error}`]);
    }
  };



  const runTournament = async () => {
    setLogs(prev => [
      ...prev,
      "==================================",
      "> STARTING GRAND TOURNAMENT...",
      `> Match Format: Round Robin, ${rounds} rounds each.`
    ]);

    try {
      interface TournamentResult {
        ranking: [string, number][]; // Tuple array
      }

      const result = await invoke<TournamentResult>("run_tournament", { rounds, noise });

      const rankLogs = result.ranking.map((entry, index) =>
        `#${index + 1} ${entry[0].padEnd(18)}: ${entry[1]} pts`
      );

      setLogs(prev => [
        ...prev,
        ...rankLogs,
        "=================================="
      ]);

    } catch (error) {
      console.error(error);
      setLogs(prev => [...prev, `[ERROR] Tournament Failed: ${error}`]);
    }
  };

  const runEvolution = async () => {
    setLogs(prev => [
      ...prev,
      "==================================",
      "> STARTING EVOLUTIONARY CYCLE...",
      "> Logic: Survival of the Fittest (Pop +/- 1 per Gen)",
      `> Noise Level: ${(noise * 100).toFixed(0)}%`
    ]);

    try {
      interface Generation {
        gen_number: number;
        populations: [string, number][];
      }

      const history = await invoke<Generation[]>("run_evolution", { rounds, noise });

      // Animation effect: Print one generation every 200ms
      history.forEach((gen, index) => {
        setTimeout(() => {
          // Formatted output: Only display living species
          const alive = gen.populations
            .filter((p) => p[1] > 0)
            .map(p => `${p[0]}: ${p[1]}`)
            .join(" | ");

          setLogs(prev => [...prev, `Gen ${gen.gen_number}: ${alive}`]);
        }, index * 200);
      });

    } catch (error) {
      console.error(error);
      setLogs(prev => [...prev, `[ERROR] Evolution Failed: ${error}`]);
    }
  };

  // Auto-scroll effect
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Check Rust backend connection on mount
  useEffect(() => {
    invoke("greet_engine")
      .then((msg) => setStatus(msg as string))
      .catch(() => setStatus("Offline (Rust backend not detected)"));
  }, []);

  return (
    <div className="h-screen w-screen bg-gray-900 text-green-500 font-mono flex flex-col p-4 overflow-hidden">
      {/* Top Bar */}
      <header className="border-b border-gray-700 pb-4 mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-widest">EVOLUTIO</h1>
          <p className="text-xs text-gray-500">AXELROD TOURNAMENT ENGINE</p>
        </div>
        <div className="text-xs border border-green-800 px-2 py-1 rounded bg-green-900/20">
          STATUS: {status}
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 gap-4 overflow-hidden">

        {/* Left Side: Controls */}
        <aside className="w-64 border-r border-gray-700 pr-4 flex flex-col gap-4">

          <StrategySelector
            label="Player 1 (The Hero)"
            selectedId={p1Strategy}
            onChange={setP1Strategy}
          />

          <StrategySelector
            label="Player 2 (The Rival)"
            selectedId={p2Strategy}
            onChange={setP2Strategy}
          />

          <SettingsPanel
            speed={speed}
            setSpeed={setSpeed}
            rounds={rounds}
            setRounds={setRounds}
            noise={noise}
            setNoise={setNoise}
          />

          <button
            onClick={runEvolution}
            className="mb-2 py-2 border border-purple-600 text-purple-400 font-bold rounded hover:bg-purple-900/30 transition-all"
          >
            START EVOLUTION
          </button>

          <button
            onClick={runTournament}
            className="mb-2 py-2 border border-yellow-600 text-yellow-500 font-bold rounded hover:bg-yellow-900/30 transition-all"
          >
            RUN TOURNAMENT
          </button>

          <button
            onClick={runSimulation}
            className="mt-auto py-2 bg-green-700 hover:bg-green-600 text-white font-bold rounded shadow-lg transition-all active:scale-95"
          >
            START SIMULATION
          </button>
        </aside>

        {/* Right Side: Log Display */}
        <main className="flex-1 bg-black border border-gray-700 rounded p-4 font-mono text-sm overflow-y-auto shadow-inner">
          <p className="text-gray-500">System ready...</p>
          <p className="text-gray-500">Waiting for input...</p>

          {matchData && <GameGrid rounds={matchData.rounds} />}

          {logs.map((log, index) => (
            <p key={index} className="mb-1">
              <span className="text-green-400">{">"}</span> {log}
            </p>
          ))}

          <div ref={logsEndRef} />
        </main>
      </div>
    </div>
  );
}

export default App;