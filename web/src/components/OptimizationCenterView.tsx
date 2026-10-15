"use client";

import React, { useState, useEffect } from "react";
import { 
  Award, 
  Sliders, 
  CheckCircle2, 
  Clock, 
  TrendingDown, 
  DollarSign, 
  Leaf, 
  ShieldCheck, 
  FileText,
  Sparkles,
  Zap
} from "lucide-react";
import { RankedAction } from "../lib/types";
import { rankOptimizations } from "../lib/api";

interface OptimizationProps {
  onApplyAction: (code: string) => void;
}

export const OptimizationCenterView: React.FC<OptimizationProps> = ({ onApplyAction }) => {
  const [actions, setActions] = useState<RankedAction[]>([]);
  const [weights, setWeights] = useState({
    cost: 0.25,
    carbon: 0.20,
    comfort: 0.15,
    ease: 0.20,
    roi: 0.20
  });
  const [appliedActions, setAppliedActions] = useState<Set<string>>(new Set(["OCC_HVAC_SETBACK"]));

  const loadRanking = async (w = weights) => {
    try {
      const res = await rankOptimizations(w);
      setActions(res.ranked_actions || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadRanking();
  }, []);

  const handleWeightChange = (key: keyof typeof weights, val: number) => {
    const updated = { ...weights, [key]: val };
    setWeights(updated);
    loadRanking(updated);
  };

  const handleApply = (code: string) => {
    setAppliedActions(prev => new Set(prev).add(code));
    onApplyAction(code);
  };

  return (
    <div className="space-y-4 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Optimization Center — Multi-Criteria Decision & M&V Verification</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactivity-aware candidate action ranking dynamically updated by user priority weights.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold">
            M&V Tracking: Active
          </span>
        </div>
      </div>

      {/* Live Priority Sliders */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Live Priority Sliders (Watch Algorithm Re-Rank Instantaneously)</span>
          </h3>
          <span className="text-[11px] text-slate-400">Normalizing weights dynamically</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span>Financial Savings:</span>
              <span className="font-mono text-cyan-400 font-bold">{(weights.cost * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.cost}
              onChange={(e) => handleWeightChange("cost", parseFloat(e.target.value))}
              className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded cursor-pointer"
            />
          </div>

          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span>Carbon Abatement:</span>
              <span className="font-mono text-indigo-400 font-bold">{(weights.carbon * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.carbon}
              onChange={(e) => handleWeightChange("carbon", parseFloat(e.target.value))}
              className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded cursor-pointer"
            />
          </div>

          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span>Comfort Protection:</span>
              <span className="font-mono text-emerald-400 font-bold">{(weights.comfort * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.comfort}
              onChange={(e) => handleWeightChange("comfort", parseFloat(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded cursor-pointer"
            />
          </div>

          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span>Ease of Execution:</span>
              <span className="font-mono text-yellow-400 font-bold">{(weights.ease * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.ease}
              onChange={(e) => handleWeightChange("ease", parseFloat(e.target.value))}
              className="w-full accent-yellow-500 bg-slate-800 h-1.5 rounded cursor-pointer"
            />
          </div>

          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span>Payback Speed / ROI:</span>
              <span className="font-mono text-rose-400 font-bold">{(weights.roi * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.roi}
              onChange={(e) => handleWeightChange("roi", parseFloat(e.target.value))}
              className="w-full accent-rose-500 bg-slate-800 h-1.5 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Ranked Candidate Action Catalog */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-slate-200">
          Ranked Action Catalog (Live Normalized Score)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map(act => {
            const isApplied = appliedActions.has(act.code);
            return (
              <div 
                key={act.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                  isApplied
                    ? "bg-slate-900/90 border-emerald-500/50 shadow-md shadow-emerald-500/10"
                    : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-cyan-950 border border-cyan-800 text-cyan-300">
                      RANK #{act.rank}
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      Utility: {act.score_pct}/100
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-100 mt-2">{act.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{act.description}</p>

                  <div className="mt-3 p-2.5 rounded bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Monthly Savings:</span>
                      <strong className="text-emerald-400 font-mono">₹{act.saving_inr_month.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Carbon Abatement:</span>
                      <strong className="text-indigo-400 font-mono">{act.saving_co2_month_t} t CO₂</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Payback Period:</span>
                      <span className="text-slate-200 font-mono">{act.payback_str}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Implementation Capex:</span>
                      <span className="text-slate-200 font-mono">
                        {act.capex_inr === 0 ? "₹0 (Zero Capex)" : `₹${act.capex_inr.toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Difficulty: {act.difficulty}/5</span>
                  <button
                    onClick={() => handleApply(act.code)}
                    disabled={isApplied}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                      isApplied
                        ? "bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 cursor-default"
                        : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm"
                    }`}
                  >
                    {isApplied ? "Applied (Active)" : "Apply to Twin"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Measurement & Verification (M&V) Savings Tracker */}
      <div className="glass-panel p-4 rounded-xl border border-emerald-900/50 bg-gradient-to-r from-emerald-950/20 via-slate-900 to-slate-900 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100">
              Closed-Loop M&V Savings Verification Tracker (IPMVP Option C)
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-400">Status: Realized & Audited</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Post-action verification formula: <code>Savings = Baseline_normalized(post-period conditions) − Measured Telemetry</code>.
          Normalized against weather and real occupancy.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono pt-2 border-t border-slate-800">
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-slate-400 font-sans block text-[11px]">Realized Monthly Savings</span>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">₹66,000 / mo</div>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-slate-400 font-sans block text-[11px]">Verified Avoided Energy</span>
            <div className="text-lg font-bold text-cyan-400 mt-0.5">7,765 kWh / mo</div>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-slate-400 font-sans block text-[11px]">Verified Carbon Abated</span>
            <div className="text-lg font-bold text-indigo-400 mt-0.5">6.37 tons CO₂</div>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-slate-400 font-sans block text-[11px]">Ecology Offset</span>
            <div className="text-lg font-bold text-emerald-300 mt-0.5">290 Trees Equiv.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
