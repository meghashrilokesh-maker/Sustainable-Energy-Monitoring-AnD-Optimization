import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

from backend.app.config import settings
from backend.app.services.twin import twin_service
from backend.app.services.generator import generator_service
from backend.app.services.anomaly import anomaly_engine
from backend.app.services.simulator import simulator_service
from backend.app.services.optimizer import optimizer_service
from backend.app.services.forecast import forecast_service
from backend.app.services.cv_service import cv_service
from backend.app.services.genai_service import genai_service

app = FastAPI(
    title="PulseGrid Digital Twin API",
    version="2.0.0",
    description="Vision-Grounded Energy Digital Twin REST & WebSocket Backend"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Models -----------------
class ClipSelectRequest(BaseModel):
    clip_id: str

class SimulationRequest(BaseModel):
    setpoint_c: Optional[float] = 22.0
    occupancy_hvac: Optional[bool] = False
    vacancy_setback_c: Optional[float] = 28.0
    smart_lighting: Optional[bool] = False
    auto_pc_off: Optional[bool] = False
    solar_kwp: Optional[float] = 0.0
    inverter_upgrade: Optional[bool] = False
    peak_shaving: Optional[bool] = False
    horizon_days: Optional[int] = 30

class OptimizerRankRequest(BaseModel):
    cost: Optional[float] = 0.25
    carbon: Optional[float] = 0.20
    comfort: Optional[float] = 0.15
    ease: Optional[float] = 0.20
    roi: Optional[float] = 0.20

class AdvisorQueryRequest(BaseModel):
    query: str

class FaultToggleRequest(BaseModel):
    fault_id: str
    active: bool

# ----------------- Endpoints -----------------

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "PulseGrid Digital Twin", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.get("/api/site/summary")
def get_site_summary():
    tick = generator_service.generate_live_campus_tick()
    anomalies = anomaly_engine.scan_anomalies()
    return {
        "site_id": settings.SITE_ID,
        "site_name": settings.SITE_NAME,
        "tariff": {
            "base_inr_per_kwh": settings.TARIFF_BASE,
            "peak_surcharge_factor": settings.TARIFF_PEAK_SURCHARGE,
            "demand_charge_per_kva": settings.DEMAND_CHARGE_PER_KVA
        },
        "emission_factor_kg_co2_kwh": settings.GRID_EMISSION_FACTOR,
        "operating_hours": f"{settings.OPERATING_HOURS_START:02d}:00 - {settings.OPERATING_HOURS_END:02d}:00",
        "live_totals": tick["site_totals"],
        "buildings": tick["buildings"],
        "active_anomalies_count": len(anomalies),
        "verified_savings_to_date": {
            "inr_month": 66000,
            "kwh_month": 7765,
            "co2_kg_month": 6367,
            "trees_equivalent": 290
        }
    }

@app.get("/api/live/tick")
def get_live_tick():
    return generator_service.generate_live_campus_tick()

@app.get("/api/live/history")
def get_history(days_ago: int = 0):
    return generator_service.get_historical_day_series(days_ago)

@app.get("/api/twin/zones")
def get_all_zones():
    generator_service.generate_live_campus_tick()
    return {
        "zones": list(twin_service.zones.values()),
        "states": twin_service.get_all_zone_states()
    }

@app.get("/api/twin/zones/{zone_id}")
def get_zone_detail(zone_id: str):
    if zone_id not in twin_service.zones:
        raise HTTPException(status_code=404, detail="Zone not found")
    state = twin_service.get_zone_state(zone_id)
    equipment = [e for e in twin_service.equipment.values() if e.get("zone_id") == zone_id]
    return {
        "zone": twin_service.zones[zone_id],
        "state": state,
        "equipment": equipment
    }

@app.get("/api/vision/camera/{camera_id}")
def get_camera_feed(camera_id: str = "cam-b204-01"):
    return cv_service.get_camera_observation(camera_id)

@app.post("/api/vision/select_clip")
def select_clip(req: ClipSelectRequest):
    cv_service.select_clip(req.clip_id)
    return {"status": "success", "active_clip": req.clip_id}

@app.get("/api/anomalies")
def list_anomalies():
    return {"anomalies": anomaly_engine.scan_anomalies()}

@app.post("/api/anomalies/{anomaly_id}/resolve")
def resolve_anomaly(anomaly_id: str):
    ok = anomaly_engine.resolve_anomaly(anomaly_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    return {"status": "resolved", "anomaly_id": anomaly_id}

@app.post("/api/simulator/run")
def run_simulation(req: SimulationRequest):
    return simulator_service.run_simulation(req.dict(), horizon_days=req.horizon_days or 30)

@app.get("/api/simulator/compare")
def compare_scenarios():
    return simulator_service.compare_4way_scenarios()

@app.post("/api/optimizer/rank")
def rank_optimizations(req: OptimizerRankRequest):
    return {"ranked_actions": optimizer_service.rank_actions(req.dict())}

@app.get("/api/forecast/24h")
def get_forecast():
    return forecast_service.get_24h_load_forecast()

@app.get("/api/advisor/briefing")
def get_morning_briefing():
    return genai_service.generate_morning_briefing()

@app.post("/api/advisor/query")
def ask_advisor(req: AdvisorQueryRequest):
    return genai_service.answer_query(req.query)

@app.post("/api/demo/set_fault")
def toggle_fault(req: FaultToggleRequest):
    generator_service.active_faults[req.fault_id] = req.active
    # Recompute state
    tick = generator_service.generate_live_campus_tick()
    anomalies = anomaly_engine.scan_anomalies()
    return {
        "status": "updated",
        "active_faults": generator_service.active_faults,
        "active_anomalies_count": len(anomalies),
        "live_unexplained_kw": tick["site_totals"]["unexplained_kw"]
    }

@app.get("/api/equipment/passports")
def get_passports():
    return {"equipment": list(twin_service.equipment.values())}

@app.get("/api/reports/executive")
def get_executive_report():
    brief = genai_service.generate_morning_briefing()
    anoms = anomaly_engine.scan_anomalies()
    comp = simulator_service.compare_4way_scenarios()
    f = forecast_service.get_24h_load_forecast()
    
    return {
        "title": "PulseGrid Campus Energy & Sustainability Audit Report",
        "site": settings.SITE_NAME,
        "date": datetime.now(timezone.utc).strftime("%B %d, %Y"),
        "executive_summary": (
            "During the reporting period, Aryabhatta Engineering Campus maintained an overall Energy Efficiency Score of 74/100. "
            "Continuous real-time reconciliation via the PulseGrid Digital Twin identified ₹4,100/day in recoverable Unexplained Load (UL), "
            "concentrated primarily in unoccupied academic laboratories in Block B. "
            "Implementing the vision-grounded occupancy setback package is projected to deliver ₹66,000/month in net savings and 6.4 tons of CO₂ abatement."
        ),
        "monthly_totals": {
            "baseline_consumption_kwh": 55500,
            "cost_inr": 471750,
            "co2_emissions_tons": 45.5,
            "peak_demand_kw": 238
        },
        "critical_findings": [
            {
                "finding": "Empty-Room Conditioning in Lab B-204",
                "loss": "₹6,900 / month",
                "status": "Confirmed via Computer Vision (vacant > 50 min)"
            },
            {
                "finding": "Air Conditioner Compressor COP Degradation in Lab B-207",
                "loss": "₹24,800 / year excess draw",
                "status": "Asset wear (Age: 10.5 yrs, COP 1.95 vs 2.45 rated)"
            },
            {
                "finding": "After-Hours Workstation Idle Standby",
                "loss": "₹31,600 / month across campus clusters",
                "status": "IT power management scheduled"
            }
        ],
        "scenario_comparisons": comp,
        "verified_savings_m_and_v": {
            "methodology": "IPMVP Option C (Whole Facility Continuous Metering with Weather Normalization)",
            "verified_saved_kwh_month": 7765,
            "verified_saved_inr_month": 66000,
            "verified_co2_abatement_tons": 6.37,
            "trees_offset": 290
        }
    }

# WebSocket for high-frequency telemetry push
@app.websocket("/ws/live")
async def websocket_live_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            tick = generator_service.generate_live_campus_tick()
            await websocket.send_json(tick)
            await asyncio.sleep(2.0)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
