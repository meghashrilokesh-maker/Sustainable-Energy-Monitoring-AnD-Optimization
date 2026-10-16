import {
  MOCK_SITE_SUMMARY,
  generateMockHistory,
  MOCK_ZONES,
  getMockZoneStates,
  MOCK_ANOMALIES,
  MOCK_FORECAST,
  MOCK_SCENARIOS,
  MOCK_OPTIMIZER_ACTIONS,
  MOCK_CAMERA_FEED,
  MOCK_EQUIPMENT_PASSPORTS,
  MOCK_EXECUTIVE_REPORT,
  MOCK_BRIEFING
} from "./mockData";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function safeFetch<T>(endpoint: string, fallback: T, options?: RequestInit): Promise<T> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      signal: controller.signal,
      cache: "no-store"
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return fallback;
    }
    return await res.json();
  } catch {
    return fallback;
  }
}

// In-memory simulation state for fallback mode
let resolvedAnomalyIds = new Set<string>();
let activeFaultsState: Record<string, boolean> = {
  F1: true,
  F2: false,
  F3: false,
  F4: true,
  F5: false
};
let currentClip = "b204_vacant_cooling_clip";

export async function fetchSiteSummary() {
  const sum = await safeFetch("/api/site/summary", MOCK_SITE_SUMMARY);
  // Add small live jitter for realism if in fallback
  const jitter = (Math.random() - 0.5) * 1.5;
  return {
    ...sum,
    live_totals: {
      ...sum.live_totals,
      measured_kw: Number((sum.live_totals.measured_kw + jitter).toFixed(1))
    }
  };
}

export async function fetchLiveTick() {
  const fallbackTick = {
    site_totals: {
      measured_kw: Number((118.5 + (Math.random() - 0.5) * 2.0).toFixed(1)),
      expected_kw: 114.2,
      unexplained_kw: activeFaultsState.F1 ? 3.42 : 0.60
    },
    buildings: MOCK_SITE_SUMMARY.buildings
  };
  return safeFetch("/api/live/tick", fallbackTick);
}

export async function fetchHistory(daysAgo = 0) {
  const fallback = generateMockHistory(daysAgo);
  return safeFetch(`/api/live/history?days_ago=${daysAgo}`, fallback);
}

export async function fetchTwinZones() {
  const fallback = {
    zones: MOCK_ZONES,
    states: getMockZoneStates()
  };
  return safeFetch("/api/twin/zones", fallback);
}

export async function fetchZoneDetail(zoneId: string) {
  const zones = MOCK_ZONES;
  const states = getMockZoneStates();
  const zone = zones.find(z => z.id === zoneId) || zones[0];
  const state = states.find(s => s.zone_id === zoneId) || states[0];
  const equipment = MOCK_EQUIPMENT_PASSPORTS.filter(e => e.zone_id === zoneId);

  return safeFetch(`/api/twin/zones/${zoneId}`, {
    zone,
    state,
    equipment
  });
}

export async function fetchCameraFeed(cameraId = "cam-b204-01") {
  return safeFetch(`/api/vision/camera/${cameraId}`, {
    ...MOCK_CAMERA_FEED,
    camera_id: cameraId,
    active_clip: currentClip,
    timestamp: new Date().toISOString()
  });
}

export async function selectVisionClip(clipId: string) {
  currentClip = clipId;
  return safeFetch("/api/vision/select_clip", { status: "success", active_clip: clipId }, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clip_id: clipId })
  });
}

export async function fetchAnomalies() {
  const filtered = MOCK_ANOMALIES.filter(a => !resolvedAnomalyIds.has(a.anomaly_id));
  return safeFetch("/api/anomalies", { anomalies: filtered });
}

export async function resolveAnomaly(anomalyId: string) {
  resolvedAnomalyIds.add(anomalyId);
  return safeFetch(`/api/anomalies/${anomalyId}/resolve`, { status: "resolved", anomaly_id: anomalyId }, {
    method: "POST"
  });
}

export async function fetchScenarioComparison() {
  return safeFetch("/api/simulator/compare", MOCK_SCENARIOS);
}

