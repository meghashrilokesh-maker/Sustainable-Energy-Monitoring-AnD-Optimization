from typing import Dict, List, Any, Optional
from backend.app.services.simulator import simulator_service

class EnergyOptimizer:
    def __init__(self):
        self.action_catalog = [
            {
                "id": "A1",
                "code": "OCC_HVAC_SETBACK",
                "title": "Vision-Grounded Occupancy HVAC Setback",
                "description": "Trigger 28°C setback after 10 minutes of verified vacancy detected by cameras",
                "difficulty": 3,
                "capex_inr": 35000,
                "payback_months": 9.0,
                "saving_kwh_pct": 14.2,
                "saving_inr_month": 66000,
                "saving_co2_month_t": 6.4,
                "peak_reduction_kw": 19.0,
                "comfort_impact_pct": -1.0,
                "category": "Controls"
            },
            {
                "id": "A2",
                "code": "SETPOINT_24C",
                "title": "Thermostat Optimization (22°C → 24°C)",
                "description": "Raise campus baseline cooling setpoint from 22°C to 24°C during active hours",
                "difficulty": 1,
                "capex_inr": 0,
                "payback_months": 0.0,
                "saving_kwh_pct": 6.9,
                "saving_inr_month": 32600,
                "saving_co2_month_t": 3.1,
                "peak_reduction_kw": 14.0,
                "comfort_impact_pct": -4.8,  # noticeable comfort trade-off
                "category": "Policy"
            },
            {
                "id": "A5",
                "code": "AUTO_PC_OFF",
                "title": "Workstation & Display Deep Sleep Automation",
                "description": "Auto-hibernate computer lab workstations and laser projectors after 15 min room vacancy",
                "difficulty": 2,
                "capex_inr": 8000,
                "payback_months": 2.5,
                "saving_kwh_pct": 6.8,
                "saving_inr_month": 31600,
                "saving_co2_month_t": 3.1,
                "peak_reduction_kw": 12.0,
                "comfort_impact_pct": 0.0,
                "category": "IT Automation"
            },
            {
                "id": "A9",
                "code": "PEAK_SHAVING",
                "title": "Staggered HVAC Startup & Morning Pre-Cooling",
                "description": "Pre-cool thermal mass between 07:00-08:30 and stagger compressor starts to clip 14:15 peak",
                "difficulty": 3,
                "capex_inr": 0,
                "payback_months": 0.0,
                "saving_kwh_pct": 1.2,
                "saving_inr_month": 21000,
                "saving_co2_month_t": 0.4,
                "peak_reduction_kw": 28.0,
                "comfort_impact_pct": 0.5,
                "category": "Demand Shaving"
            },
            {
                "id": "A8",
                "code": "SOLAR_ROOFTOP_80KWP",
                "title": "80 kWp Campus Rooftop Solar PV Installation",
                "description": "Install bifacial mono-PERC rooftop solar array on Block B roof with 380 kWh/day generation",
                "difficulty": 5,
                "capex_inr": 3600000,
                "payback_months": 43.0,
                "saving_kwh_pct": 20.5,
                "saving_inr_month": 102000,
                "saving_co2_month_t": 9.6,
                "peak_reduction_kw": 35.0,
                "comfort_impact_pct": 0.0,
                "category": "Renewables"
            },
            {
                "id": "A7",
                "code": "INVERTER_AC_RETROFIT",
                "title": "Retrofit 10+ Year Degraded Split ACs in B-207",
                "description": "Replace worn Carrier units (COP 1.95) with 5-Star Daikin Inverter split units (COP 4.4)",
                "difficulty": 4,
                "capex_inr": 120000,
                "payback_months": 22.0,
                "saving_kwh_pct": 5.4,
                "saving_inr_month": 24800,
                "saving_co2_month_t": 2.4,
                "peak_reduction_kw": 8.0,
                "comfort_impact_pct": 1.5,
                "category": "Asset Upgrade"
            },
            {
                "id": "A4",
                "code": "SMART_LED_OCC",
                "title": "Smart Lighting with Daylight Harvesting",
                "description": "PIR-integrated dimmable LED fixtures with ambient daylight sensors in perimeter labs",
                "difficulty": 2,
                "capex_inr": 28000,
                "payback_months": 6.8,
                "saving_kwh_pct": 3.8,
                "saving_inr_month": 17800,
                "saving_co2_month_t": 1.7,
                "peak_reduction_kw": 4.5,
                "comfort_impact_pct": 0.0,
                "category": "Lighting"
            }
        ]

    def rank_actions(self, priorities: Optional[Dict[str, float]] = None) -> List[Dict[str, Any]]:
        """
        Computes multi-criteria score for each candidate action
        Default weights: cost=0.25, carbon=0.20, comfort=0.15, ease=0.20, roi=0.20
        """
        p = priorities or {
            "cost": 0.25,
            "carbon": 0.20,
            "comfort": 0.15,
            "ease": 0.20,
            "roi": 0.20
        }

        # Normalize weights
        total_w = sum(p.values()) or 1.0
        w_cost = p.get("cost", 0.25) / total_w
        w_carb = p.get("carbon", 0.20) / total_w
        w_comf = p.get("comfort", 0.15) / total_w
        w_ease = p.get("ease", 0.20) / total_w
        w_roi = p.get("roi", 0.20) / total_w

        ranked = []
        for a in self.action_catalog:
            # Score components [0 - 1]
            c_score = min(1.0, a["saving_inr_month"] / 100000.0)
            carb_score = min(1.0, a["saving_co2_month_t"] / 10.0)
            ease_score = max(0.0, 1.0 - (a["difficulty"] - 1.0) / 4.0)
            
            # ROI score
            if a["capex_inr"] == 0:
                roi_score = 1.0
            else:
                roi_score = min(1.0, max(0.0, 1.0 - (a["payback_months"] / 48.0)))

            # Comfort penalty: negative impact penalizes comfort score
            comfort_impact = a["comfort_impact_pct"]
            if comfort_impact < 0:
                comfort_score = max(0.0, 1.0 - abs(comfort_impact) / 6.0)
            else:
                comfort_score = 1.0

            total_score = (
                w_cost * c_score +
                w_carb * carb_score +
                w_comf * comfort_score +
                w_ease * ease_score +
                w_roi * roi_score
            )

            # Format payback label
            if a["capex_inr"] == 0:
                payback_str = "Immediate"
            elif a["payback_months"] < 12:
                payback_str = f"{int(a['payback_months'])} mo"
            else:
                payback_str = f"{round(a['payback_months']/12.0, 1)} yr"

            ranked.append({
                **a,
                "score": round(total_score, 3),
                "score_pct": int(total_score * 100),
                "payback_str": payback_str
            })

        # Sort descending
        ranked.sort(key=lambda x: x["score"], reverse=True)
        # Assign rank numbers
        for idx, item in enumerate(ranked):
            item["rank"] = idx + 1

        return ranked

optimizer_service = EnergyOptimizer()
