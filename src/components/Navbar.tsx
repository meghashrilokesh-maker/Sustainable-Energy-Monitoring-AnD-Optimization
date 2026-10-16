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
          {/* WattWise Brand Logo & Name */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/20 via-slate-900 to-emerald-500/20 border border-cyan-400/50 shadow-sm shadow-cyan-500/20 shrink-0">
              <svg 
                className="w-4 h-4 text-cyan-400" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M9 18h6" />
                <path d="M10 22h4" />
                <path d="M12 2a7 7 0 0 0-4.95 11.95c.95.95 1.95 2.05 1.95 4.05h6c0-2 1-3.1 1.95-4.05A7 7 0 0 0 12 2z" />
                <path d="M12 6c1.2 1.2 1.2 2.8 0 4-1.2-1.2-1.2-2.8 0-4z" fill="rgba(52, 211, 153, 0.45)" className="stroke-emerald-400" />
                <path d="M12 8.5v3" className="stroke-cyan-300" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <span className="font-extrabold text-sm tracking-wide bg-gradient-to-r from-cyan-300 via-sky-100 to-emerald-300 bg-clip-text text-transparent font-sans">
              WattWise
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Site: <strong className="text-slate-200">Aryabhatta Engineering Campus</strong> (Block A & B)</span>
        </div>

        {/* Real-time Ticker Metrics */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-slate-400">Total Load:</span>
            <span className="font-mono font-bold text-cyan-400">{measured} kW</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-950/40 border border-rose-800/60">
            <span className="text-rose-300">Unexplained Load (UL):</span>
            <span className="font-mono font-bold text-rose-400">+{unexplained} kW</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/30 border border-amber-800/50">
            <span className="text-amber-300">Recoverable Waste:</span>
            <span className="font-mono font-bold text-amber-400">₹{recoverable.toLocaleString()}/day</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/30 border border-emerald-800/50">
            <span className="text-emerald-300">Efficiency Score:</span>
            <span className="font-mono font-bold text-emerald-400">{score}/100</span>
          </div>

          <button 
            onClick={openDemoController}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Demo Controller</span>
          </button>
        </div>
      </div>

      {/* Main Nav Items */}
      <div className="flex items-center justify-between px-4 py-2 overflow-x-auto">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 pl-4">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Role: <strong>Facility Head</strong></span>
          </div>
        </div>
      </div>
    </header>
  );
};