export async function runCustomSimulation(params: any) {
  const baseKwh = 55500;
  const setbackFactor = params.occupancy_hvac ? 0.86 : 1.0;
  const pcFactor = params.auto_pc_off ? 0.93 : 1.0;
  const solarKwh = (params.solar_kwp || 0) * 120;
  const projectedKwh = Math.max(15000, Math.round(baseKwh * setbackFactor * pcFactor - solarKwh));
  const savedKwh = baseKwh - projectedKwh;
  const savedCost = Math.round(savedKwh * 8.5);
  const savedCo2 = Number((savedKwh * 0.82 / 1000).toFixed(1));

  const fallbackResult = {
    baseline_kwh: baseKwh,
    projected_kwh: projectedKwh,
    savings_kwh: savedKwh,
    savings_inr_month: savedCost,
    savings_co2_tons: savedCo2,
    efficiency_score: Math.min(99, Math.round(74 + (savedKwh / baseKwh) * 35)),
    daily_profile: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      time: `${i.toString().padStart(2, "0")}:00`,
      baseline_kw: Math.round(80 + Math.exp(-Math.pow(i - 14.2, 2) / 16.0) * 140),
      simulated_kw: Math.round(
        (80 + Math.exp(-Math.pow(i - 14.2, 2) / 16.0) * 140) * (setbackFactor * pcFactor) -
        (i >= 7 && i <= 17 ? (params.solar_kwp || 0) * 0.8 : 0)
      )
    }))
  };

  return safeFetch("/api/simulator/run", fallbackResult, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
}

export async function rankOptimizations(priorities: any) {
  return safeFetch("/api/optimizer/rank", { ranked_actions: MOCK_OPTIMIZER_ACTIONS }, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(priorities)
  });
}

export async function fetchForecast() {
  return safeFetch("/api/forecast/24h", MOCK_FORECAST);
}

export async function fetchMorningBriefing() {
  return safeFetch("/api/advisor/briefing", MOCK_BRIEFING);
}

export interface AdvisorQueryResult {
  query?: string;
  answer: string;
  citations: string[];
  tool_trace?: Array<{ tool: string; args: any; status: string }>;
  numeric_guard_verified?: boolean;
}

export async function askAdvisor(query: string): Promise<AdvisorQueryResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${API_BASE}/api/advisor/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      signal: controller.signal,
      cache: "no-store"
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`AI Advisor service returned HTTP ${res.status}: ${errText || res.statusText}`);
    }

    const data = await res.json();

    // Safely normalize citations to string array so React never crashes on objects
    const citations: string[] = Array.isArray(data.citations)
      ? data.citations.map((c: any) => {
          if (typeof c === "string") return c;
          if (c && typeof c === "object") {
            if (c.doc && c.ref) return `${c.doc}: ${c.ref}`;
            if (c.doc) return String(c.doc);
            return JSON.stringify(c);
          }
          return String(c);
        })
      : [];

    return {
      query: data.query || query,
      answer: data.answer || "No response received from advisor.",
      citations,
      tool_trace: Array.isArray(data.tool_trace) ? data.tool_trace : [],
      numeric_guard_verified: data.numeric_guard_verified ?? true
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error(
        `AI Advisor request timed out. The backend service at ${API_BASE} did not respond within 8 seconds.`
      );
    }
    const msg = err.message || "";
    if (
      msg.includes("Failed to fetch") ||
      msg.includes("NetworkError") ||
      msg.includes("connection refused") ||
      msg.includes("ECONNREFUSED")
    ) {
      throw new Error(
        `PulseGrid AI service is offline or unreachable at ${API_BASE}. Please ensure the FastAPI server is running via 'uvicorn backend.app.main:app --port 8000' and NEXT_PUBLIC_API_URL is properly configured.`
      );
    }
    throw new Error(msg || "An unexpected error occurred while communicating with the AI Advisor.");
  }
}


export async function toggleDemoFault(faultId: string, active: boolean) {
  activeFaultsState[faultId] = active;
  return safeFetch("/api/demo/set_fault", {
    status: "updated",
    active_faults: activeFaultsState,
    active_anomalies_count: activeFaultsState.F1 ? 2 : 1,
    live_unexplained_kw: activeFaultsState.F1 ? 3.42 : 0.60
  }, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fault_id: faultId, active })
  });
}

export async function fetchEquipmentPassports() {
  return safeFetch("/api/equipment/passports", { equipment: MOCK_EQUIPMENT_PASSPORTS });
}

export async function fetchExecutiveReport() {
  return safeFetch("/api/reports/executive", MOCK_EXECUTIVE_REPORT);
}
