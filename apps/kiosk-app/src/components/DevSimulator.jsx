import React, { useState } from 'react';
import { Sparkles, Terminal, CheckCircle2, Loader2, ArrowUpRight, Zap } from 'lucide-react';

export default function DevSimulator({ isEnrolling, onSimulateComplete }) {
  const [simulating, setSimulating] = useState(false);
  const [customId, setCustomId] = useState('FP_ESP32_88492');

  const handleRunSimulation = () => {
    setSimulating(true);
    setTimeout(() => {
      onSimulateComplete(customId || 'FP_ESP32_88492');
      setSimulating(false);
    }, 900);
  };

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-white border border-green-200 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-24 h-24 bg-green-100 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-green-700 text-xs font-mono font-bold">
          <Zap className="w-4 h-4 text-green-600 animate-bounce" />
          <span>ESP32 SIMULATOR TOGGLE</span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-green-100 text-green-800 font-bold border border-green-200">
          TESTING SUITE
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={customId}
            onChange={(e) => setCustomId(e.target.value.toUpperCase())}
            placeholder="Mock FP ID..."
            className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 focus:border-green-500 text-gray-900 font-mono text-xs outline-none"
          />
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={simulating || !isEnrolling}
          className={`py-2 px-4 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 ${isEnrolling
              ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-200 shadow-sm animate-pulse'
              : 'bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed'
            }`}
          title={isEnrolling ? 'Simulate hardware response' : 'Trigger enrollment signal above first!'}
        >
          {simulating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Scanning...</span>
            </>
          ) : (
            <>
              <Terminal className="w-3.5 h-3.5" />
              <span>Simulate ESP32 Complete Scan</span>
            </>
          )}
        </button>
      </div>

      {!isEnrolling && (
        <p className="mt-2 text-[11px] text-gray-500 italic font-mono text-center">
          💡 Tip: Click "Trigger ESP32 Fingerprint Enrollment" above to enable simulator!
        </p>
      )}
    </div>
  );
}
