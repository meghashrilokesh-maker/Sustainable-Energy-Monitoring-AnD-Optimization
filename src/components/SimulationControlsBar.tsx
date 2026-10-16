"use client";

import React, { useState } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Database, 
  Info, 
  Zap, 
  Thermometer, 
  Wind, 
  Clock, 
  SlidersHorizontal 
} from "lucide-react";
import { SimulationState } from "../lib/types";

interface SimulationControlsBarProps {
  state: SimulationState;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onScrub: (index: number) => void;
}

export const SimulationControlsBar: React.FC<SimulationControlsBarProps> = ({
  state,
  onPlay,
  onPause,
  onReset,
  onSpeedChange,
  onScrub
}) => {
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const rec = state.currentRecord;
  const speeds = [1, 5, 10, 30, 60];

  const pct = state.totalRecords > 0 
    ? Math.round((state.currentIndex / state.totalRecords) * 1000) / 10 
    : 0;

  return (
    <>
      <div className="w-full bg-[#0a0f1e] border-y border-cyan-500/30 px-4 py-2.5 text-xs text-slate-200 shadow-lg backdrop-blur-md sticky top-[89px] z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Status Label & Provenance Badge */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 font-semibold tracking-wide shadow-sm shadow-cyan-500/20">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${state.isPlaying ? "bg-cyan-400 opacity-75" : "bg-amber-400 opacity-40"}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${state.isPlaying ? "bg-cyan-500" : "bg-amber-500"}`}></span>
              </span>
              <span className="text-[11px] font-mono">Simulated Live — UCI Dataset</span>
            </div>

            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition"
              title="Dataset Provenance & Physical Units"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Core Controls: Start, Pause, Resume, Reset, Speed */}
          <div className="flex items-center gap-2">
            {state.isPlaying ? (
              <button
                onClick={onPause}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium transition shadow-sm shadow-amber-600/30"
                title="Pause Dataset Replay"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={onPlay}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition shadow-sm shadow-emerald-600/30"
                title="Resume Dataset Replay"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{state.currentIndex === 0 ? "Start" : "Resume"}</span>
              </button>
            )}

            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
              title="Reset to Record 0 (Jan 11, 2016 17:00:00)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            {/* Speed Selector */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 ml-1">
              <span className="text-[10px] text-slate-400 px-1.5 flex items-center gap-1">
                <FastForward className="w-3 h-3 text-cyan-400" /> Speed:
              </span>
              {speeds.map((s) => (
                <button
                  key={s}
                  onClick={() => onSpeedChange(s)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition ${
                    state.speed === s
                      ? "bg-cyan-500 text-black font-bold shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Current Observation Telemetry Quick Badge */}
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
              <Clock className="w-3 h-3 text-indigo-400" />
              <span className="text-slate-200 font-semibold">{rec?.date || "2016-01-11 17:00:00"}</span>
            </div>

            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span className="text-cyan-300 font-bold">{rec?.totalKw.toFixed(2) || "0.54"} kW</span>
              <span className="text-[10px] text-slate-500">
                (App: {rec?.appKw.toFixed(2)} | Lgt: {rec?.lgtKw.toFixed(2)})
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
              <Thermometer className="w-3 h-3 text-amber-400" />
              <span>{rec?.tOut?.toFixed(1) || "6.6"}°C</span>
              <Wind className="w-3 h-3 text-blue-400 ml-1.5" />
              <span>{rec?.wind?.toFixed(0) || "7"} m/s</span>
            </div>
          </div>

        </div>

        {/* Timeline Scrubber */}
        <div className="max-w-7xl mx-auto mt-2 pt-1.5 border-t border-slate-800/60 flex items-center gap-3">
          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
            Record {state.currentIndex + 1} / {state.totalRecords} ({pct}%)
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(0, state.totalRecords - 1)}
            value={state.currentIndex}
            onChange={(e) => onScrub(parseInt(e.target.value, 10))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-hidden"
          />
          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
            {state.isPlaying ? `Running (${state.speed}x)` : "Paused"}
          </span>
        </div>
      </div>

      {/* Info Modal / Drawer */}
      {showInfo && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b1329] border border-cyan-500/40 rounded-2xl max-w-2xl w-full p-6 text-xs text-slate-300 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">UCI Appliances Energy Prediction Dataset (#374)</h3>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 leading-relaxed">
              <p>
                <strong>Dataset Provenance:</strong> Ingested directly from the canonical study by <em>Luis Candanedo, Véronique Feldheim, and Dominique Deramaix (Energy and Buildings, Vol. 140, 2017)</em>.
              </p>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 font-mono text-[11px]">
                <div>• Total Instances: <strong>19,735 records</strong> at 10-minute intervals</div>
                <div>• Timeline: <strong>Jan 11, 2016 17:00:00</strong> to <strong>May 27, 2016 18:00:00</strong></div>
                <div>• Logged Variables: 29 features (M-Bus appliance energy Wh, lights Wh, ZigBee temperature/humidity zones T1-T9, and airport weather).</div>
              </div>
              <p>
                <strong>Unit Conversion & Physics:</strong> Each 10-minute Wh reading is converted to average power in kilowatts:
                <br />
                <code className="text-cyan-300 font-mono">P (kW) = Energy (Wh) * (60 / 10) / 1000 = 0.006 * Wh</code>
              </p>
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-600/40 text-amber-200 text-[11px]">
                <strong>Scientific & Safety Disclaimer:</strong> This application replays historical empirical low-energy building telemetry for digital twin simulation, anomaly triage, and algorithmic optimization. Optimization actions alter the <em>software twin model</em> only, and make no claim to actuate physical equipment.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
