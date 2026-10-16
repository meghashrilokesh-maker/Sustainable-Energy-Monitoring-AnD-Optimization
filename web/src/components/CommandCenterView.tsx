"use client";

import React from "react";
import { 
  Zap, 
  TrendingDown, 
  DollarSign, 
  CloudRain, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight, 
  Sparkles, 
  ChevronRight,
  ShieldAlert,
  Flame,
  Leaf
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { SiteSummary, Anomaly } from "../lib/types";

interface CommandCenterProps {
  summary: SiteSummary | null;
  historyData: any[];
  anomalies: Anomaly[];
  briefing: any;
  onNavigateTab: (tab: string) => void;
  onApplyAction: (actionCode: string) => void;
}

export const CommandCenterView: React.FC<CommandCenterProps> = ({
  summary,
  historyData,
  anomalies,
  briefing,
  onNavigateTab,
  onApplyAction
}) => {
  const totals = summary?.live_totals || {
    measured_kw: 118.5,
    expected_kw: 114.2,
    unexplained_kw: 3.42,
    recoverable_inr_day: 4100,
    recoverable_co2_day: 67.3,
    overall_efficiency_score: 74,
    contracted_demand_kw: 600
  };

  const blockB = summary?.buildings?.["Block-B"] || {
    breakdown_kw: { hvac: 48.2, lighting: 12.8, plug_loads: 22.4, other: 9.3 },
    breakdown_pct: { hvac: 52, lighting: 14, plug_loads: 24, other: 10 }
  };

  const breakdownData = [
    { name: "HVAC Cooling", value: blockB.breakdown_pct.hvac, color: "#06b6d4" },
    { name: "Plug Loads / PCs", value: blockB.breakdown_pct.plug_loads, color: "#8b5cf6" },
    { name: "Lighting", value: blockB.breakdown_pct.lighting, color: "#eab308" },
    { name: "Base Services", value: blockB.breakdown_pct.other, color: "#64748b" }
  ];

  return (
    <div className="space-y-5 p-4 max-w-7xl mx-auto">
      {/* Row 0: AI Morning Briefing Bar */}
      <div className="relative overflow-hidden rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-slate-900/90 to-slate-900/90 p-4 shadow-lg backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 mt-0.5">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  AI Operational Briefing
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                  Verified Data
                </span>
              </div>
              <p className="text-sm text-slate-200 mt-1 leading-relaxed">
                {briefing?.content || "Good morning. Block B consumed 12% above twin-expected baseline overnight, driven by Lab 204. Active waste at ₹4,100/day."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateTab("advisor")}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              Ask Advisor
            </button>
            <button
              onClick={() => onApplyAction("ACT-HVAC-SETBACK")}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 transition"
            >
              Apply Recommended Setback
            </button>
          </div>
        </div>
      </div>

      {/* Row 1: Six KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Live Power */}
        <div className="glass-panel p-3.5 rounded-xl border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>Live Power</span>
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-mono font-bold text-white">{totals.measured_kw}</span>
            <span className="text-xs text-slate-400">kW</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
            <span>Expected:</span>
            <span className="font-mono text-cyan-300">{totals.expected_kw} kW</span>
          </div>
        </div>

        {/* KPI 2: Today's Energy */}
        <div className="glass-panel p-3.5 rounded-xl border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>Today's Energy</span>
            <TrendingDown className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-mono font-bold text-white">1,850</span>
            <span className="text-xs text-slate-400">kWh</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Projected: <span className="font-mono text-slate-300">2,140 kWh</span>
          </div>
        </div>

        {/* KPI 3: Cost Today */}
        <div className="glass-panel p-3.5 rounded-xl border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>Cost Today</span>
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-mono font-bold text-white">₹15,725</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-400/90 font-mono">
            +7.8% vs Budget
          </div>
        </div>

        {/* KPI 4: CO2 Today */}
        <div className="glass-panel p-3.5 rounded-xl border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>CO₂ Emissions</span>
            <CloudRain className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-mono font-bold text-white">1,517</span>
            <span className="text-xs text-slate-400">kg</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Month: <span className="font-mono text-slate-300">45.5 tons</span>
          </div>
        </div>

        {/* KPI 5: Recoverable Waste (Unexplained Load) */}
        <div className="glass-panel p-3.5 rounded-xl border border-rose-900/40 bg-gradient-to-b from-rose-950/20 to-slate-900/60">
          <div className="text-[11px] font-medium text-rose-300 flex items-center justify-between">
            <span>Recoverable Waste</span>
            <Flame className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-mono font-bold text-rose-400">₹{totals.recoverable_inr_day.toLocaleString()}</span>
            <span className="text-xs text-slate-400">/day</span>
          </div>
          <div className="mt-1 text-[11px] text-rose-300/80 font-mono">
            Unexplained: {totals.unexplained_kw} kW
          </div>
        </div>

        {/* KPI 6: Efficiency Score Ring */}
        <div className="glass-panel p-3.5 rounded-xl border border-emerald-900/40 bg-gradient-to-b from-emerald-950/20 to-slate-900/60">
          <div className="text-[11px] font-medium text-emerald-300 flex items-center justify-between">
            <span>Efficiency Score</span>
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-mono font-bold text-emerald-400">{totals.overall_efficiency_score}</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-300/80">
            Target: <span className="font-mono">85+</span>
          </div>
        </div>
      </div>

      {/* Row 2: Now and Next Load Curve (60%) + Category Breakdown Donut (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        {/* Left: Now and Next Chart */}
        <div className="lg:col-span-6 glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                <span>"Now & Next" Dynamic Load Tracking</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
                  Twin Expected vs Measured
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Shaded gap represents Unexplained Load (UL). Orange line indicates 600 kW Contracted Demand cap.
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={historyData.length > 0 ? historyData : []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="unexplainedGap" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 'dataMax + 40']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0b1120", borderColor: "#1e293b", fontSize: 12 }}
                  formatter={(val: any, name: any) => [`${val} kW`, name]}
                />
                <Area 
                  type="monotone" 
                  dataKey="unexplained_kw" 
                  fill="url(#unexplainedGap)" 
                  stroke="none" 
                  name="Unexplained Waste"
                />
                <Line 
                  type="monotone" 
                  dataKey="measured_kw" 
                  stroke="#38bdf8" 
                  strokeWidth={2} 
                  dot={false} 
                  name="Measured Power"
                />
                <Line 
                  type="monotone" 
                  dataKey="expected_kw" 
                  stroke="#a855f7" 
                  strokeDasharray="4 4" 
                  strokeWidth={2} 
                  dot={false} 
                  name="Twin Expected Baseline"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-cyan-400 inline-block"></span>
                <span>Measured Load</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-purple-400 border-dashed inline-block"></span>
                <span>Twin Expected</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 bg-rose-500/40 inline-block rounded-xs"></span>
                <span>Waste Residual (UL)</span>
              </span>
            </div>
            <span className="font-mono text-cyan-300">Peak today: 238 kW</span>
          </div>
        </div>

        {/* Right: Consumption Breakdown Donut */}
        <div className="lg:col-span-4 glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm text-slate-100 flex items-center justify-between">
              <span>Consumption Breakdown</span>
              <span className="text-xs font-mono text-slate-400">Block B</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">End-use distribution across facilities</p>
          </div>

          <div className="h-52 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {breakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0b1120", borderColor: "#1e293b", fontSize: 12 }}
                  formatter={(val: any) => [`${val}% of total load`, "Share"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
            {breakdownData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300 truncate">{item.name}:</span>
                <span className="font-mono font-bold text-white ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Waste Hotspot Heatmap & Live Anomaly Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        {/* Left: Waste Hotspot Tile */}
        <div className="lg:col-span-5 glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-semibold text-sm text-slate-100">Campus Waste Heatmap (UL kW/m²)</h3>
              <p className="text-xs text-slate-400">Block B Level 2 identified as primary waste concentration</p>
            </div>
            <button 
              onClick={() => onNavigateTab("twin")}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>Explore Twin</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mini Interactive Heatmap Floorplan preview */}
          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Block B Level 2</span>
              <span className="text-rose-400 font-mono font-bold">Hotspot: Lab B-204 (2.8 kW UL)</span>
            </div>

            <div className="grid grid-cols-3 gap-2 h-36">
              <div className="rounded p-2 bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400">B-201 AI Lab</span>
                <span className="text-xs font-mono text-emerald-400">UL: 0.0 kW</span>
              </div>
              <div className="rounded p-2 bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400">B-202 Data Lab</span>
                <span className="text-xs font-mono text-emerald-400">UL: 0.0 kW</span>
              </div>
              <div className="rounded p-2 bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400">B-203 Lecture</span>
                <span className="text-xs font-mono text-emerald-400">UL: 0.0 kW</span>
              </div>
              <div 
                onClick={() => onNavigateTab("vision")}
                className="rounded p-2 bg-rose-950/70 border-2 border-rose-500 shadow-md shadow-rose-900/50 flex flex-col justify-between cursor-pointer hover:bg-rose-900/70 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white">B-204 Comp Lab</span>
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-rose-300">UL: +2.82 kW</span>
                  <div className="text-[10px] text-rose-200">0 People | AC 3.1kW</div>
                </div>
              </div>
              <div className="rounded p-2 bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400">B-205 Lounge</span>
                <span className="text-xs font-mono text-emerald-400">UL: 0.0 kW</span>
              </div>
              <div className="rounded p-2 bg-amber-950/40 border border-amber-600/50 flex flex-col justify-between">
                <span className="text-[11px] text-amber-200">B-207 Cyber Lab</span>
                <span className="text-xs font-mono text-amber-400">UL: +0.85 kW</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Anomaly Feed */}
        <div className="lg:col-span-5 glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                <span>Active Anomalies Feed</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-950 border border-rose-800 text-rose-400 text-xs font-mono">
                  {anomalies.length} Critical
                </span>
              </h3>
              <p className="text-xs text-slate-400">Prioritized by daily financial and carbon loss</p>
            </div>
            <button 
              onClick={() => onNavigateTab("anomalies")}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 mt-3">
            {anomalies.slice(0, 3).map((anom) => (
              <div 
                key={anom.anomaly_id}
                className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      anom.severity >= 70 ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}>
                      SEV {anom.severity}
                    </span>
                    <span className="font-semibold text-xs text-slate-200">{anom.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                    <span>At stake: <strong className="text-rose-400">₹{anom.impact_if_unresolved.inr_day}/day</strong></span>
                    <span>•</span>
                    <span>Zone: <strong className="text-slate-300">{anom.zone_id}</strong></span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateTab("anomalies")}
                  className="px-2.5 py-1 text-xs font-medium rounded bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 transition"
                >
                  Explain
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: "What Will Happen Next" Predictive Risk Cards */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Predictive Energy Intelligence (Next 24h & Horizon)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="glass-panel p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-cyan-400 font-semibold uppercase tracking-wider">Peak Demand Forecast</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-white">612 kW</span>
              <span className="text-xs text-slate-400">at 14:15</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              72% probability of approaching 600 kW limit. Pre-cool mitigation recommended.
            </p>
          </div>

          <div className="glass-panel p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider">Month-End Projection</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-white">58,200 kWh</span>
              <span className="text-xs text-amber-400">+7.8% vs Budget</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Budget: 54,000 kWh. Priority ranking shifted towards high-savings actions.
            </p>
          </div>

          <div className="glass-panel p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-rose-400 font-semibold uppercase tracking-wider">Weekly Waste at Risk</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-white">₹31,400</span>
              <span className="text-xs text-slate-400">recoverable</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              71% originates from Block B vacant conditioning and overnight idle compute.
            </p>
          </div>
        </div>
      </div>

      {/* Row 5: Top 3 Recommended Actions */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm text-slate-100">Top Optimization Recommendations</h3>
            <p className="text-xs text-slate-400">Interaction-aware actions ranked by multi-criteria utility score</p>
          </div>
          <button
            onClick={() => onNavigateTab("optimization")}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>Optimization Center</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              rank: "#1",
              title: "Occupancy-Based HVAC Setback",
              saving: "14.2% energy",
              inr: "₹66,000/mo",
              co2: "6.4 t CO₂",
              diff: "Medium (3)",
              payback: "9 months",
              code: "OCC_HVAC_SETBACK"
            },
            {
              rank: "#2",
              title: "Auto-Hibernate Workstations & Lights",
              saving: "6.8% energy",
              inr: "₹31,600/mo",
              co2: "3.1 t CO₂",
              diff: "Low (2)",
              payback: "2.5 months",
              code: "AUTO_PC_OFF"
            },
            {
              rank: "#3",
              title: "Raise Setpoint 22°C → 24°C",
              saving: "6.9% energy",
              inr: "₹32,600/mo",
              co2: "3.1 t CO₂",
              diff: "Immediate (1)",
              payback: "Instant",
              code: "SETPOINT_24C"
            }
          ].map(item => (
            <div key={item.title} className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cyan-400">{item.rank} Highest Utility</span>
                  <span className="text-slate-400 font-mono">{item.payback}</span>
                </div>
                <h4 className="font-semibold text-sm text-slate-200 mt-1">{item.title}</h4>
                <div className="mt-2 text-xs space-y-0.5 text-slate-400">
                  <div>Savings: <strong className="text-emerald-400">{item.inr}</strong> ({item.saving})</div>
                  <div>Carbon abatement: <strong className="text-indigo-300">{item.co2}</strong></div>
                  <div>Complexity: <span className="text-slate-300">{item.diff}</span></div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => onNavigateTab("simulator")}
                  className="flex-1 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                >
                  Simulate
                </button>
                <button
                  onClick={() => onApplyAction(item.code)}
                  className="flex-1 py-1 text-xs font-semibold rounded bg-cyan-600 hover:bg-cyan-500 text-white transition"
                >
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 6: Closed-Loop Verified Savings Impact Ticker */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Closed-Loop M&V Verified Savings (IPMVP Option C):</span>
        </div>
        <div className="flex items-center gap-6 font-mono">
          <div>Cumulative: <strong className="text-emerald-400">₹66,000 / month</strong></div>
          <div>Energy: <strong className="text-cyan-400">7,765 kWh</strong></div>
          <div>Carbon: <strong className="text-indigo-400">6.37 tons CO₂</strong></div>
          <div>Trees Offset: <strong className="text-emerald-300">290 Trees</strong></div>
        </div>
      </div>
    </div>
  );
};
