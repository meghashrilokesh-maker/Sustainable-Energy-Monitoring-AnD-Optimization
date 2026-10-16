"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { DemoControllerDrawer } from "../components/DemoControllerDrawer";
import { CommandCenterView } from "../components/CommandCenterView";
import { LiveMonitorView } from "../components/LiveMonitorView";
import { VisionMonitorView } from "../components/VisionMonitorView";
import { DigitalTwinView } from "../components/DigitalTwinView";
import { AnalyticsForecastView } from "../components/AnalyticsForecastView";
import { AnomalyCenterView } from "../components/AnomalyCenterView";
import { WhatIfSimulatorView } from "../components/WhatIfSimulatorView";
import { AdvisorChatView } from "../components/AdvisorChatView";
import { FloatingRobotAssistant } from "../components/FloatingRobotAssistant";
import { OptimizationCenterView } from "../components/OptimizationCenterView";
import { ExecutiveReportView } from "../components/ExecutiveReportView";

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
