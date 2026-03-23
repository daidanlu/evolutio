import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { MatchResult } from "./types";
import { GameGrid } from "./GameGrid";
import { StrategySelector } from "./StrategySelector";
import { STRATEGIES } from "./strategies";
import { SettingsPanel } from "./SettingsPanel";
import { EvolutionChart } from "./EvolutionChart";
import { TournamentChart } from "./TournamentChart";
import { Tooltip } from "./Tooltip";
import { TerminalLine } from "./TerminalLine";
import { DominanceChart } from "./DominanceChart";
import { useStickyState } from "./useStickyState";
import { SpatialCanvas } from "./SpatialCanvas";

function App() {
  const [status, setStatus] = useState("Initializing...");
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [matchData, setMatchData] = useState<MatchResult | null>(null);
  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  const [tournamentData, setTournamentData] = useState<{ name: string, score: number }[]>([]);

  // --- State for Strategy Selection ---
  const [p1Strategy, setP1Strategy] = useState(STRATEGIES[0].id);
  const [p2Strategy, setP2Strategy] = useState(STRATEGIES[1].id);
  const [spatialTrigger, setSpatialTrigger] = useState(0);
  const [speed, setSpeed] = useStickyState(100, "evolutio-speed");
  const [rounds, setRounds] = useStickyState(20, "evolutio-rounds");
  const [generations, setGenerations] = useStickyState(50, "evolutio-generations");
  const [noise, setNoise] = useStickyState(0, "evolutio-noise");
  const [payoff, setPayoff] = useStickyState({ t: 5, r: 3, p: 1, s: 0 }, "evolutio-payoff");

  const [initialPops, setInitialPops] = useStickyState<number[]>([
    5, 5, 5, 5, 5, 5, 5, 5
  ], "evolutio-initial-pops");

  const activeTimeouts = useRef<number[]>([]);

  const clearSandbox = () => {
    activeTimeouts.current.forEach(clearTimeout);
    activeTimeouts.current = [];

    setLogs(["> Sandbox environment reset. Waiting for new parameters..."]);
    setMatchData(null);
    setEvolutionData([]);
    setTournamentData([]);
  };


  const handleExportCSV = () => {
    if (evolutionData.length > 0) {
      const formattedData = evolutionData.map(gen => {
        const row: any = { Generation: gen.gen_number };
        gen.populations.forEach((p: [string, number]) => {
          row[p[0]] = p[1];
        });
        return row;
      });
      exportToCSV("evolutio_evolution_data.csv", formattedData);
      setLogs(prev => [...prev, "> SUCCESS: Evolution data exported to CSV."]);
    }

    else if (tournamentData.length > 0) {
      const formattedData = tournamentData.map((t, i) => ({
        Rank: i + 1,
        Strategy: t.name,
        Score: t.score
      }));
      exportToCSV("evolutio_tournament_data.csv", formattedData);
      setLogs(prev => [...prev, "> SUCCESS: Tournament rankings exported to CSV."]);
    }
  };

  // --- Simulation Handler ---
  const runSimulation = async () => {
    setEvolutionData([]);
    setTournamentData([]);

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
        noise: noise,
        payoffMatrix: payoff
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
    setMatchData(null);
    setEvolutionData([]);
    setTournamentData([]);

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

      const result = await invoke<TournamentResult>("run_tournament", {
        rounds, noise,
        payoffMatrix: payoff
      });

      const rankLogs = result.ranking.map((entry, index) =>
        `#${index + 1} ${entry[0].padEnd(18)}: ${entry[1]} pts`
      );

      setLogs(prev => [
        ...prev,
        ...rankLogs,
        "=================================="
      ]);

      const chartData = result.ranking.map(entry => ({
        name: entry[0],
        score: entry[1]
      }));
      setTournamentData(chartData);

    } catch (error) {
      console.error(error);
      setLogs(prev => [...prev, `[ERROR] Tournament Failed: ${error}`]);
    }
  };

  const runEvolution = async () => {
    activeTimeouts.current.forEach(clearTimeout);
    activeTimeouts.current = [];

    setMatchData(null);
    setTournamentData([]);

    setEvolutionData([]);

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

      const history = await invoke<Generation[]>("run_evolution", {
        rounds: rounds,
        noise: noise,
        initialPopulations: initialPops,
        generations: generations,
        payoffMatrix: payoff
      });

      history.forEach((gen, index) => {
        const timerId = window.setTimeout(() => {

          const alive = gen.populations
            .filter((p) => p[1] > 0)
            .map(p => `${p[0]}: ${p[1]}`)
            .join(" | ");
          setLogs(prev => [...prev, `Gen ${gen.gen_number}: ${alive}`]);
          setEvolutionData(prev => [...prev, gen]);

        }, index * 200);

        activeTimeouts.current.push(timerId);
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
        <aside className="w-64 border-r border-gray-700 pr-4 flex flex-col h-full">

          <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2 pb-4 style-scrollbar">
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
              generations={generations}
              setGenerations={setGenerations}
              payoff={payoff} setPayoff={setPayoff}
            />

            <div className="p-4 bg-gray-800 rounded border border-gray-700 flex flex-col gap-2 shrink-0">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ecosystem Setup</h3>
              {STRATEGIES.map((strategy, index) => (
                <div key={strategy.id} className="flex justify-between items-center text-xs">
                  <Tooltip text={strategy.description}>
                    <span className={`border-b border-dashed border-gray-600 transition-colors pb-[1px] cursor-help ${strategy.color}`}>
                      {strategy.name}
                    </span>
                  </Tooltip>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={initialPops[index]}
                    onChange={(e) => {
                      const newPops = [...initialPops];
                      newPops[index] = Number(e.target.value);
                      setInitialPops(newPops);
                    }}
                    className="w-12 bg-gray-900 border border-gray-600 rounded text-center text-white focus:border-purple-500 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="shrink-0 flex flex-col pt-4 border-t border-gray-700">
            <button
              onClick={clearSandbox}
              className="mb-4 py-1 border border-gray-500 text-gray-400 text-sm rounded hover:bg-gray-800 transition-all"
            >
              CLEAR SANDBOX
            </button>

            <button
              onClick={() => setSpatialTrigger(prev => prev + 1)}
              className="mb-2 py-2 border border-blue-600 text-blue-400 font-bold rounded hover:bg-blue-900/30 transition-all"
            >
              INIT SPATIAL GRID
            </button>

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
              className="py-2 bg-green-700 hover:bg-green-600 text-white font-bold rounded shadow-lg transition-all active:scale-95"
            >
              START SIMULATION
            </button>
          </div>

        </aside>

        {/* Right Side: Log Display */}
        <main className="flex-1 bg-black border border-gray-700 rounded p-4 font-mono text-sm overflow-y-auto shadow-inner flex flex-col">
          <p className="text-gray-500">System ready...</p>
          <p className="text-gray-500">Waiting for input...</p>

          {(evolutionData.length > 0 || tournamentData.length > 0) && (
            <div className="flex justify-end mb-2">
              <button
                onClick={handleExportCSV}
                className="text-[10px] font-bold text-blue-400 border border-blue-800 bg-blue-900/20 px-3 py-1 rounded hover:bg-blue-800 hover:text-white transition-all shadow-lg"
              >
                [↓] EXPORT TO CSV
              </button>
            </div>
          )}

          <div className="flex justify-center my-6 shrink-0">
            <SpatialCanvas
              width={100}
              height={100}
              trigger={spatialTrigger}
              payoff={payoff}
            />
          </div>

          {matchData && <GameGrid rounds={matchData.rounds} />}


          {evolutionData.length > 0 && (() => {
            const latestGen = evolutionData[evolutionData.length - 1];
            const pieData = latestGen.populations.map((p: [string, number]) => ({
              name: p[0],
              value: p[1]
            }));

            return (
              <div className="flex gap-4 items-start">
                <div className="w-2/3">
                  <EvolutionChart data={evolutionData} />
                </div>
                <div className="w-1/3">
                  <DominanceChart data={pieData} generation={latestGen.gen_number} />
                </div>
              </div>
            );
          })()}

          {tournamentData.length > 0 && (
            <TournamentChart data={tournamentData} />
          )}

          <div className="mt-4 flex-1 overflow-y-auto">
            {logs.map((log, index) => (
              <TerminalLine key={index} text={log} />
            ))}
            <div ref={logsEndRef} />
          </div>
        </main>
      </div>
    </div>
  );
}


const exportToCSV = (filename: string, rows: object[]) => {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);

  const csvContent =
    keys.join(separator) +
    '\n' +
    rows.map(row => {
      return keys.map(k => {
        let cell = row[k as keyof typeof row] === null || row[k as keyof typeof row] === undefined ? '' : row[k as keyof typeof row];
        cell = cell.toString().replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
        return cell;
      }).join(separator);
    }).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export default App;