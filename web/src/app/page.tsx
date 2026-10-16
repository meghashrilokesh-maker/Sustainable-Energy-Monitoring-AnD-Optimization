"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { DemoControllerDrawer } from "../components/DemoControllerDrawer";
import { CommandCenterView } from "../components/CommandCenterView";
import { LiveMonitorView } from "../components/LiveMonitorView";
import { VisionMonitorView } from "../components/VisionMonitorView";
import { DigitalTwinView } from "../components/DigitalTwinView";
import { BuildingTwin3D } from "../components/BuildingTwin3D";
import { AnalyticsForecastView } from "../components/AnalyticsForecastView";
import { AnomalyCenterView } from "../components/AnomalyCenterView";
import { WhatIfSimulatorView } from "../components/WhatIfSimulatorView";
import { AdvisorChatView } from "../components/AdvisorChatView";
import { FloatingRobotAssistant } from "../components/FloatingRobotAssistant";
import { OptimizationCenterView } from "../components/OptimizationCenterView";
import { ExecutiveReportView } from "../components/ExecutiveReportView";
import { Layers, Box } from "lucide-react";

import { 
  fetchSiteSummary, 
  fetchLiveTick, 
  fetchHistory, 
  fetchTwinZones, 
  fetchAnomalies, 
  fetchMorningBriefing 
} from "../lib/api";
import { SiteSummary, ZoneMetadata, ZoneState, Anomaly } from "../lib/types";

export default function PulseGridApp() {
  const [activeTab, setActiveTab] = useState<string>("command");
  const [isAdvisorOpen, setIsAdvisorOpen] = useState<boolean>(false);
  const [isDemoDrawerOpen, setIsDemoDrawerOpen] = useState<boolean>(false);
  const [twinMode, setTwinMode] = useState<"2d" | "3d">("3d");

  // Core telemetry state
  const [siteSummary, setSiteSummary] = useState<SiteSummary | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [zones, setZones] = useState<ZoneMetadata[]>([]);
  const [zoneStates, setZoneStates] = useState<ZoneState[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
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

  const loadData = async () => {
    try {
      const [sum, hist, tz, anom, brief] = await Promise.all([
        fetchSiteSummary().catch(() => null),
        fetchHistory().catch(() => []),
        fetchTwinZones().catch(() => ({ zones: [], states: [] })),
        fetchAnomalies().catch(() => ({ anomalies: [] })),
        fetchMorningBriefing().catch(() => null)
      ]);

      if (sum) setSiteSummary(sum);
      if (hist) setHistoryData(hist);
      if (tz) {
        setZones(tz.zones || []);
        setZoneStates(tz.states || []);
      }
      if (anom) setAnomalies(anom.anomalies || []);
      if (brief) setMorningBriefing(brief);
    } catch (err) {
      console.warn("Failed background refresh", err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleApplyAction = (actionCode: string) => {
    showToast(`Optimization Action Applied: ${actionCode}. Twin has updated active control profile.`);
    loadData();
  };

  const handleForkScenario = (zoneId: string) => {
    setActiveTab("simulator");
    showToast(`Zone ${zoneId} forked to What-If Simulator.`);
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans">
      {/* Toast Notification positioned away from bottom-right robot */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-cyan-600 border border-cyan-400 text-white font-medium text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAdvisor={() => setIsAdvisorOpen(prev => !prev)}
        isAdvisorOpen={isAdvisorOpen}
        openDemoController={() => setIsDemoDrawerOpen(true)}
        siteTotals={siteSummary?.live_totals}
      />

      {/* Main Content Area: Render Active Page */}
      <main className="flex-1 pb-12">
        {activeTab === "command" && (
          <CommandCenterView
            summary={siteSummary}
            historyData={historyData}
            anomalies={anomalies}
            briefing={morningBriefing}
            onNavigateTab={(tab) => {
              if (tab === "advisor") {
                setIsAdvisorOpen(true);
              } else {
                setActiveTab(tab);
              }
            }}
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
          <div className="flex flex-col gap-2 w-full">
            <div className="flex flex-wrap justify-between items-center max-w-[1400px] w-full mx-auto px-4 pt-3 gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold text-slate-200">Digital Twin Projection:</span>
                <span className="hidden sm:inline">Switch between 2D engineering floor plan and 3D spatial building model</span>
              </div>
              <div className="flex items-center gap-1.5 p-1 bg-[#080d1a] border border-slate-800 rounded-lg shadow-sm">
                <button
                  onClick={() => setTwinMode("2d")}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    twinMode === "2d"
                      ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30 border border-cyan-400/50"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>2D Floor Plan</span>
                </button>
                <button
                  onClick={() => setTwinMode("3d")}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    twinMode === "3d"
                      ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30 border border-cyan-400/50"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent"
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>3D Spatial Twin</span>
                </button>
              </div>
            </div>

            {twinMode === "2d" ? (
              <DigitalTwinView
                zones={zones}
                zoneStates={zoneStates}
                onForkScenario={handleForkScenario}
              />
            ) : (
              <BuildingTwin3D
                zones={zones}
                zoneStates={zoneStates}
                onForkScenario={handleForkScenario}
              />
            )}
          </div>
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
            onRefresh={loadData}
          />
        )}

        {activeTab === "simulator" && (
          <WhatIfSimulatorView
            onAskAI={(q) => {
              setIsAdvisorOpen(true);
            }}
          />
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

      {/* Floating Animated Robot Assistant & Slide-out Advisor Panel */}
      <FloatingRobotAssistant
        isOpen={isAdvisorOpen}
        onToggle={() => setIsAdvisorOpen(prev => !prev)}
        onClose={() => setIsAdvisorOpen(false)}
      />

      {/* Demo Controller Floating Drawer */}
      <DemoControllerDrawer
        isOpen={isDemoDrawerOpen}
        onClose={() => setIsDemoDrawerOpen(false)}
        activeFaults={activeFaults}
        setActiveFaults={setActiveFaults}
        activeClip={activeClip}
        setActiveClip={setActiveClip}
        jumpToTab={setActiveTab}
        refreshData={loadData}
      />
    </div>
  );
}
