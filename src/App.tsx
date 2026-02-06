import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Action, MatchResult } from "./types";
import { GameGrid } from "./GameGrid";

// --- Mock Data Generator ---
// This mimics the Rust backend logic for frontend testing
function mockSimulation(): MatchResult {
  const rounds: [Action, Action][] = [];
  let p1Score = 0;
  let p2Score = 0;

  // Simulate 10 rounds of random moves
  for (let i = 0; i < 10; i++) {
    const p1: Action = Math.random() > 0.5 ? "Cooperate" : "Defect";
    const p2: Action = Math.random() > 0.5 ? "Cooperate" : "Defect";

    rounds.push([p1, p2]);

    // Calculate simple payoff (Standard Prisoner's Dilemma)
    if (p1 === "Defect" && p2 === "Cooperate") p1Score += 5;
    else if (p1 === "Cooperate" && p2 === "Cooperate") { p1Score += 3; p2Score += 3; }
    else if (p1 === "Defect" && p2 === "Defect") { p1Score += 1; p2Score += 1; }
    else if (p1 === "Cooperate" && p2 === "Defect") p2Score += 5;
  }

  return {
    player_name: "Tit-For-Tat (Mock)",
    opponent_name: "Random (Mock)",
    rounds,
    player_score: p1Score,
    opponent_score: p2Score
  };
}

function App() {
  const [status, setStatus] = useState("Initializing...");
  const [logs, setLogs] = useState<string[]>([]);
  // Ref to auto-scroll to the bottom of logs
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [matchData, setMatchData] = useState<MatchResult | null>(null);

  // --- Simulation Handler ---
  const runSimulation = async () => {
    // 1. Add loading logs
    setLogs(prev => [...prev, "> Initializing Mock Sequence...", "> Connecting to Neural Net..."]);

    // 2. Simulate delay (fake async calculation)
    setTimeout(() => {
      const result = mockSimulation();
      setMatchData(result);

      // 3. Format result into readable strings
      const newLogs = result.rounds.map((r, i) =>
        `Round ${i + 1}: P1 uses ${r[0]} | P2 uses ${r[1]}`
      );

      newLogs.push(`----------------------------------`);
      newLogs.push(`RESULT: P1 (${result.player_score}) - P2 (${result.opponent_score})`);

      // 4. Update UI
      setLogs(prev => [...prev, ...newLogs]);
    }, 800);
  };

  // Auto-scroll effect: whenever 'logs' change, scroll to bottom
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
          <div className="p-3 bg-gray-800 rounded border border-gray-600">
            <h3 className="text-sm font-bold text-white mb-2">Player 1</h3>
            <div className="text-xs text-gray-400">Tit-For-Tat</div>
          </div>
          <div className="p-3 bg-gray-800 rounded border border-gray-600">
            <h3 className="text-sm font-bold text-white mb-2">Player 2</h3>
            <div className="text-xs text-gray-400">Always Defect</div>
          </div>

          {/*  Connected the onClick handler here */}
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

          {/* Insert visual component (only display if data is available) */}
          {matchData && <GameGrid rounds={matchData.rounds} />}

          {/* Mapping through the logs array to render lines dynamically */}
          {logs.map((log, index) => (
            <p key={index} className="mb-1">
              <span className="text-green-400">{">"}</span> {log}
            </p>
          ))}

          {/* Invisible anchor for auto-scrolling */}
          <div ref={logsEndRef} />
        </main>
      </div>
    </div>
  );
}

export default App;