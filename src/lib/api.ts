const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function fetchSiteSummary() {
  const res = await fetch(`${API_BASE}/api/site/summary`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch site summary");
  return res.json();
}

export async function fetchLiveTick() {
  const res = await fetch(`${API_BASE}/api/live/tick`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch live tick");
  return res.json();
}

export async function fetchHistory(daysAgo = 0) {
  const res = await fetch(`${API_BASE}/api/live/history?days_ago=${daysAgo}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

export async function fetchTwinZones() {
  const res = await fetch(`${API_BASE}/api/twin/zones`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch twin zones");
  return res.json();
}

export async function fetchZoneDetail(zoneId: string) {
  const res = await fetch(`${API_BASE}/api/twin/zones/${zoneId}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch zone ${zoneId}`);
  return res.json();
}

export async function fetchCameraFeed(cameraId = "cam-b204-01") {
  const res = await fetch(`${API_BASE}/api/vision/camera/${cameraId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch camera feed");
  return res.json();
}

export async function selectVisionClip(clipId: string) {
  const res = await fetch(`${API_BASE}/api/vision/select_clip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clip_id: clipId })
  });
  return res.json();
}

export async function fetchAnomalies() {
  const res = await fetch(`${API_BASE}/api/anomalies`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch anomalies");
  return res.json();
}

export async function resolveAnomaly(anomalyId: string) {
  const res = await fetch(`${API_BASE}/api/anomalies/${anomalyId}/resolve`, {
    method: "POST"
  });
  return res.json();
}

export async function fetchScenarioComparison() {
  const res = await fetch(`${API_BASE}/api/simulator/compare`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch scenario comparison");
  return res.json();
}

export async function runCustomSimulation(params: any) {
  const res = await fetch(`${API_BASE}/api/simulator/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  return res.json();
}

export async function rankOptimizations(priorities: any) {
  const res = await fetch(`${API_BASE}/api/optimizer/rank`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(priorities)
  });
  return res.json();
}

export async function fetchForecast() {
  const res = await fetch(`${API_BASE}/api/forecast/24h`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch forecast");
  return res.json();
}

export async function fetchMorningBriefing() {
  const res = await fetch(`${API_BASE}/api/advisor/briefing`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch morning briefing");
  return res.json();
}

export async function askAdvisor(query: string) {
  const res = await fetch(`${API_BASE}/api/advisor/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });
  return res.json();
}

export async function toggleDemoFault(faultId: string, active: boolean) {
  const res = await fetch(`${API_BASE}/api/demo/set_fault`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fault_id: faultId, active })
  });
  return res.json();
}

export async function fetchEquipmentPassports() {
  const res = await fetch(`${API_BASE}/api/equipment/passports`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch equipment passports");
  return res.json();
}

export async function fetchExecutiveReport() {
  const res = await fetch(`${API_BASE}/api/reports/executive`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch executive report");
  return res.json();
}
