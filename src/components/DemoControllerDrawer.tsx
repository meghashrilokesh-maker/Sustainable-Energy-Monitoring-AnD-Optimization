"use client";

import React from "react";
import { X, Play, AlertOctagon, CheckCircle, Video, FastForward, Sparkles } from "lucide-react";
import { toggleDemoFault, selectVisionClip } from "../lib/api";

interface DemoControllerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeFaults: Record<string, boolean>;
  setActiveFaults: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  activeClip: string;
  setActiveClip: (clip: string) => void;
  jumpToTab: (tab: string) => void;
  refreshData: () => void;
}

export const DemoControllerDrawer: React.FC<DemoControllerDrawerProps> = ({
  isOpen,
  onClose,
  activeFaults,
  setActiveFaults,
  activeClip,
  setActiveClip,
  jumpToTab,
  refreshData
}) => {
  if (!isOpen) return null;

  const handleToggleFault = async (faultId: string) => {
    const nextVal = !activeFaults[faultId];
    setActiveFaults(prev => ({ ...prev, [faultId]: nextVal }));
    try {
      await toggleDemoFault(faultId, nextVal);
      refreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectClip = async (clipId: string) => {
    setActiveClip(clipId);
    try {
      await selectVisionClip(clipId);
      refreshData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 bg-[#0a0f1d] border-l border-indigo-500/30 shadow-2xl p-5 overflow-y-auto text-slate-200 backdrop-blur-xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FastForward className="w-5 h-5 text-indigo-400" />
          <h2 className="font-bold text-base text-white tracking-wide">Demo Controller</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-4 space-y-6 text-xs">
        {/* Storyboard Quick Jump */}
        <div>
          <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block mb-2">
            Presentation Storyboard (§19)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { jumpToTab("command"); onClose(); }}
              className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left hover:border-cyan-500/40 transition"
            >
              <div className="font-semibold text-cyan-300">1. The Hook</div>
              <div className="text-[10px] text-slate-400">12% above twin baseline</div>
            </button>
            <button
              onClick={() => { jumpToTab("twin"); onClose(); }}
              className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left hover:border-cyan-500/40 transition"
            >
              <div className="font-semibold text-cyan-300">2. Waste Heatmap</div>
              <div className="text-[10px] text-slate-400">B-204 glows red hotspot</div>
            </button>
            <button
              onClick={() => { jumpToTab("vision"); onClose(); }}
              className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left hover:border-cyan-500/40 transition"
            >
              <div className="font-semibold text-cyan-300">3. Vision Monitor</div>
              <div className="text-[10px] text-slate-400">Vacant 52m with AC ON</div>
            </button>
            <button
              onClick={() => { jumpToTab("anomalies"); onClose(); }}
              className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left hover:border-cyan-500/40 transition"
            >
              <div className="font-semibold text-cyan-300">4. Anomaly Triage</div>
              <div className="text-[10px] text-slate-400">Evidence & causal chain</div>
            </button>
            <button
              onClick={() => { jumpToTab("simulator"); onClose(); }}
              className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left hover:border-cyan-500/40 transition"
            >
              <div className="font-semibold text-cyan-300">5. What-If Sim</div>
              <div className="text-[10px] text-slate-400">4-way comparison delta</div>
            </button>
            <button
              onClick={() => { jumpToTab("optimization"); onClose(); }}
              className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left hover:border-cyan-500/40 transition"
            >
              <div className="font-semibold text-cyan-300">6. M&V Loop</div>
              <div className="text-[10px] text-slate-400">Realized verified savings</div>
            </button>
          </div>
        </div>

        {/* Scripted Fault Injection */}
        <div>
          <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block mb-2">
            Fault Injections (Physics Residuals)
          </span>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
              <div>
                <div className="font-semibold text-slate-200">F1: Empty-Room Conditioning</div>
                <div className="text-[10px] text-slate-400">B-204 AC at 3.1 kW while room is vacant</div>
              </div>
              <button
                onClick={() => handleToggleFault("F1")}
                className={`px-3 py-1 rounded text-[11px] font-bold transition ${
                  activeFaults["F1"] 
                    ? "bg-rose-600 text-white shadow-sm shadow-rose-600/40" 
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {activeFaults["F1"] ? "ACTIVE" : "OFF"}
              </button>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
              <div>
                <div className="font-semibold text-slate-200">F2: After-Hours PC/Light Load</div>
                <div className="text-[10px] text-slate-400">B-207 lab workstations running overnight</div>
              </div>
              <button
                onClick={() => handleToggleFault("F2")}
                className={`px-3 py-1 rounded text-[11px] font-bold transition ${
                  activeFaults["F2"] 
                    ? "bg-rose-600 text-white shadow-sm shadow-rose-600/40" 
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {activeFaults["F2"] ? "ACTIVE" : "OFF"}
              </button>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
              <div>
                <div className="font-semibold text-slate-200">F3: Window Open with AC</div>
                <div className="text-[10px] text-slate-400">B-204 thermal leakage +1.6 kW draft</div>
              </div>
              <button
                onClick={() => handleToggleFault("F3")}
                className={`px-3 py-1 rounded text-[11px] font-bold transition ${
                  activeFaults["F3"] 
                    ? "bg-rose-600 text-white shadow-sm shadow-rose-600/40" 
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {activeFaults["F3"] ? "ACTIVE" : "OFF"}
              </button>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
              <div>
                <div className="font-semibold text-slate-200">F4: Compressor COP Degradation</div>
                <div className="text-[10px] text-slate-400">B-207 old Carrier unit drawing +25% kW</div>
              </div>
              <button
                onClick={() => handleToggleFault("F4")}
                className={`px-3 py-1 rounded text-[11px] font-bold transition ${
                  activeFaults["F4"] 
                    ? "bg-rose-600 text-white shadow-sm shadow-rose-600/40" 
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {activeFaults["F4"] ? "ACTIVE" : "OFF"}
              </button>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
              <div>
                <div className="font-semibold text-slate-200">F5: Sensor Data Disagreement</div>
                <div className="text-[10px] text-slate-400">Meter flatline vs high CV occupants</div>
              </div>
              <button
                onClick={() => handleToggleFault("F5")}
                className={`px-3 py-1 rounded text-[11px] font-bold transition ${
                  activeFaults["F5"] 
                    ? "bg-rose-600 text-white shadow-sm shadow-rose-600/40" 
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {activeFaults["F5"] ? "ACTIVE" : "OFF"}
              </button>
            </div>
          </div>
        </div>

        {/* Video Replay Selector */}
        <div>
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block mb-2">
            Camera Feed Selection
          </span>
          <div className="space-y-1.5">
            {[
              { id: "b204_vacant_cooling_clip", label: "Clip 1: B-204 Vacant (People Leave, AC ON)" },
              { id: "b101_occupied_clip", label: "Clip 2: B-101 Full Lab (24 Active Students)" },
              { id: "b207_after_hours_clip", label: "Clip 3: B-207 Empty with 20 PCs ON" },
              { id: "live_webcam", label: "Clip 4: Live Browser Webcam (Test Yourself)" }
            ].map(clip => (
              <button
                key={clip.id}
                onClick={() => handleSelectClip(clip.id)}
                className={`w-full flex items-center justify-between p-2 rounded text-left transition ${
                  activeClip === clip.id
                    ? "bg-emerald-950/60 border border-emerald-500/50 text-emerald-300"
                    : "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span>{clip.label}</span>
                {activeClip === clip.id && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
