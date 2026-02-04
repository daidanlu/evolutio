import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const [status, setStatus] = useState("Initializing...");

  // test rust connections
  useEffect(() => {
    invoke("greet_engine")
      .then((msg) => setStatus(msg as string))
      .catch(() => setStatus("Offline (Rust backend not detected)"));
  }, []);

  return (
    <div className="h-screen w-screen bg-gray-900 text-green-500 font-mono flex flex-col p-4 overflow-hidden">
      {/* Top bar */}
      <header className="border-b border-gray-700 pb-4 mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-widest">EVOLUTIO</h1>
          <p className="text-xs text-gray-500">AXELROD TOURNAMENT ENGINE</p>
        </div>
        <div className="text-xs border border-green-800 px-2 py-1 rounded bg-green-900/20">
          STATUS: {status}
        </div>
      </header>

      {/* Main layout: controls on the left, display on the right */}
      <div className="flex flex-1 gap-4 overflow-hidden">

        {/* Left side: Strategy selection area (static display) */}
        <aside className="w-64 border-r border-gray-700 pr-4 flex flex-col gap-4">
          <div className="p-3 bg-gray-800 rounded border border-gray-600">
            <h3 className="text-sm font-bold text-white mb-2">Player 1</h3>
            <div className="text-xs text-gray-400">Tit-For-Tat</div>
          </div>
          <div className="p-3 bg-gray-800 rounded border border-gray-600">
            <h3 className="text-sm font-bold text-white mb-2">Player 2</h3>
            <div className="text-xs text-gray-400">Always Defect</div>
          </div>
          <button className="mt-auto py-2 bg-green-700 hover:bg-green-600 text-white font-bold rounded shadow-lg transition-all">
            START SIMULATION
          </button>
        </aside>

        {/* Right side: Log output area */}
        <main className="flex-1 bg-black border border-gray-700 rounded p-4 font-mono text-sm overflow-y-auto shadow-inner">
          <p className="text-gray-500">System ready...</p>
          <p className="text-gray-500">Waiting for input...</p>
          <p className="mt-2 text-green-400">{">"} Awaiting Strategy Injection...</p>
        </main>
      </div>
    </div>
  );
}

export default App;