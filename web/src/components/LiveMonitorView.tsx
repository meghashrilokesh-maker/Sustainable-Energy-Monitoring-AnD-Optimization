"use client";

import React, { useState } from "react";
import { 
  Zap, 
  Activity, 
  Layers, 
  Gauge, 
  CheckCircle, 
  Radio, 
  ChevronRight,
  TrendingUp,
  Cpu
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";
import { ZoneState } from "../lib/types";

interface LiveMonitorProps {
  zoneStates: ZoneState[];
  historyData: any[];
}

export const LiveMonitorView: React.FC<LiveMonitorProps> = ({ zoneStates, historyData }) => {
  const [selectedNode, setSelectedNode] = useState<string>("Block-B");

  const blockBZones = zoneStates.filter(z => z.building_id === "Block-B");
  const blockAZones = zoneStates.filter(z => z.building_id === "Block-A");

  const totalKw = zoneStates.reduce((acc, z) => acc + z.measured_kw, 0);
  const totalExpected = zoneStates.reduce((acc, z) => acc + z.expected_kw, 0);
  const totalUnexplained = zoneStates.reduce((acc, z) => acc + z.unexplained_kw, 0);

  return (
    <div className="space-y-4 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <span>Live Energy Operations & Meter Hierarchy</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-tier electrical sub-metering tree with electrical power quality telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800 text-cyan-300">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Stream: 1 Hz Ingestion</span>
          </span>
        </div>
      </div>

      {/* Grid: 3-Phase Power Quality Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="glass-panel p-3.5 rounded-xl border border-slate-800">
          <span className="text-slate-400">Total Measured Draw</span>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{totalKw.toFixed(1)} kW</div>
          <div className="text-[10px] text-slate-400">Expected: {totalExpected.toFixed(1)} kW</div>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-rose-900/40 bg-rose-950/20">
          <span className="text-rose-300">Unexplained Residual (UL)</span>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">+{totalUnexplained.toFixed(2)} kW</div>
          <div className="text-[10px] text-rose-300/80">Active waste across zones</div>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-slate-800">
          <span className="text-slate-400">Average Power Factor (PF)</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">0.92 PF</div>
          <div className="text-[10px] text-emerald-400/80">Lagging (High Quality)</div>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-slate-800">
          <span className="text-slate-400">Line Voltage (3-Phase)</span>
          <div className="text-xl font-bold font-mono text-white mt-1">415.2 V</div>
          <div className="text-[10px] text-slate-400">THD: 2.4% (IEC 61000 compliant)</div>
        </div>
      </div>

      {/* Meter Hierarchy Tree + Zone Sparklines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Hierarchy Tree */}
        <div className="lg:col-span-5 glass-panel p-4 rounded-xl border border-slate-800 space-y-3">
          <h3 className="font-semibold text-sm text-slate-200">Campus Sub-Meter Topology</h3>
          
          <div className="space-y-2 text-xs">
            {/* Campus Root */}
            <div 
              onClick={() => setSelectedNode("Campus")}
              className={`p-2.5 rounded-lg border cursor-pointer transition ${
                selectedNode === "Campus" ? "bg-slate-800 border-cyan-500 text-cyan-300" : "bg-slate-900 border-slate-800 text-slate-300"
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span>Aryabhatta Campus Main Incomer</span>
                <span className="font-mono text-cyan-400">{totalKw.toFixed(1)} kW</span>
              </div>
            </div>

            {/* Block B Sub-tree */}
            <div className="pl-4 space-y-2 border-l border-slate-800 ml-2">
              <div 
                onClick={() => setSelectedNode("Block-B")}
                className={`p-2 rounded-lg border cursor-pointer transition ${
                  selectedNode === "Block-B" ? "bg-slate-800 border-cyan-500 text-cyan-300" : "bg-slate-900 border-slate-800 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>M-B-MAIN (Block B Distribution Board)</span>
                  <span className="font-mono text-cyan-300">
                    {blockBZones.reduce((acc, z) => acc + z.measured_kw, 0).toFixed(1)} kW
                  </span>
                </div>
              </div>

              {/* Block B Zones List */}
              <div className="pl-3 space-y-1.5 border-l border-slate-800/80 ml-2 max-h-64 overflow-y-auto">
                {blockBZones.map(z => (
                  <div 
                    key={z.zone_id}
                    onClick={() => setSelectedNode(z.zone_id)}
                    className={`p-1.5 rounded flex items-center justify-between text-[11px] cursor-pointer transition ${
                      selectedNode === z.zone_id ? "bg-cyan-950 text-cyan-200 border border-cyan-700" : "hover:bg-slate-800 text-slate-400"
                    }`}
                  >
                    <span className="truncate">{z.name} ({z.zone_id})</span>
                    <span className={`font-mono font-bold ${z.unexplained_kw > 1 ? "text-rose-400" : "text-slate-300"}`}>
                      {z.measured_kw} kW
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Block A Sub-tree */}
            <div className="pl-4 space-y-2 border-l border-slate-800 ml-2">
              <div 
                onClick={() => setSelectedNode("Block-A")}
                className={`p-2 rounded-lg border cursor-pointer transition ${
                  selectedNode === "Block-A" ? "bg-slate-800 border-cyan-500 text-cyan-300" : "bg-slate-900 border-slate-800 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>M-A-MAIN (Block A Distribution Board)</span>
                  <span className="font-mono text-cyan-300">
                    {blockAZones.reduce((acc, z) => acc + z.measured_kw, 0).toFixed(1)} kW
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Real-time Telemetry Trend Chart */}
        <div className="lg:col-span-7 glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-semibold text-sm text-slate-200">
                  Real-Time High-Resolution Power Telemetry
                </h3>
                <p className="text-xs text-slate-400">Node: {selectedNode} • 24h Trend</p>
              </div>
              <span className="text-xs font-mono text-cyan-400">Live Tick: 96 intervals</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="liveColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0b1120", borderColor: "#1e293b", fontSize: 12 }}
                    formatter={(val: any) => [`${val} kW`, "Measured Power"]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="measured_kw" 
                    stroke="#38bdf8" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#liveColor)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400 flex justify-between">
            <span>Sampling: Continuous True RMS</span>
            <span className="text-slate-300 font-mono">Modbus TCP / MQTT Gateway Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
