"use client";

import React, { useState, useMemo } from "react";
import { 
  Sliders, 
  Sparkles, 
  TrendingDown, 
  TrendingUp,
  Sun, 
  Wind, 
  Cpu, 
  DollarSign, 
  Leaf, 
  ShieldCheck, 
  Play, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Thermometer,
  Zap,
  Activity,
  Layers,
  HelpCircle,
  RotateCcw,
  Clock,
  ArrowRight
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import { ScenarioComparison } from "../lib/types";
import { MOCK_SCENARIOS } from "../lib/mockData";

interface SimulatorProps {
  onAskAI: (query: string) => void;
}

export const WhatIfSimulatorView: React.FC<SimulatorProps> = ({ onAskAI }) => {
  // Four Interactive Controls
  const [setpoint, setSetpoint] = useState<number>(24.0);
  const [solarKwp, setSolarKwp] = useState<number>(80);
  const [occupancyHvac, setOccupancyHvac] = useState<boolean>(true);
  const [autoPcOff, setAutoPcOff] = useState<boolean>(true);

  // UI state for simulation feedback
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [lastRunTime, setLastRunTime] = useState<string>("Active Live Sync");

  const handleResetBaseline = () => {
    setSetpoint(22.0);
    setSolarKwp(0);
    setOccupancyHvac(false);
    setAutoPcOff(false);
    triggerSimulationRun();
  };

  const triggerSimulationRun = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      const now = new Date();
      setLastRunTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 350);
  };

  // Fixed Canonical Baseline Benchmarks
  const baselineB = {
    name: "Block B Baseline",
    building_label: "Block B (Computer & Engineering Labs)",
    avg_kwh_day: 1850.0,
    total_cost_month_inr: 471750,
    co2_tons_month: 45.52,
    peak_demand_kw: 238.0,
    comfort_compliance_pct: 96.0,
    efficiency_score: 61,
    payback_label: "Current Baseline"
  };

  const baselineA = {
    name: "Block A Baseline",
    building_label: "Block A (Admin, Library & Lecture Halls)",
    avg_kwh_day: 1161.0,
    total_cost_month_inr: 295800,
    co2_tons_month: 28.56,
    peak_demand_kw: 152.0,
    comfort_compliance_pct: 97.0,
    efficiency_score: 83,
    payback_label: "Current Baseline"
  };

  // Dynamic 1R1C & Electrical Simulation Calculations
  const sim = useMemo(() => {
    // --- BLOCK B CALCULATIONS (Academic Labs & High Plug Load) ---
    // 1. HVAC calculation (52% of base energy = 962 kWh/d)
    const deltaT_B = setpoint - 22.0;
    const hvacTempFactor_B = Math.max(0.55, Math.min(1.35, 1.0 - deltaT_B * 0.062));
    const hvacOccFactor_B = occupancyHvac ? 0.858 : 1.0; // 14.2% saving when rooms vacant
    const simHvacB = 962.0 * hvacTempFactor_B * hvacOccFactor_B;

    // 2. Workstations & Plug load (24% of base energy = 444 kWh/d)
    const plugFactor_B = autoPcOff ? 0.72 : 1.0; // 28% lab workstation reduction
    const simPlugB = 444.0 * plugFactor_B;

    // 3. Lighting & Base Services (24% of base energy = 444 kWh/d)
    const baseOtherB = 444.0;

    // 4. Solar allocation: Block B receives 60% of total campus rooftop PV
    const solarGenerationB = (solarKwp * 0.60) * 4.7; // ~4.7 kWh per kWp per day
    const grossKwhB = simHvacB + simPlugB + baseOtherB;
    const netKwhB = Math.max(120, Math.round(grossKwhB - solarGenerationB));

    // Peak demand calculation
    const peakReductionHvac_B = deltaT_B * 7.5;
    const peakReductionOcc_B = occupancyHvac ? 19.0 : 0.0;
    const peakReductionPc_B = autoPcOff ? 12.0 : 0.0;
    const peakReductionSolar_B = (solarKwp * 0.60) * 0.52; // Midday solar peak shave
    const simPeakB = Math.max(90, Math.round(238.0 - peakReductionHvac_B - peakReductionOcc_B - peakReductionPc_B - peakReductionSolar_B));

    // Cost & Emissions Block B
    const energyChargeB = netKwhB * 30 * 8.5;
    const demandChargeB = (simPeakB / 0.90) * 350;
    const monthlyCostB = Math.round(energyChargeB + demandChargeB);
    const co2TonsMonthB = Number(((netKwhB * 30 * 0.82) / 1000).toFixed(2));

    // Comfort compliance Block B
    let comfortB = 96.0;
    if (setpoint <= 21.0) comfortB = 96.5;
    else if (setpoint <= 22.0) comfortB = 96.0;
    else if (setpoint <= 23.0) comfortB = 94.2;
    else if (setpoint <= 24.0) comfortB = 91.5;
    else if (setpoint <= 25.0) comfortB = 84.8;
    else if (setpoint <= 26.0) comfortB = 76.5;
    else if (setpoint <= 27.0) comfortB = 65.0;
    else comfortB = 53.0;

    if (occupancyHvac) {
      // Vision setback preserves conditioned air when occupied, softening temperature spike
      comfortB = Math.min(97.5, comfortB + 2.8);
    }
    comfortB = Number(Math.max(40.0, comfortB).toFixed(1));

    // Efficiency Score Block B
    const kwhSavingsRatioB = (1850.0 - netKwhB) / 1850.0;
    const effScoreB = Math.min(99, Math.max(35, Math.round(61 + kwhSavingsRatioB * 45 + (comfortB - 96.0) * 0.15)));

    // Capex & Payback Block B
    const capexB = (solarKwp * 0.60 * 45000) + (occupancyHvac ? 140000 : 0);
    const monthlySavingsB = baselineB.total_cost_month_inr - monthlyCostB;
    let paybackLabelB = "Immediate (0 Capex)";
    if (capexB > 0) {
      if (monthlySavingsB > 0) {
        const months = capexB / monthlySavingsB;
        paybackLabelB = months < 12 ? `${Math.round(months)} Months` : `${(months / 12).toFixed(1)} Years`;
      } else {
        paybackLabelB = "N/A (Cost Increase)";
      }
    }

    // --- BLOCK A CALCULATIONS (Administrative, Library & Lecture Halls) ---
    // 1. HVAC calculation (54% of base energy = 627 kWh/d)
    const deltaT_A = setpoint - 22.0;
    const hvacTempFactor_A = Math.max(0.60, Math.min(1.30, 1.0 - deltaT_A * 0.058));
    const hvacOccFactor_A = occupancyHvac ? 0.885 : 1.0; // 11.5% saving in offices/halls
    const simHvacA = 627.0 * hvacTempFactor_A * hvacOccFactor_A;

    // 2. Workstations & Plug load (18% of base energy = 209 kWh/d)
    const plugFactor_A = autoPcOff ? 0.88 : 1.0; // 12% office computer reduction
    const simPlugA = 209.0 * plugFactor_A;

    // 3. Lighting & Base Services (28% of base energy = 325 kWh/d)
    const baseOtherA = 325.0;

    // 4. Solar allocation: Block A receives 40% of total campus rooftop PV
    const solarGenerationA = (solarKwp * 0.40) * 4.7;
    const grossKwhA = simHvacA + simPlugA + baseOtherA;
    const netKwhA = Math.max(90, Math.round(grossKwhA - solarGenerationA));

    // Peak demand calculation Block A
    const peakReductionHvac_A = deltaT_A * 4.8;
    const peakReductionOcc_A = occupancyHvac ? 11.0 : 0.0;
    const peakReductionPc_A = autoPcOff ? 4.0 : 0.0;
    const peakReductionSolar_A = (solarKwp * 0.40) * 0.52;
    const simPeakA = Math.max(60, Math.round(152.0 - peakReductionHvac_A - peakReductionOcc_A - peakReductionPc_A - peakReductionSolar_A));

    // Cost & Emissions Block A
    const energyChargeA = netKwhA * 30 * 8.5;
    const demandChargeA = (simPeakA / 0.90) * 350;
    const monthlyCostA = Math.round(energyChargeA + demandChargeA);
    const co2TonsMonthA = Number(((netKwhA * 30 * 0.82) / 1000).toFixed(2));

    // Comfort compliance Block A
    let comfortA = 97.0;
    if (setpoint <= 21.0) comfortA = 97.5;
    else if (setpoint <= 22.0) comfortA = 97.0;
    else if (setpoint <= 23.0) comfortA = 95.5;
    else if (setpoint <= 24.0) comfortA = 92.8;
    else if (setpoint <= 25.0) comfortA = 86.2;
    else if (setpoint <= 26.0) comfortA = 78.0;
    else if (setpoint <= 27.0) comfortA = 67.5;
    else comfortA = 55.5;

    if (occupancyHvac) {
      comfortA = Math.min(98.0, comfortA + 1.8);
    }
    comfortA = Number(Math.max(40.0, comfortA).toFixed(1));

    // Efficiency Score Block A
    const kwhSavingsRatioA = (1161.0 - netKwhA) / 1161.0;
    const effScoreA = Math.min(99, Math.max(45, Math.round(83 + kwhSavingsRatioA * 35 + (comfortA - 97.0) * 0.15)));

    // Capex & Payback Block A
    const capexA = (solarKwp * 0.40 * 45000) + (occupancyHvac ? 95000 : 0);
    const monthlySavingsA = baselineA.total_cost_month_inr - monthlyCostA;
    let paybackLabelA = "Immediate (0 Capex)";
    if (capexA > 0) {
      if (monthlySavingsA > 0) {
        const months = capexA / monthlySavingsA;
        paybackLabelA = months < 12 ? `${Math.round(months)} Months` : `${(months / 12).toFixed(1)} Years`;
      } else {
        paybackLabelA = "N/A (Cost Increase)";
      }
    }

    // --- 24-HOUR HOURLY LOAD PROFILES ---
    const hourlyData = Array.from({ length: 24 }, (_, h) => {
      const isDay = h >= 8 && h <= 18;
      const bell = Math.exp(-Math.pow(h - 14.2, 2) / 16.0);
      
      // Base Block B & A loads
      const baseKwB = Math.round(65 + bell * 125);
      const baseKwA = Math.round(40 + bell * 80);
      const baseTotal = baseKwB + baseKwA;

      // Solar generation curve
      let solarKw = 0;
      if (solarKwp > 0 && h >= 7 && h <= 17) {
        const rad = ((h - 7) / 10.5) * Math.PI;
        solarKw = Math.round(solarKwp * 0.82 * Math.sin(rad));
      }

      // Simulated loads with controls
      const simKwB = Math.max(30, Math.round(
        baseKwB * (isDay ? hvacTempFactor_B * hvacOccFactor_B : 0.85) * (isDay ? plugFactor_B : (autoPcOff ? 0.65 : 1.0))
      ));
      const simKwA = Math.max(22, Math.round(
        baseKwA * (isDay ? hvacTempFactor_A * hvacOccFactor_A : 0.88) * (isDay ? plugFactor_A : (autoPcOff ? 0.82 : 1.0))
      ));
      const grossTotal = simKwB + simKwA;
      const netGrid = Math.max(0, grossTotal - solarKw);

      return {
        hour: `${h.toString().padStart(2, "0")}:00`,
        "Baseline Campus kW": baseTotal,
        "Simulated Gross kW": grossTotal,
        "Simulated Net Grid kW": netGrid,
        "Solar PV Generation kW": solarKw
      };
    });

    return {
      blockB: {
        avg_kwh_day: netKwhB,
        total_cost_month_inr: monthlyCostB,
        co2_tons_month: co2TonsMonthB,
        peak_demand_kw: simPeakB,
        comfort_compliance_pct: comfortB,
        efficiency_score: effScoreB,
        payback_label: paybackLabelB,
        kwh_saved_day: baselineB.avg_kwh_day - netKwhB,
        kwh_pct: Number((((netKwhB - baselineB.avg_kwh_day) / baselineB.avg_kwh_day) * 100).toFixed(1)),
        cost_saved_inr: baselineB.total_cost_month_inr - monthlyCostB,
        co2_saved_tons: Number((baselineB.co2_tons_month - co2TonsMonthB).toFixed(2)),
        peak_delta_kw: simPeakB - baselineB.peak_demand_kw,
        comfort_delta_pct: Number((comfortB - baselineB.comfort_compliance_pct).toFixed(1)),
        eff_delta: effScoreB - baselineB.efficiency_score
      },
      blockA: {
        avg_kwh_day: netKwhA,
        total_cost_month_inr: monthlyCostA,
        co2_tons_month: co2TonsMonthA,
        peak_demand_kw: simPeakA,
        comfort_compliance_pct: comfortA,
        efficiency_score: effScoreA,
        payback_label: paybackLabelA,
        kwh_saved_day: baselineA.avg_kwh_day - netKwhA,
        kwh_pct: Number((((netKwhA - baselineA.avg_kwh_day) / baselineA.avg_kwh_day) * 100).toFixed(1)),
        cost_saved_inr: baselineA.total_cost_month_inr - monthlyCostA,
        co2_saved_tons: Number((baselineA.co2_tons_month - co2TonsMonthA).toFixed(2)),
        peak_delta_kw: simPeakA - baselineA.peak_demand_kw,
        comfort_delta_pct: Number((comfortA - baselineA.comfort_compliance_pct).toFixed(1)),
        eff_delta: effScoreA - baselineA.efficiency_score
      },
      hourlyData
    };
  }, [setpoint, solarKwp, occupancyHvac, autoPcOff]);

  // Dynamic Natural-Language Explanations Generator
  const explanation = useMemo(() => {
    const totalBaselineKwh = baselineA.avg_kwh_day + baselineB.avg_kwh_day;
    const totalSimKwh = sim.blockA.avg_kwh_day + sim.blockB.avg_kwh_day;
    const totalKwhSaved = totalBaselineKwh - totalSimKwh;
    const totalPctSaved = Number(((totalKwhSaved / totalBaselineKwh) * 100).toFixed(1));
    const totalCostSaved = sim.blockA.cost_saved_inr + sim.blockB.cost_saved_inr;
    const totalCo2Saved = Number((sim.blockA.co2_saved_tons + sim.blockB.co2_saved_tons).toFixed(1));

    const isWorse = totalCostSaved < 0 || totalKwhSaved < 0;
    const isNeutral = totalKwhSaved === 0;

    let verdict = "Optimal Balanced Improvement";
    let verdictColor = "text-emerald-400";
    let bgBadge = "bg-emerald-950/40 border-emerald-800 text-emerald-300";

    if (isWorse) {
      verdict = "Energy & Cost Penalty (Worse than Baseline)";
      verdictColor = "text-rose-400";
      bgBadge = "bg-rose-950/40 border-rose-800 text-rose-300";
    } else if (setpoint >= 26.0) {
      verdict = "High Energy Savings with Notable Comfort Risk";
      verdictColor = "text-amber-400";
      bgBadge = "bg-amber-950/40 border-amber-800 text-amber-300";
    } else if (totalPctSaved >= 25.0) {
      verdict = "High-Impact Decarbonization Plan";
      verdictColor = "text-cyan-400";
      bgBadge = "bg-cyan-950/40 border-cyan-800 text-cyan-300";
    }

    const sentences: string[] = [];

    // 1. Setpoint impact
    if (setpoint > 22.0) {
      const diff = (setpoint - 22.0).toFixed(1);
      if (setpoint <= 24.0) {
        sentences.push(`You increased the AC setpoint by +${diff}°C to ${setpoint}°C. The simulator estimates lower electricity use with only a minor thermal comfort drop during peak afternoon heat.`);
      } else {
        sentences.push(`You raised the AC temperature significantly to ${setpoint}°C (+${diff}°C). While this slashes compressor electricity use, room comfort drops noticeably in classrooms and labs during hot afternoon hours.`);
      }
    } else if (setpoint < 22.0) {
      const diff = (22.0 - setpoint).toFixed(1);
      sentences.push(`You lowered the AC setpoint to ${setpoint}°C (-${diff}°C below baseline). This increases cooling electricity consumption, raising monthly utility bills by ₹${Math.abs(totalCostSaved).toLocaleString()} without delivering meaningful comfort improvements.`);
    } else {
      sentences.push(`AC cooling setpoint is held at the standard 22.0°C baseline, maintaining high cooling output.`);
    }

    // 2. Solar impact
    if (solarKwp > 0) {
      const dailySolar = Math.round(solarKwp * 4.7);
      sentences.push(`Adding ${solarKwp} kWp of rooftop solar PV supplies ~${dailySolar} kWh/day of on-site clean electricity, directly reducing midday grid demand charges for both blocks.`);
    } else {
      sentences.push(`Solar PV generation is disabled (0 kWp), keeping the campus fully dependent on grid utility power.`);
    }

    // 3. Occupancy setback impact
    if (occupancyHvac) {
      sentences.push(`Vision Occupancy Setback is active, cutting HVAC waste by suspending cooling in empty rooms without hurting occupant comfort when people return.`);
    } else {
      sentences.push(`Vision Occupancy Setback is turned off, meaning empty classrooms and labs continue to be cooled at full blast.`);
    }

    // 4. Workstation sleep impact
    if (autoPcOff) {
      sentences.push(`Workstation Sleep is enabled, significantly lowering Block B lab electricity by automatically putting idle desktop computers into low-power standby.`);
    } else {
      sentences.push(`Workstation Sleep is disabled, allowing idle computer lab machines to draw continuous phantom power.`);
    }

    return {
      verdict,
      verdictColor,
      bgBadge,
      sentences,
      totalPctSaved,
      totalCostSaved,
      totalCo2Saved,
      isWorse
    };
  }, [setpoint, solarKwp, occupancyHvac, autoPcOff, sim]);

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>What-If Digital Twin Simulator — Multi-Block Energy & Comfort</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-950/70 border border-indigo-700/60 text-indigo-300 font-mono">
                  Block A & Block B
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Forward 30-day simulated horizon modeling 1R1C thermal physics, occupancy schedules, workstation plug loads, and rooftop solar generation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetBaseline}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-medium text-xs transition flex items-center gap-1.5"
            title="Reset controls to baseline defaults"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Baseline</span>
          </button>

          <button
            onClick={() => onAskAI(`What-If analysis: setpoint at ${setpoint}°C, solar at ${solarKwp} kWp, occupancy setback ${occupancyHvac ? "enabled" : "off"}, PC sleep ${autoPcOff ? "enabled" : "off"}. Explain Block A and Block B trade-offs.`)}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask AI About Trade-Offs</span>
          </button>

          <button
            onClick={triggerSimulationRun}
            disabled={isSimulating}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-lg shadow-cyan-600/30"
          >
            <Play className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin" : ""}`} />
            <span>{isSimulating ? "Simulating..." : "Re-Run Forward Simulation"}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: The Four Interactive Controls */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-3 gap-2">
          <div>
            <h2 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Interactive Scenario Controls</span>
            </h2>
            <p className="text-xs text-slate-400">
              Adjust any parameter below. The simulation immediately recalculates energy, costs, emissions, and comfort for both blocks.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Simulation Status: {lastRunTime}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CONTROL 1: AC Cooling Setpoint */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-800/60 transition flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-cyan-400" />
                  <span>AC Cooling Setpoint</span>
                </span>
                <span className="font-mono font-bold text-sm text-cyan-400 bg-cyan-950/80 border border-cyan-800 px-2 py-0.5 rounded">
                  {setpoint.toFixed(1)}°C
                </span>
              </div>
              <input
                type="range"
                min="20.0"
                max="28.0"
                step="0.5"
                value={setpoint}
                onChange={(e) => setSetpoint(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 h-2 rounded cursor-pointer mt-2"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>20.0°C (Max Cool)</span>
                <span>22.0°C (Base)</span>
                <span>28.0°C (Economy)</span>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] pt-2 border-t border-slate-800/80">
              <div className="text-slate-400">
                <strong className="text-slate-300">What it changes:</strong> Target indoor temperature for central cooling systems.
              </div>
              <div className="text-slate-400">
                <strong className="text-slate-300">Why it matters:</strong> AC represents &gt;50% of total campus energy. Each +1°C saves ~6% energy.
              </div>
              <div className="p-2 rounded bg-slate-950/80 border border-slate-800 text-[10.5px]">
                <strong className="text-cyan-300 block mb-0.5">What changed:</strong>
                {setpoint > 22.0 ? (
                  <span className="text-slate-300">
                    Set to <strong className="text-cyan-300">{setpoint.toFixed(1)}°C</strong> (+{(setpoint - 22.0).toFixed(1)}°C over baseline). Saves ~{Math.round((setpoint - 22.0) * 6)}% HVAC power, but rooms will feel slightly warmer during afternoon heat.
                  </span>
                ) : setpoint === 22.0 ? (
                  <span className="text-slate-300">
                    Set to baseline <strong className="text-slate-100">22.0°C</strong>. Standard comfort with no thermal efficiency savings.
                  </span>
                ) : (
                  <span className="text-rose-300">
                    Set to <strong className="text-rose-400">{setpoint.toFixed(1)}°C</strong> (-{(22.0 - setpoint).toFixed(1)}°C below baseline). Compressors run constantly, increasing energy bills by ~{Math.round((22.0 - setpoint) * 6.5)}%.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CONTROL 2: Rooftop Solar PV Array */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-yellow-800/60 transition flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-yellow-400" />
                  <span>Rooftop Solar PV Array</span>
                </span>
                <span className="font-mono font-bold text-sm text-yellow-400 bg-yellow-950/80 border border-yellow-800 px-2 py-0.5 rounded">
                  {solarKwp} kWp
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="150"
                step="10"
                value={solarKwp}
                onChange={(e) => setSolarKwp(parseInt(e.target.value))}
                className="w-full accent-yellow-400 bg-slate-800 h-2 rounded cursor-pointer mt-2"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>0 kWp (None)</span>
                <span>80 kWp</span>
                <span>150 kWp (Max)</span>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] pt-2 border-t border-slate-800/80">
              <div className="text-slate-400">
                <strong className="text-slate-300">What it changes:</strong> Capacity of solar panels mounted on Block A (40%) and Block B (60%) roofs.
              </div>
              <div className="text-slate-400">
                <strong className="text-slate-300">Why it matters:</strong> Solar peaks during expensive midday tariff hours, cutting peak grid demand charges.
              </div>
              <div className="p-2 rounded bg-slate-950/80 border border-slate-800 text-[10.5px]">
                <strong className="text-yellow-300 block mb-0.5">What changed:</strong>
                {solarKwp > 0 ? (
                  <span className="text-slate-300">
                    Selected <strong className="text-yellow-300">{solarKwp} kWp</strong> generating ~<strong className="text-yellow-300">{Math.round(solarKwp * 4.7)} kWh/day</strong> clean power. Shaves midday demand across both blocks.
                  </span>
                ) : (
                  <span className="text-slate-400">
                    0 kWp selected. Campus relies 100% on utility grid power with zero renewable solar offset.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CONTROL 3: Vision Occupancy Setback */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-800/60 transition flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Vision Occupancy Setback</span>
                </span>
                <button
                  onClick={() => setOccupancyHvac(!occupancyHvac)}
                  className={`px-3 py-1 rounded text-xs font-bold transition shadow-sm ${
                    occupancyHvac 
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30" 
                      : "bg-slate-800 hover:bg-slate-700 text-slate-400"
                  }`}
                >
                  {occupancyHvac ? "ENABLED" : "OFF"}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Automatically adjusts AC to 28°C when computer vision confirms a room is vacant for &gt;10 min.
              </p>
            </div>

            <div className="space-y-1.5 text-[11px] pt-2 border-t border-slate-800/80">
              <div className="text-slate-400">
                <strong className="text-slate-300">What it changes:</strong> Dynamically suspends cooling only in confirmed empty spaces.
              </div>
              <div className="text-slate-400">
                <strong className="text-slate-300">Why it matters:</strong> Classrooms and labs sit unoccupied 35–45% of the day while AC runs continuously.
              </div>
              <div className="p-2 rounded bg-slate-950/80 border border-slate-800 text-[10.5px]">
                <strong className="text-emerald-300 block mb-0.5">What changed:</strong>
                {occupancyHvac ? (
                  <span className="text-slate-300">
                    <strong className="text-emerald-300">ACTIVE.</strong> Saves ~14.2% HVAC in Block B and ~11.5% in Block A with <em>zero comfort penalty</em> because cooling stays normal when occupied.
                  </span>
                ) : (
                  <span className="text-slate-400">
                    <strong className="text-slate-400">DISABLED.</strong> AC units run at full cooling capacity even when rooms and labs are completely empty.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CONTROL 4: Workstation Sleep */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-purple-800/60 transition flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <span>Workstation Sleep</span>
                </span>
                <button
                  onClick={() => setAutoPcOff(!autoPcOff)}
                  className={`px-3 py-1 rounded text-xs font-bold transition shadow-sm ${
                    autoPcOff 
                      ? "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30" 
                      : "bg-slate-800 hover:bg-slate-700 text-slate-400"
                  }`}
                >
                  {autoPcOff ? "ENABLED" : "OFF"}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Sends idle computers and lab desktop systems into deep standby (&lt;5W) after 15 min inactivity.
              </p>
            </div>

            <div className="space-y-1.5 text-[11px] pt-2 border-t border-slate-800/80">
              <div className="text-slate-400">
                <strong className="text-slate-300">What it changes:</strong> Powers down idle PC monitors, CPUs, and GPUs across campus.
              </div>
              <div className="text-slate-400">
                <strong className="text-slate-300">Why it matters:</strong> 150+ lab computers in Block B idle at 120–250W each overnight and between lectures.
              </div>
              <div className="p-2 rounded bg-slate-950/80 border border-slate-800 text-[10.5px]">
                <strong className="text-purple-300 block mb-0.5">What changed:</strong>
                {autoPcOff ? (
                  <span className="text-slate-300">
                    <strong className="text-purple-300">ACTIVE.</strong> Cuts Block B lab plug loads by ~28% (~124 kWh/day saved) with zero comfort or thermal side-effects.
                  </span>
                ) : (
                  <span className="text-slate-400">
                    <strong className="text-slate-400">DISABLED.</strong> Lab computers draw constant standby power even during off-hours.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: “What Changed and Why?” (Dynamic Explanatory Summary) */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <h2 className="font-bold text-sm text-slate-100">What Changed and Why?</h2>
            <span className="text-xs text-slate-400 font-normal">
              — Plain language summary of the simulation results
            </span>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${explanation.bgBadge}`}>
            {explanation.verdict}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs pt-1">
          <div className="lg:col-span-2 space-y-2 text-slate-300 leading-relaxed">
            {explanation.sentences.map((sentence, idx) => (
              <p key={idx} className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                <span>{sentence}</span>
              </p>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Combined Campus Impact
            </span>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Combined Energy Saved:</span>
                <span className={`font-mono font-bold text-sm ${explanation.totalPctSaved >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {explanation.totalPctSaved >= 0 ? `Reduced by ${explanation.totalPctSaved}%` : `Increased by ${Math.abs(explanation.totalPctSaved)}%`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Est. Monthly Savings:</span>
                <span className={`font-mono font-bold text-sm ${explanation.totalCostSaved >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {explanation.totalCostSaved >= 0 ? `₹${explanation.totalCostSaved.toLocaleString()}` : `-₹${Math.abs(explanation.totalCostSaved).toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Carbon Abatement:</span>
                <span className={`font-mono font-bold text-sm ${explanation.totalCo2Saved >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {explanation.totalCo2Saved >= 0 ? `${explanation.totalCo2Saved} tonnes CO₂` : `+${Math.abs(explanation.totalCo2Saved)} tonnes CO₂`}
                </span>
              </div>
            </div>

            <div className="text-[10.5px] text-slate-400 pt-2 border-t border-slate-800/80">
              {explanation.isWorse ? (
                <span className="text-rose-400 font-medium">
                  Caution: Your current settings result in higher monthly power expenses and carbon emissions than the campus baseline.
                </span>
              ) : (
                <span className="text-slate-400">
                  Calculated against the 30-day baseline operations of Aryabhatta Engineering Campus.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Separate Comparison Summaries for Block A and Block B */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BLOCK A COMPARISON SUMMARY */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-800 text-blue-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <span>Block A — Comparison Summary</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Campus Administration, Library & Academic Lecture Theaters
                </span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-mono bg-blue-950/70 border border-blue-800 text-blue-300">
              {sim.blockA.kwh_pct <= 0 ? `Energy use reduced by ${Math.abs(sim.blockA.kwh_pct)}%` : `Energy use increased by ${sim.blockA.kwh_pct}%`}
            </span>
          </div>

          {/* Metric Comparison Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            {/* Metric: Daily Energy */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Energy Consumption</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono font-bold text-slate-100 text-sm">{sim.blockA.avg_kwh_day}</span>
                <span className="text-[10px] text-slate-400">kWh/day</span>
              </div>
              <div className="text-[10.5px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>Base: {baselineA.avg_kwh_day}</span>
                <span className={sim.blockA.kwh_pct <= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {sim.blockA.kwh_pct <= 0 ? `−${Math.abs(sim.blockA.kwh_pct)}%` : `+${sim.blockA.kwh_pct}%`}
                </span>
              </div>
            </div>

            {/* Metric: Monthly Cost */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Estimated Monthly Cost</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono font-bold text-slate-100 text-sm">₹{sim.blockA.total_cost_month_inr.toLocaleString()}</span>
              </div>
              <div className="text-[10.5px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>Base: ₹{baselineA.total_cost_month_inr.toLocaleString()}</span>
                <span className={sim.blockA.cost_saved_inr >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {sim.blockA.cost_saved_inr >= 0 ? `−₹${sim.blockA.cost_saved_inr.toLocaleString()}` : `+₹${Math.abs(sim.blockA.cost_saved_inr).toLocaleString()}`}
                </span>
              </div>
            </div>

            {/* Metric: Carbon Emissions */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Carbon Emissions</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono font-bold text-slate-100 text-sm">{sim.blockA.co2_tons_month}</span>
                <span className="text-[10px] text-slate-400">t CO₂/mo</span>
              </div>
              <div className="text-[10.5px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>Base: {baselineA.co2_tons_month} t</span>
                <span className={sim.blockA.co2_saved_tons >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {sim.blockA.co2_saved_tons >= 0 ? `−${sim.blockA.co2_saved_tons} t` : `+${Math.abs(sim.blockA.co2_saved_tons)} t`}
                </span>
              </div>
            </div>

            {/* Metric: Peak Demand */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Peak Demand</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono font-bold text-slate-100 text-sm">{sim.blockA.peak_demand_kw}</span>
                <span className="text-[10px] text-slate-400">kW</span>
              </div>
              <div className="text-[10.5px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>Base: {baselineA.peak_demand_kw} kW</span>
                <span className={sim.blockA.peak_delta_kw <= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {sim.blockA.peak_delta_kw <= 0 ? `${sim.blockA.peak_delta_kw} kW` : `+${sim.blockA.peak_delta_kw} kW`}
                </span>
              </div>
            </div>

            {/* Metric: Comfort Level */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Comfort Compliance</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono font-bold text-slate-100 text-sm">{sim.blockA.comfort_compliance_pct}%</span>
              </div>
              <div className="text-[10.5px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>Base: {baselineA.comfort_compliance_pct}%</span>
                <span className={sim.blockA.comfort_delta_pct >= 0 ? "text-emerald-400 font-bold" : sim.blockA.comfort_delta_pct >= -3 ? "text-amber-400 font-bold" : "text-rose-400 font-bold"}>
                  {sim.blockA.comfort_delta_pct >= 0 ? `+${sim.blockA.comfort_delta_pct}%` : `${sim.blockA.comfort_delta_pct}%`}
                </span>
              </div>
            </div>

            {/* Metric: Efficiency Score */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Efficiency Score</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono font-bold text-slate-100 text-sm">{sim.blockA.efficiency_score}</span>
                <span className="text-[10px] text-slate-400">/ 100</span>
              </div>
              <div className="text-[10.5px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>Base: {baselineA.efficiency_score}</span>
                <span className={sim.blockA.eff_delta >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {sim.blockA.eff_delta >= 0 ? `+${sim.blockA.eff_delta} pts` : `${sim.blockA.eff_delta} pts`}
                </span>
              </div>
            </div>
          </div>

          {/* Simple Differences & Payback Callout */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-400 text-[11px] block">
                Estimated Monthly Savings: <strong className={sim.blockA.cost_saved_inr >= 0 ? "text-emerald-400" : "text-rose-400"}>
                  {sim.blockA.cost_saved_inr >= 0 ? `₹${sim.blockA.cost_saved_inr.toLocaleString()}` : `−₹${Math.abs(sim.blockA.cost_saved_inr).toLocaleString()}`}
                </strong>
              </span>
              <span className="text-slate-400 text-[11px] block">
                Comfort score changed by <strong className={sim.blockA.comfort_delta_pct >= 0 ? "text-emerald-400" : "text-amber-400"}>{sim.blockA.comfort_delta_pct} percentage points</strong>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Estimated Payback</span>
              <span className="font-mono font-bold text-blue-300 text-xs">{sim.blockA.payback_label}</span>
            </div>
          </div>

          {/* Transparent Data Source Disclosure */}
          <div className="text-[10.5px] text-slate-500 border-t border-slate-800/60 pt-2 leading-relaxed">
            <strong className="text-slate-400">Data Source & Methodology:</strong> Block A baseline (1,161 kWh/day, 152 kW peak) is derived from live distribution board M-A-MAIN telemetry (45.7 kW live load across 6 administrative & classroom zones). Plug load savings are lower here due to office computer density. Solar allocation is modeled on Block A's 40% proportional roof surface.
          </div>
        </div>

        {/* BLOCK B COMPARISON SUMMARY */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-800 text-purple-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <span>Block B — Comparison Summary</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Computer Science, AI & High-Performance Engineering Labs
                </span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-mono bg-purple-950/70 border border-purple-800 text-purple-300">
              {sim.blockB.kwh_pct <= 0 ? `Energy use reduced by ${Math.abs(sim.blockB.kwh_pct)}%` : `Energy use increased by ${sim.blockB.kwh_pct}%`}
            </span>
          </div>

          {/* Metric Comparison Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            {/* Metric: Daily Energy */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Energy Consumption</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono font-bold text-slate-100 text-sm">{sim.blockB.avg_kwh_day}</span>
                <span className="text-[10px] text-slate-400">kWh/day</span>
              </div>
              <div className="text-[10.5px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>Base: {baselineB.avg_kwh_day}</span>
                <span className={sim.blockB.kwh_pct <= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {sim.blockB.kwh_pct <= 0 ? `−${Math.abs(sim.blockB.kwh_pct)}%` : `+${sim.blockB.kwh_pct}%`}
                </span>
              </div>
            </div>

            {/* Metric: Monthly Cost */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Estimated Monthly Cost</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono font-bold text-slate-100 text-sm">₹{sim.blockB.total_cost_month_inr.toLocaleString()}</span>
              </div>
              <div className="text-[10.5px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>Base: ₹{baselineB.total_cost_month_inr.toLocaleString()}</span>
                <span className={sim.blockB.cost_saved_inr >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {sim.blockB.cost_saved_inr >= 0 ? `−₹${sim.blockB.cost_saved_inr.toLocaleString()}` : `+₹${Math.abs(sim.blockB.cost_saved_inr).toLocaleString()}`}
                </span>
              </div>
            </div>

            {/* Metric: Carbon Emissions */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Carbon Emissions</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono font-bold text-slate-100 text-sm">{sim.blockB.co2_tons_month}</span>
                <span className="text-[10px] text-slate-400">t CO₂/mo</span>
              </div>
              <div className="text-[10.5px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>Base: {baselineB.co2_tons_month} t</span>
                <span className={sim.blockB.co2_saved_tons >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {sim.blockB.co2_saved_tons >= 0 ? `−${sim.blockB.co2_saved_tons} t` : `+${Math.abs(sim.blockB.co2_saved_tons)} t`}
                </span>
              </div>
            </div>

            {/* Metric: Peak Demand */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Peak Demand</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono font-bold text-slate-100 text-sm">{sim.blockB.peak_demand_kw}</span>
                <span className="text-[10px] text-slate-400">kW</span>
              </div>
              <div className="text-[10.5px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>Base: {baselineB.peak_demand_kw} kW</span>
                <span className={sim.blockB.peak_delta_kw <= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {sim.blockB.peak_delta_kw <= 0 ? `${sim.blockB.peak_delta_kw} kW` : `+${sim.blockB.peak_delta_kw} kW`}
                </span>
              </div>
            </div>

            {/* Metric: Comfort Level */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Comfort Compliance</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono font-bold text-slate-100 text-sm">{sim.blockB.comfort_compliance_pct}%</span>
              </div>
              <div className="text-[10.5px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>Base: {baselineB.comfort_compliance_pct}%</span>
                <span className={sim.blockB.comfort_delta_pct >= 0 ? "text-emerald-400 font-bold" : sim.blockB.comfort_delta_pct >= -3 ? "text-amber-400 font-bold" : "text-rose-400 font-bold"}>
                  {sim.blockB.comfort_delta_pct >= 0 ? `+${sim.blockB.comfort_delta_pct}%` : `${sim.blockB.comfort_delta_pct}%`}
                </span>
              </div>
            </div>

            {/* Metric: Efficiency Score */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Efficiency Score</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono font-bold text-slate-100 text-sm">{sim.blockB.efficiency_score}</span>
                <span className="text-[10px] text-slate-400">/ 100</span>
              </div>
              <div className="text-[10.5px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>Base: {baselineB.efficiency_score}</span>
                <span className={sim.blockB.eff_delta >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {sim.blockB.eff_delta >= 0 ? `+${sim.blockB.eff_delta} pts` : `${sim.blockB.eff_delta} pts`}
                </span>
              </div>
            </div>
          </div>

          {/* Simple Differences & Payback Callout */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-400 text-[11px] block">
                Estimated Monthly Savings: <strong className={sim.blockB.cost_saved_inr >= 0 ? "text-emerald-400" : "text-rose-400"}>
                  {sim.blockB.cost_saved_inr >= 0 ? `₹${sim.blockB.cost_saved_inr.toLocaleString()}` : `−₹${Math.abs(sim.blockB.cost_saved_inr).toLocaleString()}`}
                </strong>
              </span>
              <span className="text-slate-400 text-[11px] block">
                Comfort score changed by <strong className={sim.blockB.comfort_delta_pct >= 0 ? "text-emerald-400" : "text-amber-400"}>{sim.blockB.comfort_delta_pct} percentage points</strong>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Estimated Payback</span>
              <span className="font-mono font-bold text-purple-300 text-xs">{sim.blockB.payback_label}</span>
            </div>
          </div>

          {/* Transparent Data Source Disclosure */}
          <div className="text-[10.5px] text-slate-500 border-t border-slate-800/60 pt-2 leading-relaxed">
            <strong className="text-slate-400">Data Source & Methodology:</strong> Block B baseline (1,850 kWh/day, 238 kW peak) is grounded in lab sub-meter M-B-MAIN and the 1R1C thermodynamic model. Block B is highly sensitive to Workstation Sleep due to 150+ high-power machines and shows rapid savings from Vision Occupancy Setback during lab changeovers.
          </div>
        </div>
      </div>

      {/* SECTION 4: 24-Hour Load Profile Chart (Baseline vs Simulated Twin) */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>24-Hour Dynamic Demand Curve (kW Profile)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Visualizes the hourly impact of your scenario controls: HVAC setback, computer sleep, and midday solar peak shaving.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-0.5 bg-slate-500"></span> Baseline Campus kW
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-3 h-0.5 bg-cyan-400"></span> Simulated Gross kW
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-3 h-0.5 bg-emerald-400"></span> Net Grid kW (After Solar)
            </span>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sim.hourlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="hour" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit=" kW" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "#0d1321", 
                  borderColor: "#1e293b", 
                  borderRadius: "0.75rem", 
                  fontSize: "11px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)" 
                }} 
              />
              <Line type="monotone" dataKey="Baseline Campus kW" stroke="#64748b" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              <Line type="monotone" dataKey="Simulated Gross kW" stroke="#38bdf8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Simulated Net Grid kW" stroke="#10b981" strokeWidth={2.5} dot={false} />
              {solarKwp > 0 && (
                <Line type="monotone" dataKey="Solar PV Generation kW" stroke="#eab308" strokeWidth={1.5} dot={false} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION 5: Side-by-Side Scenario Comparison Table */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-3 gap-2">
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Campus Multi-Scenario Benchmark Table</span>
            </h3>
            <p className="text-xs text-slate-400">
              Comparing your dynamic simulation alongside canonical facility strategies over a 30-day horizon.
            </p>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 font-mono">
            30-Day Simulated Horizon
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-3 px-3">Performance Metric</th>
                <th className="py-3 px-3 text-slate-300 font-bold">Baseline (Twin)</th>
                <th className="py-3 px-3 text-cyan-400 font-bold">Scenario A (24°C Setpoint)</th>
                <th className="py-3 px-3 text-purple-400 font-bold">Scenario B (Vision HVAC)</th>
                <th className="py-3 px-3 text-emerald-400 font-bold bg-emerald-950/20">Optimized Package</th>
                <th className="py-3 px-3 text-amber-300 font-bold bg-amber-950/20 border-l border-amber-800/50">
                  Your What-If Simulation
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              <tr>
                <td className="py-3 px-3 font-sans text-slate-300 font-medium">Block B Energy Draw</td>
                <td className="py-3 px-3 text-slate-300">{baselineB.avg_kwh_day} kWh/d</td>
                <td className="py-3 px-3 text-cyan-300">1,722 kWh/d (−6.9%)</td>
                <td className="py-3 px-3 text-purple-300">1,590 kWh/d (−14.2%)</td>
                <td className="py-3 px-3 text-emerald-400 font-bold bg-emerald-950/20">1,093 kWh/d (−40.9%)</td>
                <td className="py-3 px-3 text-amber-300 font-bold bg-amber-950/20 border-l border-amber-800/50">
                  {sim.blockB.avg_kwh_day} kWh/d ({sim.blockB.kwh_pct <= 0 ? `${sim.blockB.kwh_pct}%` : `+${sim.blockB.kwh_pct}%`})
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-sans text-slate-300 font-medium">Block A Energy Draw</td>
                <td className="py-3 px-3 text-slate-300">{baselineA.avg_kwh_day} kWh/d</td>
                <td className="py-3 px-3 text-cyan-300">1,091 kWh/d (−6.0%)</td>
                <td className="py-3 px-3 text-purple-300">1,027 kWh/d (−11.5%)</td>
                <td className="py-3 px-3 text-emerald-400 font-bold bg-emerald-950/20">785 kWh/d (−32.4%)</td>
                <td className="py-3 px-3 text-amber-300 font-bold bg-amber-950/20 border-l border-amber-800/50">
                  {sim.blockA.avg_kwh_day} kWh/d ({sim.blockA.kwh_pct <= 0 ? `${sim.blockA.kwh_pct}%` : `+${sim.blockA.kwh_pct}%`})
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-sans text-slate-300 font-medium">Campus Monthly Electricity Cost</td>
                <td className="py-3 px-3 text-slate-300">₹{(baselineA.total_cost_month_inr + baselineB.total_cost_month_inr).toLocaleString()}</td>
                <td className="py-3 px-3 text-cyan-300">₹717,910 (−₹49,640)</td>
                <td className="py-3 px-3 text-purple-300">₹667,200 (−₹100,350)</td>
                <td className="py-3 px-3 text-emerald-400 font-bold bg-emerald-950/20">₹476,000 (−₹291,550)</td>
                <td className="py-3 px-3 text-amber-300 font-bold bg-amber-950/20 border-l border-amber-800/50">
                  ₹{(sim.blockA.total_cost_month_inr + sim.blockB.total_cost_month_inr).toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-sans text-slate-300 font-medium">Campus Carbon Footprint</td>
                <td className="py-3 px-3 text-slate-300">{(baselineA.co2_tons_month + baselineB.co2_tons_month).toFixed(1)} t CO₂/mo</td>
                <td className="py-3 px-3 text-cyan-300">69.2 t (−4.9 t)</td>
                <td className="py-3 px-3 text-purple-300">64.4 t (−9.7 t)</td>
                <td className="py-3 px-3 text-emerald-400 font-bold bg-emerald-950/20">45.9 t (−28.2 t)</td>
                <td className="py-3 px-3 text-amber-300 font-bold bg-amber-950/20 border-l border-amber-800/50">
                  {(sim.blockA.co2_tons_month + sim.blockB.co2_tons_month).toFixed(1)} t CO₂/mo
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-sans text-slate-300 font-medium">Peak Demand (Block B / Block A)</td>
                <td className="py-3 px-3 text-slate-300">238 / 152 kW</td>
                <td className="py-3 px-3 text-cyan-300">224 / 144 kW</td>
                <td className="py-3 px-3 text-purple-300">219 / 141 kW</td>
                <td className="py-3 px-3 text-emerald-400 font-bold bg-emerald-950/20">178 / 118 kW</td>
                <td className="py-3 px-3 text-amber-300 font-bold bg-amber-950/20 border-l border-amber-800/50">
                  {sim.blockB.peak_demand_kw} / {sim.blockA.peak_demand_kw} kW
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-sans text-slate-300 font-medium">Comfort Compliance (22–26°C)</td>
                <td className="py-3 px-3 text-emerald-400 font-bold">96.5%</td>
                <td className="py-3 px-3 text-amber-400">92.0% (Drop in peak hr)</td>
                <td className="py-3 px-3 text-emerald-400">96.0% (High)</td>
                <td className="py-3 px-3 text-emerald-400 font-bold bg-emerald-950/20">95.0%</td>
                <td className="py-3 px-3 text-amber-300 font-bold bg-amber-950/20 border-l border-amber-800/50">
                  {((sim.blockA.comfort_compliance_pct + sim.blockB.comfort_compliance_pct) / 2).toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-sans text-slate-300 font-medium">Efficiency Score (Avg)</td>
                <td className="py-3 px-3 text-slate-300">72 / 100</td>
                <td className="py-3 px-3 text-cyan-300">77 / 100</td>
                <td className="py-3 px-3 text-purple-300">82 / 100</td>
                <td className="py-3 px-3 text-emerald-400 font-bold bg-emerald-950/20">96 / 100</td>
                <td className="py-3 px-3 text-amber-300 font-bold bg-amber-950/20 border-l border-amber-800/50">
                  {Math.round((sim.blockA.efficiency_score + sim.blockB.efficiency_score) / 2)} / 100
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-sans text-slate-300 font-medium">Economic Payback</td>
                <td className="py-3 px-3 text-slate-500">—</td>
                <td className="py-3 px-3 text-cyan-300">Immediate (0 Capex)</td>
                <td className="py-3 px-3 text-purple-300">9 Months</td>
                <td className="py-3 px-3 text-emerald-400 font-bold bg-emerald-950/20">2.8 Years Payback</td>
                <td className="py-3 px-3 text-amber-300 font-bold bg-amber-950/20 border-l border-amber-800/50">
                  {sim.blockB.payback_label}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 6: Honest Trade-Off Analysis & Best Strategy Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strategy Guidance for Block B */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-bold">
            <Building2 className="w-4 h-4" />
            <span>Best Strategy for Block B (Computer & Engineering Labs)</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            <strong>Vision Occupancy Setback + Workstation Sleep</strong> is the highest-performing strategy for Block B. 
            Because computer labs have large internal heat gains from 150+ workstations and intermittent class schedules, 
            cutting idle computer load and relaxing AC only during vacant intervals saves over <strong>28% energy</strong> with 
            <strong> zero comfort penalty</strong> for students. Simply increasing the AC setpoint to 24°C or 25°C without setback 
            causes uncomfortable heat buildup in densely packed computer labs.
          </p>
        </div>

        {/* Strategy Guidance for Block A */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-bold">
            <Building2 className="w-4 h-4" />
            <span>Best Strategy for Block A (Admin, Library & Lecture Halls)</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            <strong>Moderate Setpoint (23.5°C) + Rooftop Solar PV</strong> is the ideal strategy for Block A. 
            Block A has steady daytime office occupancy where workstation sleep has lower leverage. However, administrative offices 
            tolerate a modest 23.5°C setpoint comfortably, and rooftop solar generation aligns perfectly with daytime administrative 
            air conditioning and library lighting hours.
          </p>
        </div>
      </div>

      {/* Capex vs Comfort vs Savings Trade-Off Card */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-200">Honest Trade-Off Breakdown: Capex vs Comfort vs Savings</span>
          <p className="text-slate-400 leading-relaxed">
            • <strong>Zero-Capex Controls (AC Setpoint & Workstation Sleep):</strong> Immediate payback with no upfront capital investment. However, setting the AC thermostat above 24.5°C penalizes occupant comfort during peak afternoon heat.<br/>
            • <strong>Low-Capex Vision Automation (Occupancy Setback):</strong> Requires minimal vision camera integration with an estimated 9-month payback, while delivering high HVAC savings with 100% comfort preservation.<br/>
            • <strong>Capital Upgrades (Solar PV Array):</strong> Yields the highest carbon reduction and bill savings, but requires capital expenditure with a 2.5 to 3.2 year economic payback period.
          </p>
        </div>
      </div>
    </div>
  );
};
