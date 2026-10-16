"use client";

import React from "react";
import { 
  Activity, 
  Eye, 
  Layers, 
  TrendingUp, 
  AlertTriangle, 
  Sliders, 
  Sparkles, 
  Award, 
  FileText, 
  Cpu, 
  ShieldCheck,
  Zap
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openDemoController: () => void;
  siteTotals?: {
    measured_kw: number;
    expected_kw: number;
    unexplained_kw: number;
    overall_efficiency_score: number;
    recoverable_inr_day: number;
  };
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openDemoController,
  siteTotals
}) => {
  const tabs = [
    { id: "command", label: "Command Center", icon: Activity },
    { id: "live", label: "Live Monitor", icon: Zap },
    { id: "vision", label: "Vision Monitor", icon: Eye },
    { id: "twin", label: "Digital Twin", icon: Layers },
    { id: "analytics", label: "Analytics & Forecast", icon: TrendingUp },
    { id: "anomalies", label: "Anomaly Center", icon: AlertTriangle },
    { id: "simulator", label: "What-If Simulator", icon: Sliders },
    { id: "advisor", label: "AI Advisor", icon: Sparkles },
    { id: "optimization", label: "Optimization Center", icon: Award },
    { id: "reports", label: "Reports", icon: FileText }
  ];

  const measured = siteTotals?.measured_kw || 118.5;
  const unexplained = siteTotals?.unexplained_kw || 3.4;
  const score = siteTotals?.overall_efficiency_score || 72;
  const recoverable = siteTotals?.recoverable_inr_day || 4100;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#080d1a]/95 backdrop-blur-md">
      {/* Top Banner Ticker */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-200 tracking-wide">PULSEGRID TWIN LIVE</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Site: <strong className="text-slate-200">Aryabhatta Engineering Campus</strong> (Block A & B)</span>
        </div>

        {/* Real-time Ticker Metrics */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800">
            <span className="text-slate-400">Total Load:</span>
            <span className="font-mono font-bold text-cyan-400">{measured} kW</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-950/40 border border-rose-800/70">
            <span className="text-rose-300 font-medium">Unexplained Load:</span>
            <span className="font-mono font-bold text-rose-400">+{unexplained} kW</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/40 border border-amber-800/70">
            <span className="text-amber-300 font-medium">Waste:</span>
            <span className="font-mono font-bold text-amber-400">₹{recoverable.toLocaleString()}/day</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-800/70">
            <span className="text-emerald-300 font-medium">Efficiency:</span>
            <span className="font-mono font-bold text-emerald-400">{score}/100</span>
          </div>

          <button 
            onClick={openDemoController}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/40 border border-indigo-400/40 cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-200" />
            <span>Demo Controller</span>
          </button>
        </div>
      </div>

      {/* Main Nav Items */}
      <div className="flex items-center justify-between px-4 py-2.5 overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-900/60 to-blue-900/60 text-cyan-200 border border-cyan-400/60 shadow-sm shadow-cyan-500/25 ring-1 ring-cyan-400/30 font-semibold"
                    : "bg-[#0b1120] text-slate-300 border border-slate-800/80 hover:text-white hover:bg-slate-800 hover:border-slate-700"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? "text-cyan-300" : "text-slate-400 group-hover:text-cyan-300"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 pl-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Role: <strong className="text-slate-200">Facility Head</strong></span>
          </div>
        </div>
      </div>
    </header>
  );
};
