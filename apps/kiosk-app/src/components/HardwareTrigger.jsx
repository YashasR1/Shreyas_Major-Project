import React from 'react';
import { Fingerprint, Radio, CheckCircle, Loader2, Play, Square } from 'lucide-react';

export default function HardwareTrigger({ isEnrolling, hasFingerprint, onToggleEnrolling }) {
  return (
    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 transition-all shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono font-bold text-green-600 uppercase tracking-wider">
            IOT HARDWARE LINK (ESP32)
          </span>
          <h4 className="font-extrabold text-gray-900 text-sm mt-0.5">External Fingerprint Sensor Signal</h4>
        </div>

        {isEnrolling ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200 text-xs font-mono font-bold animate-pulse">
            <Radio className="w-3.5 h-3.5 animate-spin" />
            <span>SIGNAL ACTIVE</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200 text-xs font-mono font-bold">
            <span>IDLE STATE</span>
          </span>
        )}
      </div>

      <div className="mt-4">
        {isEnrolling ? (
          <button
            onClick={() => onToggleEnrolling(false)}
            className="w-full py-2.5 px-4 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 font-bold text-xs font-mono transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Square className="w-4 h-4 fill-orange-500 text-orange-500" />
            <span>Cancel Hardware Enrollment Signal (Set is_enrolling = false)</span>
          </button>
        ) : (
          <button
            onClick={() => onToggleEnrolling(true)}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs font-mono transition-all flex items-center justify-center gap-2 shadow-sm ${hasFingerprint ? 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300' : 'bg-green-50 hover:bg-green-100 text-green-800 border border-green-200'
              }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{hasFingerprint ? 'Re-trigger ESP32 Sensor Signal' : 'Trigger ESP32 Fingerprint Enrollment'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
