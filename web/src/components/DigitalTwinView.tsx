"use client";

import React, { useState } from "react";
import { 
  Layers, 
  Clock, 
  Flame, 
  Zap, 
  Users, 
  Thermometer, 
  AlertTriangle, 
  Box, 
  ExternalLink, 
  Info,
  Sliders,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { ZoneState, ZoneMetadata } from "../lib/types";

interface DigitalTwinProps {
  zones: ZoneMetadata[];
  zoneStates: ZoneState[];
  onForkScenario: (zoneId: string) => void;
}

export const DigitalTwinView: React.FC<DigitalTwinProps> = ({
  zones,
  zoneStates,
  onForkScenario
}) => {
  const [activeLayer, setActiveLayer] = useState<"waste" | "power" | "occupancy" | "temp" | "anomalies">("waste");
  const [selectedFloor, setSelectedFloor] = useState<number>(2);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("Block-B");
  const [selectedZoneId, setSelectedZoneId] = useState<string>("B-204");
  const [timeOffsetHours, setTimeOffsetHours] = useState<number>(0);
  const [is3DIsometric, setIs3DIsometric] = useState<boolean>(false);

  // Filter zones for selected building & floor
  const filteredZones = zones.filter(
    z => z.building_id === selectedBuilding && z.floor === selectedFloor
  );

  const selectedZone = zones.find(z => z.id === selectedZoneId) || zones[0];
  const selectedState = zoneStates.find(s => s.zone_id === selectedZoneId);

  // Color generator based on active layer
  const getZoneFillColor = (zoneId: string) => {
    const state = zoneStates.find(s => s.zone_id === zoneId);
    if (!state) return "#1e293b";

    if (activeLayer === "waste") {
      // Unexplained load
      if (state.unexplained_kw > 1.5) return "rgba(244, 63, 94, 0.85)"; // Red hotspot
      if (state.unexplained_kw > 0.4) return "rgba(245, 158, 11, 0.75)"; // Amber
      return "rgba(16, 185, 129, 0.35)"; // Normal Green
    } else if (activeLayer === "power") {
      // Power density W/m2
      const density = (state.measured_kw * 1000) / state.area_m2;
      if (density > 25) return "rgba(56, 189, 248, 0.85)";
      if (density > 15) return "rgba(56, 189, 248, 0.55)";
      return "rgba(56, 189, 248, 0.25)";
    } else if (activeLayer === "occupancy") {
      if (state.occupancy > 15) return "rgba(168, 85, 247, 0.85)";
      if (state.occupancy > 0) return "rgba(168, 85, 247, 0.50)";
      return "rgba(51, 65, 85, 0.40)";
    } else if (activeLayer === "temp") {
      if (state.temp_c > 25.5) return "rgba(239, 68, 68, 0.75)";
      if (state.temp_c < 22.0) return "rgba(59, 130, 246, 0.75)";
      return "rgba(16, 185, 129, 0.50)";
    } else {
      // Anomalies
      if (zoneId === "B-204") return "rgba(244, 63, 94, 0.85)";
      if (zoneId === "B-207") return "rgba(245, 158, 11, 0.75)";
      return "rgba(16, 185, 129, 0.35)";
    }
  };

  return (
    <div className="space-y-4 p-4 max-w-7xl mx-auto">
      {/* Top Controls: Building/Floor picker, Layer Switcher, 2.5D Toggle */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900 border border-slate-800">
            <button
              onClick={() => setSelectedBuilding("Block-B")}
              className={`px-2.5 py-1 rounded font-semibold transition ${
                selectedBuilding === "Block-B" ? "bg-cyan-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              Block B (Active Twin)
            </button>
            <button
              onClick={() => setSelectedBuilding("Block-A")}
              className={`px-2.5 py-1 rounded font-semibold transition ${
                selectedBuilding === "Block-A" ? "bg-cyan-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              Block A (Admin & Hall)
            </button>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900 border border-slate-800">
            <button
              onClick={() => setSelectedFloor(1)}
              className={`px-2.5 py-1 rounded font-semibold transition ${
                selectedFloor === 1 ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Level 1
            </button>
            <button
              onClick={() => setSelectedFloor(2)}
              className={`px-2.5 py-1 rounded font-semibold transition ${
                selectedFloor === 2 ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Level 2
            </button>
          </div>
        </div>

        {/* Layer Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: "waste", label: "Waste (UL)", icon: Flame, color: "text-rose-400" },
            { id: "power", label: "Power Density", icon: Zap, color: "text-cyan-400" },
            { id: "occupancy", label: "Occupancy (CV)", icon: Users, color: "text-purple-400" },
            { id: "temp", label: "Thermal (°C)", icon: Thermometer, color: "text-emerald-400" },
            { id: "anomalies", label: "Anomalies", icon: AlertTriangle, color: "text-amber-400" }
          ].map(layer => {
            const Icon = layer.icon;
            const isActive = activeLayer === layer.id;
            return (
              <button
                key={layer.id}
                onClick={() => setActiveLayer(layer.id as any)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition ${
                  isActive
                    ? "bg-slate-800 border border-slate-600 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${layer.color}`} />
                <span>{layer.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => setIs3DIsometric(!is3DIsometric)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-semibold ml-2 transition ${
              is3DIsometric
                ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Box className="w-3.5 h-3.5 text-cyan-400" />
            <span>2.5D Isometric</span>
          </button>
        </div>
      </div>

      {/* Main Twin Space: Spatial Floor Plan (Left 65%) + Zone Detail Drawer (Right 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Spatial Floor Plan Canvas */}
        <div className="lg:col-span-8 glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-slate-200">
                Spatial Floor Plan: {selectedBuilding} Level {selectedFloor}
              </span>
              <span>Click on any room polygon to inspect physics & passport</span>
            </div>

            {/* SVG Interactive Floor Plan with Optional 2.5D Transform */}
            <div className={`relative w-full h-[400px] bg-slate-950/90 rounded-xl border border-slate-800 p-4 overflow-hidden flex items-center justify-center transition-all duration-500 ${
              is3DIsometric ? "[transform:rotateX(35deg)_rotateZ(-15deg)_scale(0.9)] shadow-2xl" : ""
            }`}>
              {/* Floor Plan Coordinate Grid */}
              <svg viewBox="0 0 300 160" className="w-full h-full select-none">
                <defs>
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="300" height="160" fill="url(#grid)" />

                {/* Render Zone Polygons */}
                {filteredZones.map(zone => {
                  const state = zoneStates.find(s => s.zone_id === zone.id);
                  const isSelected = selectedZoneId === zone.id;
                  const fillColor = getZoneFillColor(zone.id);

                  // Extract polygon points
                  const points = zone.polygon.map(p => `${p[0]},${p[1]}`).join(" ");
                  const centerX = (zone.polygon[0][0] + zone.polygon[2][0]) / 2;
                  const centerY = (zone.polygon[0][1] + zone.polygon[2][1]) / 2;

                  return (
                    <g 
                      key={zone.id} 
                      onClick={() => setSelectedZoneId(zone.id)}
                      className="cursor-pointer group"
                    >
                      <polygon
                        points={points}
                        fill={fillColor}
                        stroke={isSelected ? "#38bdf8" : "rgba(255,255,255,0.25)"}
                        strokeWidth={isSelected ? "2.5" : "1"}
                        className="transition-all duration-300 hover:opacity-90"
                      />
                      {/* Zone Name Label */}
                      <text
                        x={centerX}
                        y={centerY - 6}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="6"
                        fontWeight="bold"
                        className="pointer-events-none tracking-wider"
                      >
                        {zone.id}
                      </text>
                      {/* Sub-Metric Label */}
                      <text
                        x={centerX}
                        y={centerY + 6}
                        textAnchor="middle"
                        fill={state && state.unexplained_kw > 1 ? "#fda4af" : "#94a3b8"}
                        fontSize="4.5"
                        fontFamily="monospace"
                        className="pointer-events-none"
                      >
                        {activeLayer === "waste" 
                          ? `UL: ${state?.unexplained_kw || 0} kW`
                          : activeLayer === "occupancy"
                          ? `Occ: ${state?.occupancy || 0}`
                          : `${state?.measured_kw || 0} kW`}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Time Scrubber (Past History ↔ Future Forecast) */}
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5 font-semibold">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Time-Travel Scrubber (Twin State Explorer)</span>
              </span>
              <span className="font-mono text-cyan-400 font-bold">
                {timeOffsetHours === 0 
                  ? "NOW (Live State)" 
                  : timeOffsetHours < 0 
                  ? `${Math.abs(timeOffsetHours)}h in Past (Replay)` 
                  : `+${timeOffsetHours}h in Future (Forecast)`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500 font-mono">-24h</span>
              <input
                type="range"
                min="-24"
                max="12"
                step="1"
                value={timeOffsetHours}
                onChange={(e) => setTimeOffsetHours(parseInt(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 font-mono">+12h</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Drag scrubber to replay historical telemetry snapshots or simulate forward predictive states.
            </p>
          </div>
        </div>

        {/* Right: Zone Detail Drawer */}
        <div className="lg:col-span-4 glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  Zone Digital Twin
                </span>
                <h3 className="font-bold text-base text-slate-100">{selectedZone?.name}</h3>
                <span className="text-xs text-slate-400">{selectedZone?.id} • {selectedZone?.type.toUpperCase()}</span>
              </div>

              <span className={`px-2 py-1 rounded text-xs font-bold font-mono ${
                selectedState && selectedState.unexplained_kw > 1
                  ? "bg-rose-950 border border-rose-800 text-rose-400"
                  : "bg-emerald-950 border border-emerald-800 text-emerald-400"
              }`}>
                {selectedState && selectedState.unexplained_kw > 1 ? "HIGH RESIDUAL" : "JUSTIFIED"}
              </span>
            </div>

            {/* Core Physics Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px]">Occupancy (CV)</span>
                <div className="text-base font-bold font-mono text-white mt-0.5">
                  {selectedState?.occupancy ?? 0} Occupants
                </div>
                <div className="text-[10px] text-slate-400">
                  {selectedState?.vacant_seconds ? `Vacant ${(selectedState.vacant_seconds/60).toFixed(0)} min` : "Active"}
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px]">Indoor Temperature</span>
                <div className="text-base font-bold font-mono text-white mt-0.5">
                  {selectedState?.temp_c ?? 23.5}°C
                </div>
                <div className="text-[10px] text-slate-400">
                  Setpoint: {selectedState?.setpoint_c ?? 22}°C
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px]">Measured Electrical</span>
                <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">
                  {selectedState?.measured_kw ?? 0.5} kW
                </div>
                <div className="text-[10px] text-slate-400">
                  Expected: {selectedState?.expected_kw ?? 0.5} kW
                </div>
              </div>

              <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800/60">
                <span className="text-rose-300 text-[10px]">Unexplained Load (UL)</span>
                <div className="text-base font-bold font-mono text-rose-400 mt-0.5">
                  +{selectedState?.unexplained_kw ?? 0} kW
                </div>
                <div className="text-[10px] text-rose-300/80">
                  Thermal residual waste
                </div>
              </div>
            </div>

            {/* Thermal Parameters & Physics Model */}
            <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs space-y-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                1R1C Thermal Parameters (Physics Passport)
              </span>
              <div className="flex justify-between text-slate-400">
                <span>Thermal Resistance (R):</span>
                <span className="font-mono text-slate-200">{selectedZone?.thermal_R} K/kW</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Thermal Capacity (C):</span>
                <span className="font-mono text-slate-200">{selectedZone?.thermal_C} kWh/K</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Floor Area / Volume:</span>
                <span className="font-mono text-slate-200">{selectedZone?.area_m2} m² / {selectedZone?.volume_m3} m³</span>
              </div>
            </div>

            {/* Digital Equipment Passport Highlights */}
            <div className="mt-3 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider block mb-1">
                Equipment Digital Passport
              </span>
              {selectedZoneId === "B-204" ? (
                <div className="text-slate-300 space-y-1">
                  <div>Model: <strong>Voltas Cassette 2.0 Ton (Non-Inv)</strong></div>
                  <div>Health Score: <span className="text-amber-400 font-bold">68/100 (Degraded)</span></div>
                  <div>Measured COP: <span className="font-mono text-amber-400">2.32 (vs 2.65 rated)</span></div>
                  <div className="text-emerald-400">Retrofit Payback: 2.28 years</div>
                </div>
              ) : selectedZoneId === "B-207" ? (
                <div className="text-slate-300 space-y-1">
                  <div>Model: <strong>Carrier Split 1.5 Ton (Old Unit)</strong></div>
                  <div>Health Score: <span className="text-rose-400 font-bold">58/100 (Severe Wear)</span></div>
                  <div>Measured COP: <span className="font-mono text-rose-400">1.95 (20.4% loss)</span></div>
                  <div className="text-emerald-400">Retrofit Payback: 1.64 years</div>
                </div>
              ) : (
                <div className="text-slate-300 space-y-1">
                  <div>Model: <strong>Daikin VRV Inverter Unit</strong></div>
                  <div>Health Score: <span className="text-emerald-400 font-bold">94/100 (Nominal)</span></div>
                  <div>Measured COP: <span className="font-mono text-emerald-400">3.40 (COP 3.6 rated)</span></div>
                </div>
              )}
            </div>
          </div>

          {/* Action button: Fork to Scenario */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={() => onForkScenario(selectedZoneId)}
              className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Fork Zone to What-If Simulator</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
