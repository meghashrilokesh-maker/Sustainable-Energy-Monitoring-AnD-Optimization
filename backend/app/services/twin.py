import json
import os
import math
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
from backend.app.config import settings

class DigitalTwinService:
    def __init__(self):
        self.data_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data")
        self.zones: Dict[str, Any] = {}
        self.equipment: Dict[str, Any] = {}
        self.zone_states: Dict[str, Any] = {}
        self.history_snapshots: List[Dict[str, Any]] = []
        self.load_metadata()
        self.init_states()

    def load_metadata(self):
        zones_path = os.path.join(self.data_dir, "zones.json")
        equip_path = os.path.join(self.data_dir, "equipment.json")
        
        if os.path.exists(zones_path):
            with open(zones_path, "r", encoding="utf-8") as f:
                zones_list = json.load(f)
                self.zones = {z["id"]: z for z in zones_list}
        
        if os.path.exists(equip_path):
            with open(equip_path, "r", encoding="utf-8") as f:
                equip_list = json.load(f)
                self.equipment = {e["id"]: e for e in equip_list}

    def init_states(self):
        now = datetime.now(timezone.utc).isoformat()
        for zone_id, zone in self.zones.items():
            self.zone_states[zone_id] = {
                "zone_id": zone_id,
                "name": zone["name"],
                "building_id": zone["building_id"],
                "floor": zone["floor"],
                "type": zone["type"],
                "area_m2": zone["area_m2"],
                "occupancy": 0,
                "vacant_seconds": 0,
                "temp_c": 23.5,
                "outdoor_temp_c": 31.0,
                "setpoint_c": 22.0,
                "rh_pct": 52.0,
                "co2_ppm": 420.0,
                "measured_kw": 0.5,
                "expected_kw": 0.5,
                "unexplained_kw": 0.0,
                "category_breakdown": {
                    "hvac": 0.2,
                    "lighting": 0.1,
                    "plug_loads": 0.2,
                    "other": 0.0
                },
                "equipment_states": {
                    "hvac": "IDLE",
                    "lights": "OFF",
                    "pcs_on": 0,
                    "fan": "OFF",
                    "window": "CLOSED"
                },
                "data_quality": "NORMAL",
                "confidence": 0.95,
                "last_updated": now
            }

    def calculate_cop(self, rated_cop: float, outdoor_temp_c: float) -> float:
        # COP = rated - 0.05 * (T_out - 35), clipped to [2.2, 4.4]
        cop = rated_cop - 0.05 * (outdoor_temp_c - 35.0)
        return max(2.2, min(4.4, cop))

    def compute_expected_power(
        self,
        zone_id: str,
        occupancy: int,
        outdoor_temp_c: float,
        is_scheduled: bool,
        comfort_setpoint: float = 23.0,
        window_open: bool = False
    ) -> Dict[str, float]:
        zone = self.zones.get(zone_id)
        if not zone:
            return {"expected_kw": 0.5, "hvac": 0.2, "lighting": 0.1, "plug": 0.2}

        # Find zone equipment
        zone_equip = [e for e in self.equipment.values() if e.get("zone_id") == zone_id]
        ac_units = [e for e in zone_equip if e.get("type") == "AC"]
        light_units = [e for e in zone_equip if e.get("type") == "LIGHT"]
        pc_units = [e for e in zone_equip if e.get("type") == "PC"]

        # 1. Expected Lighting
        if occupancy > 0 and is_scheduled:
            expected_lighting = sum(l.get("rated_kw", 0.6) for l in light_units) or 0.6
        else:
            expected_lighting = 0.0

        # 2. Expected Plug loads
        if occupancy > 0 and is_scheduled:
            # Active PCs roughly proportional to people present (capped by total units)
            total_pcs = pc_units[0].get("count", 25) if pc_units else 20
            active_pcs = min(occupancy, total_pcs)
            standby_pcs = total_pcs - active_pcs
            active_w = pc_units[0].get("active_w_per_unit", 85) if pc_units else 85
            standby_w = pc_units[0].get("standby_w_per_unit", 8) if pc_units else 8
            expected_plug = (active_pcs * active_w + standby_pcs * standby_w) / 1000.0
        else:
            total_pcs = pc_units[0].get("count", 25) if pc_units else 20
            standby_w = pc_units[0].get("standby_w_per_unit", 8) if pc_units else 8
            expected_plug = (total_pcs * standby_w) / 1000.0

        # 3. Expected HVAC
        if (occupancy > 0 or is_scheduled) and outdoor_temp_c > 24.0:
            # 1R1C heat gain:
            # Q_people: 100W per person
            q_people = occupancy * 0.10
            # Q_equip: 90% of electrical power becomes heat
            q_equip = (expected_lighting + expected_plug) * 0.90
            # Q_envelope: (T_out - T_set) / R
            r_val = zone.get("thermal_R", 0.045)
            delta_t = max(0.0, outdoor_temp_c - comfort_setpoint)
            # R is in K/kW so Q = delta_t / R in kW
            q_envelope = (delta_t * 0.08)  # normalized envelope conductance
            
            q_cool_needed = q_people + q_equip + q_envelope
            rated_cop = ac_units[0].get("cop", 3.2) if ac_units else 3.2
            cop = self.calculate_cop(rated_cop, outdoor_temp_c)
            rated_ac_kw = ac_units[0].get("rated_kw", 3.2) if ac_units else 3.2
            expected_hvac = min(rated_ac_kw, max(0.4, q_cool_needed / cop))
        else:
            # If unoccupied or cool outside, HVAC should be idle/standby
            expected_hvac = 0.15  # standby/fan trickle only

        expected_total = expected_lighting + expected_plug + expected_hvac
        return {
            "expected_kw": round(expected_total, 3),
            "hvac": round(expected_hvac, 3),
            "lighting": round(expected_lighting, 3),
            "plug": round(expected_plug, 3)
        }

    def reconcile_zone_state(
        self,
        zone_id: str,
        measured_kw: float,
        measured_temp_c: float,
        cv_person_count: int,
        cv_vacant_seconds: int,
        cv_equipment_states: Dict[str, Any],
        outdoor_temp_c: float,
        hour_of_day: float,
        is_operating_hours: bool,
        data_quality_flag: str = "NORMAL"
    ) -> Dict[str, Any]:
        """
        Calculates Unexplained Load (UL) = Measured - Twin Expected Power(given CV reality)
        """
        zone = self.zones[zone_id]
        expected_dict = self.compute_expected_power(
            zone_id=zone_id,
            occupancy=cv_person_count,
            outdoor_temp_c=outdoor_temp_c,
            is_scheduled=is_operating_hours,
            comfort_setpoint=22.5,
            window_open=(cv_equipment_states.get("window") == "OPEN")
        )

        expected_kw = expected_dict["expected_kw"]
        # Unexplained load is measured minus expected baseline
        # Allow tiny normal noise ±0.05 kW
        raw_ul = measured_kw - expected_kw
        unexplained_kw = max(0.0, round(raw_ul, 3)) if raw_ul > 0.12 else 0.0

        # Thermal observer update
        # Observed temp smooths towards measured temp
        prev_state = self.zone_states.get(zone_id, {})
        prev_temp = prev_state.get("temp_c", measured_temp_c)
        filtered_temp = round(prev_temp * 0.3 + measured_temp_c * 0.7, 1)

        # Break down measured power proportionally with observed equipment
        # or use meter-assisted telemetry
        measured_hvac = round(max(0.0, measured_kw - (expected_dict["lighting"] + expected_dict["plug"])), 2)
        if cv_equipment_states.get("lights") == "ON":
            measured_light = expected_dict["lighting"] or 0.5
        else:
            measured_light = 0.0
        
        pcs_on = cv_equipment_states.get("pcs_on", 0)
        measured_plug = round(max(0.1, pcs_on * 0.085), 2)
        measured_other = max(0.0, round(measured_kw - (measured_hvac + measured_light + measured_plug), 2))

        updated_state = {
            "zone_id": zone_id,
            "name": zone["name"],
            "building_id": zone["building_id"],
            "floor": zone["floor"],
            "type": zone["type"],
            "area_m2": zone["area_m2"],
            "occupancy": cv_person_count,
            "vacant_seconds": cv_vacant_seconds,
            "temp_c": filtered_temp,
            "outdoor_temp_c": outdoor_temp_c,
            "setpoint_c": 22.0,
            "rh_pct": round(50.0 + math.sin(hour_of_day * 0.5) * 8.0, 1),
            "co2_ppm": round(410.0 + cv_person_count * 25.0, 1),
            "measured_kw": round(measured_kw, 2),
            "expected_kw": round(expected_kw, 2),
            "unexplained_kw": round(unexplained_kw, 2),
            "category_breakdown": {
                "hvac": measured_hvac,
                "lighting": measured_light,
                "plug_loads": measured_plug,
                "other": measured_other
            },
            "equipment_states": cv_equipment_states,
            "data_quality": data_quality_flag,
            "confidence": 0.94 if data_quality_flag == "NORMAL" else 0.65,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }

        self.zone_states[zone_id] = updated_state
        return updated_state

    def get_zone_state(self, zone_id: str) -> Optional[Dict[str, Any]]:
        return self.zone_states.get(zone_id)

    def get_all_zone_states(self) -> List[Dict[str, Any]]:
        return list(self.zone_states.values())

    def get_building_aggregates(self, building_id: str = "Block-B") -> Dict[str, Any]:
        building_zones = [z for z in self.zone_states.values() if z["building_id"] == building_id]
        if not building_zones:
            return {}

        measured_total = sum(z["measured_kw"] for z in building_zones)
        expected_total = sum(z["expected_kw"] for z in building_zones)
        unexplained_total = sum(z["unexplained_kw"] for z in building_zones)
        total_occupancy = sum(z["occupancy"] for z in building_zones)
        
        hvac_total = sum(z["category_breakdown"]["hvac"] for z in building_zones)
        lighting_total = sum(z["category_breakdown"]["lighting"] for z in building_zones)
        plug_total = sum(z["category_breakdown"]["plug_loads"] for z in building_zones)
        other_total = sum(z["category_breakdown"]["other"] for z in building_zones)

        ul_ratio = (unexplained_total / measured_total) if measured_total > 0 else 0.0
        # Efficiency Score (0 - 100 ring):
        # 100 * (0.35 * (1 - UL_ratio) + 0.25 * util_align + 0.20 * peak_fac + 0.10 * comfort + 0.10 * equip_eff)
        eff_score = max(20.0, min(100.0, 100.0 * (1.0 - ul_ratio * 0.85)))

        return {
            "building_id": building_id,
            "zone_count": len(building_zones),
            "total_occupancy": total_occupancy,
            "measured_kw": round(measured_total, 2),
            "expected_kw": round(expected_total, 2),
            "unexplained_kw": round(unexplained_total, 2),
            "ul_ratio_pct": round(ul_ratio * 100.0, 1),
            "efficiency_score": round(eff_score, 1),
            "breakdown_kw": {
                "hvac": round(hvac_total, 2),
                "lighting": round(lighting_total, 2),
                "plug_loads": round(plug_total, 2),
                "other": round(other_total, 2)
            },
            "breakdown_pct": {
                "hvac": round((hvac_total / measured_total) * 100.0 if measured_total > 0 else 52.0, 1),
                "lighting": round((lighting_total / measured_total) * 100.0 if measured_total > 0 else 14.0, 1),
                "plug_loads": round((plug_total / measured_total) * 100.0 if measured_total > 0 else 24.0, 1),
                "other": round((other_total / measured_total) * 100.0 if measured_total > 0 else 10.0, 1)
            }
        }

twin_service = DigitalTwinService()
