"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Eye, 
  ShieldCheck, 
  Video, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Tv, 
  Sun, 
  Wind, 
  Camera, 
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { fetchCameraFeed, selectVisionClip } from "../lib/api";
import { CVObservation } from "../lib/types";

interface VisionMonitorProps {
  onNavigateAnomaly: () => void;
}

export const VisionMonitorView: React.FC<VisionMonitorProps> = ({ onNavigateAnomaly }) => {
  const [obs, setObs] = useState<CVObservation | null>(null);
  const [activeCamera, setActiveCamera] = useState("cam-b204-01");
  const [selectedClip, setSelectedClip] = useState("b204_vacant_cooling_clip");
  const [useWebcam, setUseWebcam] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const loadFeed = async (camId = activeCamera) => {
    try {
      const data = await fetchCameraFeed(camId);
      setObs(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadFeed();
    const interval = setInterval(() => loadFeed(), 3000);
    return () => clearInterval(interval);
  }, [activeCamera, selectedClip]);

  const handleClipChange = async (clipId: string) => {
    setSelectedClip(clipId);
    if (clipId === "live_webcam") {
      setUseWebcam(true);
      startWebcam();
    } else {
      setUseWebcam(false);
      stopWebcam();
    }
    await selectVisionClip(clipId);
    loadFeed();
  };

  const startWebcam = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.warn("Webcam access not granted or unavailable", err);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const personCount = obs?.detection.person_count ?? 0;
  const vacantMins = obs?.detection.vacant_minutes ?? 52;
  const meterKw = obs?.reconciliation.meter_kw ?? 3.42;
  const expectedKw = obs?.reconciliation.expected_kw ?? 0.60;
  const unexplainedKw = obs?.reconciliation.unexplained_kw ?? 2.82;

  return (
    <div className="space-y-4 p-4 max-w-7xl mx-auto">
      {/* Header with Camera picker and Privacy Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl glass-panel border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Eye className="w-5 h-5 text-cyan-400" />
            <span>Vision Monitor — Computer Vision Stream & Telemetry Fusion</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time YOLOv8 + ByteTrack occupancy, equipment state ROI classification, and meter reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Privacy Mode: Edge counts & states only (Zero faces stored)</span>
          </div>

          <button 
            onClick={() => loadFeed()}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main View: Camera Stream Overlay (Left 65%) + CV vs Meter Reconciliation (Right 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Camera Visualizer */}
        <div className="lg:col-span-8 glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">Camera Feed:</span>
              <select 
                value={activeCamera}
                onChange={(e) => setActiveCamera(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="cam-b204-01">cam-b204-01 (Lab B-204 Wide Angle)</option>
                <option value="cam-b101">cam-b101 (Lab B-101 Main)</option>
                <option value="cam-b207">cam-b207 (Lab B-207 Cyber Lab)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 font-mono text-slate-400">
              <span>FPS: <strong>2.0 (Energy Optimized)</strong></span>
              <span>•</span>
              <span className="text-emerald-400">STATUS: LIVE</span>
            </div>
          </div>

          {/* Simulated or Live Camera Video Canvas */}
          <div className="relative w-full h-96 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
            {useWebcam ? (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            ) : (
              /* High-tech Canvas representation of camera frame with annotated zones and equipment */
              <div className="w-full h-full relative bg-radial from-slate-900 to-[#070b14] flex flex-col justify-between p-6">
                {/* Room Geometry Grid lines */}
                <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* Overhead Lighting ROI Overlay */}
                <div className="absolute top-8 left-16 right-16 h-12 border-2 border-dashed border-yellow-400/60 bg-yellow-400/10 rounded flex items-center justify-between px-4">
                  <div className="flex items-center gap-2 text-yellow-300 font-mono text-xs">
                    <Sun className="w-4 h-4" />
                    <span>ROI: LIGHTING-FIXTURE-BANK (240 LUX)</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-yellow-500 text-slate-950 font-bold text-[10px]">
                    STATE: ON (0.97 CONF)
                  </span>
                </div>

                {/* Ceiling Fan ROI */}
                <div className="absolute top-24 left-1/2 -translate-x-1/2 w-28 h-16 border-2 border-cyan-500/40 rounded flex flex-col items-center justify-center text-[10px] text-cyan-300">
                  <Wind className="w-4 h-4 animate-spin" />
                  <span>FAN-02 (IDLE)</span>
                </div>

                {/* Exterior Window ROI */}
                <div className="absolute top-28 right-8 w-24 h-44 border-2 border-sky-400/50 bg-sky-500/10 rounded flex flex-col items-center justify-center text-[10px] text-sky-200">
                  <span>WINDOW-1</span>
                  <span className="font-bold text-emerald-400 mt-1">CLOSED</span>
                </div>

                {/* Workstations / PC Bank ROI */}
                <div className="absolute bottom-12 left-12 right-28 h-36 border-2 border-purple-500/60 bg-purple-950/20 rounded p-2 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-purple-300 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Tv className="w-3.5 h-3.5" />
                      <span>ROI: WORKSTATION-CLUSTER (28 UNITS)</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-200 text-[10px] font-bold">
                      {selectedClip === "b101_occupied_clip" ? "24 ACTIVE USERS" : "17 UNITS IDLE POWER"}
                    </span>
                  </div>

                  {/* Draw person bounding boxes if active */}
                  {personCount > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Array.from({ length: Math.min(personCount, 12) }).map((_, i) => (
                        <div key={i} className="border-2 border-emerald-400 bg-emerald-500/20 px-1 py-0.5 text-[9px] font-mono text-emerald-200 rounded">
                          person #{i+1} (94%)
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 text-xs italic">
                      No human movement detected in ROI
                    </div>
                  )}
                </div>

                {/* Vacancy HUD Timer Pill */}
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 shadow-lg">
                  <Clock className={`w-4 h-4 ${personCount === 0 ? "text-rose-400 animate-pulse" : "text-emerald-400"}`} />
                  <div className="text-xs font-mono">
                    {personCount === 0 ? (
                      <span>VACANT: <strong className="text-rose-400 font-bold">{vacantMins} min</strong></span>
                    ) : (
                      <span>OCCUPIED: <strong className="text-emerald-400 font-bold">{personCount} people</strong></span>
                    )}
                  </div>
                </div>

                {/* Watermark / Zone Stamp */}
                <div className="absolute bottom-3 right-4 text-right font-mono text-[11px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                  <div>CAM: {activeCamera}</div>
                  <div className="text-cyan-400 font-bold">ZONE: {obs?.zone_id || "B-204"}</div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Clip Selector Tray */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-400 font-medium">Replay Test Scenario:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleClipChange("b204_vacant_cooling_clip")}
                className={`px-2.5 py-1 rounded text-xs transition ${
                  selectedClip === "b204_vacant_cooling_clip"
                    ? "bg-rose-900/60 border border-rose-500 text-rose-200 font-semibold"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                Clip 1: B-204 Vacant (AC ON)
              </button>
              <button
                onClick={() => handleClipChange("b101_occupied_clip")}
                className={`px-2.5 py-1 rounded text-xs transition ${
                  selectedClip === "b101_occupied_clip"
                    ? "bg-emerald-900/60 border border-emerald-500 text-emerald-200 font-semibold"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                Clip 2: B-101 Full Class (24 People)
              </button>
              <button
                onClick={() => handleClipChange("b207_after_hours_clip")}
                className={`px-2.5 py-1 rounded text-xs transition ${
                  selectedClip === "b207_after_hours_clip"
                    ? "bg-amber-900/60 border border-amber-500 text-amber-200 font-semibold"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                Clip 3: B-207 Overnight Load
              </button>
              <button
                onClick={() => handleClipChange("live_webcam")}
                className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition ${
                  selectedClip === "live_webcam"
                    ? "bg-cyan-900/60 border border-cyan-500 text-cyan-200 font-semibold"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Live Webcam</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: CV Says vs Meter Says Reconciliation Panel */}
        <div className="lg:col-span-4 glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <span>State Reconciliation Engine</span>
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                unexplainedKw > 0.5 ? "bg-rose-950 border border-rose-800 text-rose-400" : "bg-emerald-950 border border-emerald-800 text-emerald-400"
              }`}>
                {unexplainedKw > 0.5 ? "WASTE DETECTED" : "JUSTIFIED"}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Cross-reconciliation between visual evidence from cameras and electrical meter telemetry.
            </p>

            {/* Split Gauge Comparison Cards */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">
                  Vision Ground Truth
                </span>
                <div className="mt-1">
                  <div className="text-lg font-bold font-mono text-white">{personCount} Occupants</div>
                  <div className="text-[11px] text-slate-400">
                    {personCount === 0 ? `Vacant for ${vacantMins} min` : "Active work session"}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                  Electrical Meter
                </span>
                <div className="mt-1">
                  <div className="text-lg font-bold font-mono text-white">{meterKw} kW</div>
                  <div className="text-[11px] text-slate-400">Active power drawn</div>
                </div>
              </div>
            </div>

            {/* Mathematical Residual Breakdown */}
            <div className="p-3 mt-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Measured Electrical Load:</span>
                <span className="font-mono font-bold text-white">{meterKw} kW</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Twin Expected Baseline:</span>
                <span className="font-mono text-cyan-400">− {expectedKw} kW</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold">
                <span className="text-rose-400">Unexplained Load (UL):</span>
                <span className="font-mono text-rose-400 text-sm">+{unexplainedKw} kW</span>
              </div>
            </div>

            {/* AI Diagnosis Narrative */}
            <div className="mt-4 p-3 rounded-lg bg-indigo-950/30 border border-indigo-900/50 text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-indigo-300 block mb-1">Causal Diagnosis:</span>
              {obs?.reconciliation.narrative || "Twin detects significant mismatch between camera observations and power consumption."}
            </div>
          </div>

          {/* Deep link button to Anomaly */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={onNavigateAnomaly}
              className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-rose-600/30"
            >
              <span>Jump to Resulting Anomaly in Center</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
