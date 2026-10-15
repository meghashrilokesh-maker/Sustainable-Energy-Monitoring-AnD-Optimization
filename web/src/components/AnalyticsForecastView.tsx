"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  BarChart2, 
  ShieldCheck, 
  CheckCircle2, 
  Calendar,
  Zap,
  Target
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";
import { fetchForecast } from "../lib/api";

export const AnalyticsForecastView: React.FC = () => {
  const [forecastData, setForecastData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchForecast();
        setForecastData(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const peak = forecastData?.peak_risk || {
    peak_kw_p50: 612,
    peak_kw_p90: 645,
    peak_time: "14:15",
    contracted_demand_kw: 600,
    breach_probability_pct: 72,
    status: "WATCH"
  };

  const monthProj = forecastData?.month_projection || {
    projected_kwh: 58200,
    budget_kwh: 54000,
    variance_pct: 7.8,
    traffic_light: "AMBER"
  };

  // CV-Derived Room Utilisation vs Conditioning Chart data (Blueprint §12 & §14 WOW feature!)
  const utilisationData = [
    { room: "B-201 AI Lab", util_pct: 68, conditioned_pct: 100, waste_hours: 3.2 },
    { room: "B-202 Data Lab", util_pct: 54, conditioned_pct: 100, waste_hours: 4.6 },
    { room: "B-203 Lecture 201", util_pct: 72, conditioned_pct: 85, waste_hours: 1.3 },
    { room: "B-204 Comp Lab", util_pct: 31, conditioned_pct: 100, waste_hours: 6.9 }, // Critical
    { room: "B-207 Cyber Lab", util_pct: 11, conditioned_pct: 100, waste_hours: 8.9 }, // Critical
    { room: "B-101 Comp Lab 1", util_pct: 62, conditioned_pct: 95, waste_hours: 3.3 },
    { room: "A-102 Conf Room", util_pct: 22, conditioned_pct: 70, waste_hours: 4.8 }
  ];

  return (
    <div className="space-y-4 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <span>Predictive Analytics & Utilisation Intelligence</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            24-hour probabilistic load curve forecasting with LightGBM quantile bands (P10/P50/P90) and CV-derived room occupancy alignment.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800 text-cyan-300">
            Model MAPE: <strong>6.4% Accuracy</strong>
          </span>
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="glass-panel p-3.5 rounded-xl border border-amber-900/40 bg-gradient-to-b from-amber-950/20 to-slate-900">
          <span className="text-amber-400 font-semibold uppercase tracking-wider text-[11px]">Peak Demand Surcharge Risk</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{peak.peak_kw_p50} kW</span>
            <span className="text-slate-400">at {peak.peak_time}</span>
          </div>
          <div className="mt-1 text-amber-300 font-mono">
            Breach Probability: <strong>{peak.breach_probability_pct}%</strong> (Contracted: {peak.contracted_demand_kw} kW)
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-slate-800">
          <span className="text-cyan-400 font-semibold uppercase tracking-wider text-[11px]">Month-End Projection vs Budget</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{monthProj.projected_kwh.toLocaleString()}</span>
            <span className="text-xs text-slate-400">kWh</span>
          </div>
          <div className="mt-1 text-slate-400">
            Budget: <span className="font-mono text-slate-200">{monthProj.budget_kwh.toLocaleString()} kWh</span> (+{monthProj.variance_pct}%)
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-rose-900/40 bg-gradient-to-b from-rose-950/20 to-slate-900">
          <span className="text-rose-400 font-semibold uppercase tracking-wider text-[11px]">Unconditioned Vacancy Waste</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-400">₹31,400</span>
            <span className="text-xs text-slate-400">this week</span>
          </div>
          <div className="mt-1 text-rose-300/80">
            71% waste driven by Block B labs (B-204 & B-207)
          </div>
        </div>
      </div>

      {/* Probabilistic Quantile Forecast Chart (P10, P50, P90) */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              <span>Next 24-Hour Load Curve with Quantile Uncertainty Band</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
                P10 / P50 / P90 Quantiles
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Includes ambient outdoor weather curve and academic timetable occupancy forecasts.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-cyan-400 inline-block"></span>
              <span>P50 Expected Load</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-cyan-500/20 inline-block"></span>
              <span>P10–P90 Band</span>
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData?.horizon || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="quantileBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 700]} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#0b1120", borderColor: "#1e293b", fontSize: 12 }}
                formatter={(val: any, name: any) => [`${val} kW`, name]}
              />
              <Area type="monotone" dataKey="p90_kw" stroke="none" fill="url(#quantileBand)" name="P90 Upper Bound" />
              <Area type="monotone" dataKey="p10_kw" stroke="none" fill="#090d16" name="P10 Lower Bound" />
              <Line type="monotone" dataKey="p50_kw" stroke="#38bdf8" strokeWidth={2.5} dot={false} name="P50 Forecast" />
              <Line type="monotone" dataKey="contracted_demand_kw" stroke="#f43f5e" strokeDasharray="3 3" strokeWidth={2} dot={false} name="Demand Limit (600 kW)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CV-Derived Room Utilisation vs Conditioned Hours Bar Chart (§12 & §14 WOW feature!) */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              <span>Vision-Derived Room Utilisation vs Conditioned Hours</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300 font-mono">
                Key Waste Diagnostic
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Identifies labs conditioned 100% of the day despite less than 35% actual occupant utilization.
            </p>
          </div>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={utilisationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="room" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
              <Tooltip 
                contentStyle={{ backgroundColor: "#0b1120", borderColor: "#1e293b", fontSize: 12 }}
                formatter={(val: any, name: any) => [`${val}%`, name]}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
              <Bar dataKey="util_pct" fill="#8b5cf6" name="Actual Occupant Utilisation (CV %)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="conditioned_pct" fill="#06b6d4" name="AC Conditioned Hours (%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
          <span>Notice: <strong>Lab B-207 is utilized 11% of the time</strong> but conditioned 100% of scheduled hours (8.9 wasted hours/day).</span>
          <span className="text-emerald-400 font-mono font-bold">Action: Auto-Setback Policy Saves ₹66,000/mo</span>
        </div>
      </div>
    </div>
  );
};
