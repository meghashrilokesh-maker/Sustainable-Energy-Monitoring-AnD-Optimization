"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { SimulationControlsBar } from "../components/SimulationControlsBar";
import { DemoControllerDrawer } from "../components/DemoControllerDrawer";
import { CommandCenterView } from "../components/CommandCenterView";
import { LiveMonitorView } from "../components/LiveMonitorView";
import { VisionMonitorView } from "../components/VisionMonitorView";
import { DigitalTwinView } from "../components/DigitalTwinView";
import { AnalyticsForecastView } from "../components/AnalyticsForecastView";
import { AnomalyCenterView } from "../components/AnomalyCenterView";
import { WhatIfSimulatorView } from "../components/WhatIfSimulatorView";
import { AdvisorChatView } from "../components/AdvisorChatView";
import { OptimizationCenterView } from "../components/OptimizationCenterView";
import { ExecutiveReportView } from "../components/ExecutiveReportView";

import { uciClientSimulator } from "../lib/uciClientSimulator";
import { SiteSummary, ZoneMetadata, ZoneState, Anomaly, SimulationState } from "../lib/types";

export default function PulseGridApp() {
  const [activeTab, setActiveTab] = useState<string>("command");
  const [isDemoDrawerOpen, setIsDemoDrawerOpen] = useState<boolean>(false);

  // Core telemetry & simulation state
  const [simState, setSimState] = useState<SimulationState>(() => uciClientSimulator.getCurrentEvent().state);
  const [siteSummary, setSiteSummary] = useState<SiteSummary | null>(() => uciClientSimulator.getCurrentEvent().siteSummary);
  const [historyData, setHistoryData] = useState<any[]>(() => uciClientSimulator.getCurrentEvent().state.history);
  const [zones, setZones] = useState<ZoneMetadata[]>([]);
  const [zoneStates, setZoneStates] = useState<ZoneState[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>(() => uciClientSimulator.getCurrentEvent().anomalies);
  const [morningBriefing, setMorningBriefing] = useState<any>(null);

  // Demo controller state
  const [activeFaults, setActiveFaults] = useState<Record<string, boolean>>({
    F1: true,
    F2: false,
    F3: false,
    F4: true,
    F5: false
  });
  const [activeClip, setActiveClip] = useState<string>("b204_vacant_cooling_clip");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    // Initialize client simulation engine with UCI dataset
    uciClientSimulator.init();

    const unsubscribe = uciClientSimulator.subscribe((event) => {
      setSimState(event.state);
      setSiteSummary(event.siteSummary);
      setHistoryData(event.state.history);
      setAnomalies(event.anomalies);

      const rec = event.state.currentRecord;
      if (rec) {
        // Construct spatial twin zone states with empirical T1-T9 & RH1-RH9
        const empiricalZones: ZoneState[] = [
          {
            zone_id: "B-204",
            name: "Lab B-204 (Sensor Zone 1 - Kitchen/Lab)",
            building_id: "Block-B",
            floor: 2,
            type: "LAB",
            area_m2: 85,
            occupancy: rec.appKw > 0.4 ? 18 : 0,
            vacant_seconds: rec.appKw > 0.4 ? 0 : 3120,
            temp_c: rec.t[0] || 21.8,
            outdoor_temp_c: rec.tOut,
            setpoint_c: 22.0,
            rh_pct: rec.rh[0] || 48.0,
            co2_ppm: rec.appKw > 0.4 ? 580 : 410,
            measured_kw: rec.appKw,
            expected_kw: Math.round(rec.appKw * 0.4 * 100) / 100,
            unexplained_kw: event.state.unexplainedKw,
            category_breakdown: {
              hvac: Math.round(rec.appKw * 0.55 * 100) / 100,
              lighting: Math.round(rec.lgtKw * 100) / 100,
              plug_loads: Math.round(rec.appKw * 0.35 * 100) / 100,
              other: 0.05
            },
            equipment_states: {
              hvac: rec.appKw > 0.3 ? "COOLING" : "IDLE",
              lights: rec.lgtKw > 0.02 ? "ON" : "OFF",
              pcs_on: rec.appKw > 0.4 ? 17 : 2,
              fan: "OFF",
              window: "CLOSED"
            },
            data_quality: "NORMAL",
            confidence: 0.98,
            last_updated: rec.date
          },
          {
            zone_id: "B-207",
            name: "Lab B-207 (Sensor Zone 2 - Living/Common)",
            building_id: "Block-B",
            floor: 2,
            type: "LAB",
            area_m2: 90,
            occupancy: 4,
            vacant_seconds: 0,
            temp_c: rec.t[1] || 22.5,
            outdoor_temp_c: rec.tOut,
            setpoint_c: 22.0,
            rh_pct: rec.rh[1] || 46.0,
            co2_ppm: 440,
            measured_kw: Math.round(rec.totalKw * 0.35 * 100) / 100,
            expected_kw: Math.round(rec.totalKw * 0.28 * 100) / 100,
            unexplained_kw: Math.max(0, Math.round(rec.totalKw * 0.07 * 100) / 100),
            category_breakdown: {
              hvac: Math.round(rec.appKw * 0.2 * 100) / 100,
              lighting: Math.round(rec.lgtKw * 0.3 * 100) / 100,
              plug_loads: 0.15,
              other: 0.02
            },
            equipment_states: {
              hvac: "COOLING",
              lights: "ON",
              pcs_on: 12,
              fan: "ON",
              window: "CLOSED"
            },
            data_quality: "NORMAL",
            confidence: 0.96,
            last_updated: rec.date
          },
          {
            zone_id: "B-101",
            name: "Hall B-101 (Sensor Zone 3 - Laundry/Utility)",
            building_id: "Block-B",
            floor: 1,
            type: "CLASSROOM",
            area_m2: 120,
            occupancy: 25,
            vacant_seconds: 0,
            temp_c: rec.t[2] || 20.5,
            outdoor_temp_c: rec.tOut,
            setpoint_c: 23.0,
            rh_pct: rec.rh[2] || 50.0,
            co2_ppm: 620,
            measured_kw: Math.round(rec.totalKw * 0.25 * 100) / 100,
            expected_kw: Math.round(rec.totalKw * 0.25 * 100) / 100,
            unexplained_kw: 0.0,
            category_breakdown: {
              hvac: 0.15,
              lighting: 0.05,
              plug_loads: 0.05,
              other: 0.0
            },
            equipment_states: {
              hvac: "COOLING",
              lights: "ON",
              pcs_on: 0,
              fan: "ON",
              window: "CLOSED"
            },
            data_quality: "NORMAL",
            confidence: 0.99,
            last_updated: rec.date
          },
          {
            zone_id: "B-201",
            name: "AI Lab B-201 (Sensor Zone 4 - Office/Study)",
            building_id: "Block-B",
            floor: 2,
            type: "LAB",
            area_m2: 75,
            occupancy: 8,
            vacant_seconds: 0,
            temp_c: rec.t[3] || 21.0,
            outdoor_temp_c: rec.tOut,
            setpoint_c: 22.5,
            rh_pct: rec.rh[3] || 45.0,
            co2_ppm: 480,
            measured_kw: 0.18,
            expected_kw: 0.18,
            unexplained_kw: 0.0,
            category_breakdown: { hvac: 0.08, lighting: 0.04, plug_loads: 0.06, other: 0.0 },
            equipment_states: { hvac: "IDLE", lights: "ON", pcs_on: 8, fan: "OFF", window: "CLOSED" },
            data_quality: "NORMAL",
            confidence: 0.97,
            last_updated: rec.date
          },
          {
            zone_id: "B-205",
            name: "Lounge B-205 (Sensor Zone 5 - Restroom/Aux)",
            building_id: "Block-B",
            floor: 2,
            type: "LOUNGE",
            area_m2: 60,
            occupancy: 2,
            vacant_seconds: 0,
            temp_c: rec.t[4] || 19.5,
            outdoor_temp_c: rec.tOut,
            setpoint_c: 24.0,
            rh_pct: rec.rh[4] || 52.0,
            co2_ppm: 420,
            measured_kw: 0.06,
            expected_kw: 0.06,
            unexplained_kw: 0.0,
            category_breakdown: { hvac: 0.02, lighting: 0.02, plug_loads: 0.02, other: 0.0 },
            equipment_states: { hvac: "IDLE", lights: "ON", pcs_on: 0, fan: "OFF", window: "CLOSED" },
            data_quality: "NORMAL",
            confidence: 0.95,
            last_updated: rec.date
          }
        ];
        setZoneStates(empiricalZones);

        setMorningBriefing({
          headline: "UCI Dataset Replay Operational Briefing",
          content: `Replaying observation ${rec.date} from UCI Appliances Energy Prediction dataset. Current power is ${rec.totalKw.toFixed(2)} kW (Appliances: ${rec.appKw.toFixed(2)} kW, Lights: ${rec.lgtKw.toFixed(2)} kW). Outdoor temp is ${rec.tOut.toFixed(1)}°C with ${event.anomalies.length} active anomalies detected.`,
          key_metrics: {
            active_anomalies: event.anomalies.length,
            recoverable_waste_inr_day: event.siteSummary.live_totals.recoverable_inr_day,
            peak_forecast_kw: event.state.peakKw || 2.4
          }
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleApplyAction = (actionCode: string) => {
    showToast(`Simulation Action Applied: ${actionCode}. Twin software model updated.`);
  };

  const handleForkScenario = (zoneId: string) => {
    setActiveTab("simulator");
    showToast(`Zone ${zoneId} loaded into What-If Simulator.`);
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-cyan-600 border border-cyan-400 text-white font-medium text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openDemoController={() => setIsDemoDrawerOpen(true)}
        siteTotals={siteSummary?.live_totals}
      />

      {/* Dataset Simulation Controls Bar */}
      <SimulationControlsBar
        state={simState}
        onPlay={() => {
          uciClientSimulator.resume();
          showToast("UCI Dataset Replay: Resumed");
        }}
        onPause={() => {
          uciClientSimulator.pause();
          showToast("UCI Dataset Replay: Paused");
        }}
        onReset={() => {
          uciClientSimulator.reset();
          showToast("UCI Dataset Replay: Reset to Record 0");
        }}
        onSpeedChange={(s) => {
          uciClientSimulator.setSpeed(s);
          showToast(`Simulation Speed: ${s}x`);
        }}
        onScrub={(idx) => {
          uciClientSimulator.scrubTo(idx);
        }}
      />

      {/* Main Content Area: Render Active Page */}
      <main className="flex-1 pb-12">
        {activeTab === "command" && (
          <CommandCenterView
            summary={siteSummary}
            historyData={historyData}
            anomalies={anomalies}
            briefing={morningBriefing}
            onNavigateTab={setActiveTab}
            onApplyAction={handleApplyAction}
          />
        )}

        {activeTab === "live" && (
          <LiveMonitorView
            zoneStates={zoneStates}
            historyData={historyData}
          />
        )}

        {activeTab === "vision" && (
          <VisionMonitorView
            onNavigateAnomaly={() => setActiveTab("anomalies")}
          />
        )}

        {activeTab === "twin" && (
          <DigitalTwinView
            zones={zones}
            zoneStates={zoneStates}
            onForkScenario={handleForkScenario}
          />
        )}

        {activeTab === "analytics" && (
          <AnalyticsForecastView />
        )}

        {activeTab === "anomalies" && (
          <AnomalyCenterView
            anomalies={anomalies}
            onSimulateFix={(anom) => {
              setActiveTab("simulator");
              showToast(`Defect ${anom.anomaly_id} loaded into simulator.`);
            }}
            onRefresh={() => uciClientSimulator.stepForward(1)}
          />
        )}

        {activeTab === "simulator" && (
          <WhatIfSimulatorView
            onAskAI={(q) => {
              setActiveTab("advisor");
            }}
          />
        )}

        {activeTab === "advisor" && (
          <AdvisorChatView />
        )}

        {activeTab === "optimization" && (
          <OptimizationCenterView
            onApplyAction={handleApplyAction}
          />
        )}

        {activeTab === "reports" && (
          <ExecutiveReportView />
        )}
      </main>

      {/* Demo Controller Floating Drawer */}
      <DemoControllerDrawer
        isOpen={isDemoDrawerOpen}
        onClose={() => setIsDemoDrawerOpen(false)}
        activeFaults={activeFaults}
        setActiveFaults={setActiveFaults}
        activeClip={activeClip}
        setActiveClip={setActiveClip}
        jumpToTab={setActiveTab}
        refreshData={() => uciClientSimulator.stepForward(1)}
      />
    </div>
  );
}
