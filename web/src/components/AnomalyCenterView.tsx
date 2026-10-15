"use client";

import React, { useState } from "react";
import { 
  AlertTriangle, 
  Flame, 
  CheckCircle, 
  Clock, 
  ChevronRight, 
  ShieldAlert, 
  Sparkles, 
  Sliders, 
  Activity,
  Layers,
  ArrowRight
} from "lucide-react";
import { Anomaly } from "../lib/types";
import { resolveAnomaly } from "../lib/api";

interface AnomalyCenterProps {
  anomalies: Anomaly[];
  onSimulateFix: (anomaly: Anomaly) => void;
  onRefresh: () => void;
}

export const AnomalyCenterView: React.FC<AnomalyCenterProps> = ({
  anomalies,
  onSimulateFix,
  onRefresh
}) => {
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string>(
    anomalies[0]?.anomaly_id || "AN-R1-B-204"
  );
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  const selectedAnomaly = anomalies.find(a => a.anomaly_id === selectedAnomalyId) || anomalies[0];

  const handleResolve = async (aid: string) => {
    try {
      await resolveAnomaly(aid);
      setResolvedIds(prev => new Set(prev).add(aid));
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>Anomaly Center — Explainable Energy Defect Triage</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Physics-grounded anomaly detection with CV corroboration, mathematical residuals, and causal chains.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-rose-950/60 border border-rose-800 text-rose-300 font-mono font-bold">
            {anomalies.filter(a => !resolvedIds.has(a.anomaly_id)).length} Active Defects
          </span>
        </div>
      </div>

      {/* Main Grid: Ranked Table (Left 50%) + Detail & Causal Chain (Right 50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Ranked Anomalies List */}
        <div className="lg:col-span-6 glass-panel p-4 rounded-xl border border-slate-800 space-y-3">
          <h3 className="font-semibold text-sm text-slate-200">
            Detected Energy Anomalies (Ranked by Severity & Daily Loss)
          </h3>

          <div className="space-y-2">
            {anomalies.map(anom => {
              const isSelected = selectedAnomaly?.anomaly_id === anom.anomaly_id;
              const isResolved = resolvedIds.has(anom.anomaly_id);

              return (
                <div
                  key={anom.anomaly_id}
                  onClick={() => setSelectedAnomalyId(anom.anomaly_id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected 
                      ? "bg-slate-900/90 border-cyan-500/60 shadow-md shadow-cyan-500/10" 
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  } ${isResolved ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          anom.severity >= 70 ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}>
                          SEV {anom.severity}
                        </span>
                        <span className="font-bold text-xs text-slate-200">{anom.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Zone: <strong className="text-slate-300">{anom.zone_name} ({anom.zone_id})</strong>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-rose-400">
                        ₹{anom.impact_if_unresolved.inr_day}/day
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {anom.impact_if_unresolved.kg_co2_day} kg CO₂/d
                      </div>
                    </div>
                  </div>

                  {/* Evidence summary chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {anom.evidence.slice(0, 3).map((ev, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                        {ev.label}: <strong className="text-cyan-300">{ev.v}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Anomaly Investigation Pane */}
        {selectedAnomaly && (
          <div className="lg:col-span-6 glass-panel p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  Incident Detail • {selectedAnomaly.anomaly_id}
                </span>
                <h3 className="font-bold text-base text-slate-100">{selectedAnomaly.title}</h3>
                <span className="text-xs text-slate-400">{selectedAnomaly.zone_name} • Detected: {new Date(selectedAnomaly.detected_at).toLocaleTimeString()}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleResolve(selectedAnomaly.anomaly_id)}
                  disabled={resolvedIds.has(selectedAnomaly.anomaly_id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    resolvedIds.has(selectedAnomaly.anomaly_id)
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white"
                  }`}
                >
                  {resolvedIds.has(selectedAnomaly.anomaly_id) ? "Resolved" : "Resolve"}
                </button>
              </div>
            </div>

            {/* AI Explanation Callout */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-indigo-300 mb-1">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Explainable AI Narrative (Deterministic Grounding)</span>
              </div>
              <p className="text-slate-200 leading-relaxed">
                {selectedAnomaly.ai_explanation}
              </p>
            </div>

            {/* Evidence Chips */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-2">
                Verified Observational Evidence (Computer Vision & Electrical Meters)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {selectedAnomaly.evidence.map((ev, i) => (
                  <div key={i} className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-medium">{ev.label}</div>
                    <div className="font-mono font-bold text-cyan-300 text-sm">{ev.v}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{ev.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Causal Chain Timeline */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-2">
                Root-Cause Causal Event Timeline
              </span>
              <div className="space-y-2 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-800">
                {selectedAnomaly.causal_chain.map(step => (
                  <div key={step.step} className="flex items-start gap-3 relative pl-6 text-xs">
                    <div className="absolute left-1.5 top-1 w-3.5 h-3.5 rounded-full bg-cyan-600 border-2 border-slate-950" />
                    <div>
                      <span className="font-mono text-[10px] text-slate-400 block">{step.time}</span>
                      <span className="text-slate-200">{step.event}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Fixes & Simulator Integration */}
            <div className="pt-3 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300 block mb-2">
                Recommended Actions
              </span>
              <div className="space-y-2">
                {selectedAnomaly.recommended_actions.map(act => (
                  <div 
                    key={act.code}
                    className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-200 block">{act.label}</span>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        Estimated saving: {act.est_saving_pct}% zone energy
                      </span>
                    </div>

                    <button
                      onClick={() => onSimulateFix(selectedAnomaly)}
                      className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition flex items-center gap-1 shadow-sm"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Simulate Fix</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
