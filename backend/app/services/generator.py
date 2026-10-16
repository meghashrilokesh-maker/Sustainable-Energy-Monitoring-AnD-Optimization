import math
import random
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional
from backend.app.services.twin import twin_service
from backend.app.config import settings

class SyntheticDataGenerator:
    def __init__(self):
        self.active_faults = {
            "F1": True,   # F1 Empty-room conditioning in B-204 (Demo primary hook)
            "F2": False,  # F2 After-hours load in B-207
            "F3": False,  # F3 Conditioning with window open
            "F4": True,   # F4 Compressor degradation in B-207
            "F5": False   # F5 Sensor flatline / CV mismatch
        }
        self.time_offset_minutes = 0.0
        self.speed_multiplier = 1.0  # 1s real = 1s, or 10s, 60s
        self.demo_mode = "DEFAULT"

    def get_outdoor_temperature(self, hour: float, day_offset: int = 0) -> float:
        # Min 24°C at 05:00, max 36°C at 14:30
        # Peak at 14.5, trough at 5.0
        rad = (hour - 5.0) * (2 * math.pi / 24.0)
        temp = 30.0 - 6.0 * math.cos(rad)
        # Small noise
        noise = math.sin((hour * 7.3) + day_offset) * 0.4
        return round(temp + noise, 1)

    def get_base_occupancy(self, zone_id: str, hour: float, is_weekend: bool) -> int:
        if is_weekend:
            # Low occasional weekend research occupancy
            return random.choice([0, 0, 0, 1, 2]) if 10 <= hour <= 16 else 0

        # Weekday schedule
        if hour < 8.0 or hour >= 18.5:
            return 0
        
        # Lunch dip 12:30 - 13:30
        if 12.5 <= hour <= 13.5:
            return random.randint(2, 6)

        # Class slots
        if "lab" in zone_id.lower() or "B-204" in zone_id or "B-101" in zone_id or "B-207" in zone_id:
            # Labs usually have 20-30 students when active
            if (9.0 <= hour <= 12.5) or (13.5 <= hour <= 17.0):
                return random.randint(22, 28)
            return random.randint(3, 8)
        elif "classroom" in zone_id.lower():
            if (8.5 <= hour <= 12.5) or (13.5 <= hour <= 16.5):
                return random.randint(35, 55)
            return 0
        else:
            # Office or library
            return random.randint(8, 18)

    def generate_zone_tick(
        self,
        zone_id: str,
        sim_time: datetime
    ) -> Dict[str, Any]:
        hour = sim_time.hour + (sim_time.minute / 60.0)
        is_weekend = sim_time.weekday() >= 5
        outdoor_t = self.get_outdoor_temperature(hour)
        is_operating = (8.0 <= hour <= 18.0) and not is_weekend

        # Default physics states
        base_occ = self.get_base_occupancy(zone_id, hour, is_weekend)
        vacant_sec = 0 if base_occ > 0 else 1800

        # Normal equipment states
        cv_equip = {
            "hvac": "COOLING" if (base_occ > 0 and outdoor_t > 25.0) else "IDLE",
            "lights": "ON" if (base_occ > 0 and is_operating) else "OFF",
            "pcs_on": min(base_occ, 28) if (base_occ > 0) else 0,
            "fan": "ON" if base_occ > 10 else "OFF",
            "window": "CLOSED"
        }
        
        measured_kw = 0.5
        measured_temp = 23.2
        quality_flag = "NORMAL"

        # Apply normal load based on zone
        if base_occ > 0:
            measured_kw = 0.6 + (base_occ * 0.08) + (2.2 if outdoor_t > 28.0 else 1.2)
        else:
            measured_kw = 0.45

        # Query Vision Monitoring ground-truth observation for THIS specific zone
        vision_obs = None
        try:
            from backend.app.services.cv_service import cv_service
            vision_obs = cv_service.get_active_observation_for_zone(zone_id)
        except Exception:
            vision_obs = None

        if vision_obs is not None:
            base_occ = vision_obs["person_count"]
            vacant_sec = vision_obs["vacant_seconds"]
            # Apply vision-observed equipment states (lights, pcs, fan, window)
            for eq_k, eq_v in vision_obs.get("equipment_states", {}).items():
                cv_equip[eq_k] = eq_v

            # Adjust electrical baseline based on vision ground truth occupancy
            if base_occ > 0:
                measured_kw = 0.6 + (base_occ * 0.08) + (2.2 if outdoor_t > 28.0 else 1.2)
            else:
                measured_kw = 0.45

        # ==================== FAULT INJECTIONS ====================
        # F1: Empty-room conditioning in B-204 (The key demo story!)
        if zone_id == "B-204" and self.active_faults.get("F1"):
            # CV detects ZERO people, but AC is blazing at 3.1 kW, lights ON, 17 PCs ON!
            base_occ = 0
            vacant_sec = vision_obs.get("vacant_seconds", 3120) if (vision_obs and vision_obs.get("clip_id") == "b204_vacant_cooling_clip") else 3120
            cv_equip = {
                "hvac": "COOLING",
                "lights": "ON",
                "pcs_on": 17,
                "fan": "OFF",
                "window": "CLOSED"
            }
            # Measured power is 3.4 kW (AC ~ 3.1 kW + PCs ~ 1.4 kW standby/idle - high draw)
            measured_kw = 3.42 + random.uniform(-0.08, 0.08)
            measured_temp = 21.8  # overcooled
            # Expected will be calculated as ~0.6 kW by Twin -> UL = 2.8 kW!

        # F2: After-hours load in B-207
        if zone_id == "B-207" and self.active_faults.get("F2") and not is_operating:
            base_occ = 0
            vacant_sec = 14400
            cv_equip = {
                "hvac": "COOLING",
                "lights": "ON",
                "pcs_on": 20,
                "fan": "ON",
                "window": "CLOSED"
            }
            measured_kw = 2.65 + random.uniform(-0.05, 0.05)

        # F3: Window open while conditioning
        if zone_id == "B-204" and self.active_faults.get("F3"):
            cv_equip["window"] = "OPEN"
            measured_kw += 1.6  # compressor working harder due to infiltration

        # F4: Compressor degradation in B-207
        if zone_id == "B-207" and self.active_faults.get("F4") and cv_equip["hvac"] == "COOLING":
            # degraded COP causes +25% compressor power draw
            measured_kw += 0.85

        # F5: Sensor flatline / CV disagreement
        if zone_id == "B-101" and self.active_faults.get("F5"):
            quality_flag = "DEGRADED"
            measured_kw = 0.15  # meter reads abnormally low while CV sees 25 people

        # Run twin reconciliation
        reconciled = twin_service.reconcile_zone_state(
            zone_id=zone_id,
            measured_kw=round(measured_kw, 2),
            measured_temp_c=round(measured_temp, 1),
            cv_person_count=base_occ,
            cv_vacant_seconds=vacant_sec,
            cv_equipment_states=cv_equip,
            outdoor_temp_c=outdoor_t,
            hour_of_day=hour,
            is_operating_hours=is_operating,
            data_quality_flag=quality_flag
        )
        return reconciled

    def generate_live_campus_tick(self) -> Dict[str, Any]:
        now = datetime.now(timezone.utc) + timedelta(minutes=self.time_offset_minutes)
        all_zones = []
        for zone_id in twin_service.zones.keys():
            z_state = self.generate_zone_tick(zone_id, now)
            all_zones.append(z_state)
        
        block_b_agg = twin_service.get_building_aggregates("Block-B")
        block_a_agg = twin_service.get_building_aggregates("Block-A")

        total_kw = (block_b_agg.get("measured_kw", 0) + block_a_agg.get("measured_kw", 0))
        expected_kw = (block_b_agg.get("expected_kw", 0) + block_a_agg.get("expected_kw", 0))
        unexplained_kw = (block_b_agg.get("unexplained_kw", 0) + block_a_agg.get("unexplained_kw", 0))

        # Recoverable waste in ₹/day = Unexplained kW * 24 hours * ₹8.50/kWh (or blended tariff)
        recoverable_inr_day = round(unexplained_kw * 24.0 * settings.TARIFF_BASE, 0)
        # Carbon impact in kg CO2/day
        recoverable_co2_day = round(unexplained_kw * 24.0 * settings.GRID_EMISSION_FACTOR, 1)

        return {
            "timestamp": now.isoformat(),
            "time_formatted": now.strftime("%H:%M:%S"),
            "outdoor_temp_c": self.get_outdoor_temperature(now.hour + now.minute/60.0),
            "site_totals": {
                "measured_kw": round(total_kw, 2),
                "expected_kw": round(expected_kw, 2),
                "unexplained_kw": round(unexplained_kw, 2),
                "recoverable_inr_day": recoverable_inr_day,
                "recoverable_co2_day": recoverable_co2_day,
                "contracted_demand_kw": settings.CONTRACTED_DEMAND_KW,
                "overall_efficiency_score": round((block_b_agg.get("efficiency_score", 70) * 0.65 + block_a_agg.get("efficiency_score", 85) * 0.35), 1)
            },
            "buildings": {
                "Block-B": block_b_agg,
                "Block-A": block_a_agg
            },
            "zones": all_zones,
            "active_faults": self.active_faults
        }

    def get_historical_day_series(self, days_ago: int = 0) -> List[Dict[str, Any]]:
        """
        Generates 96 time-steps (15 min) for a full 24-hour day profile
        """
        base_date = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days_ago)
        series = []
        
        # Cumulative energy trackers
        cum_kwh_measured = 0.0
        cum_kwh_expected = 0.0

        for step in range(96):
            step_time = base_date + timedelta(minutes=step * 15)
            hour = step_time.hour + (step_time.minute / 60.0)
            outdoor_t = self.get_outdoor_temperature(hour, day_offset=days_ago)
            is_operating = (8.0 <= hour <= 18.0) and (step_time.weekday() < 5)

            # Block B diurnal load pattern
            if is_operating:
                # Bell curve centered around 14:15
                load_factor = math.exp(-((hour - 14.2) ** 2) / 16.0)
                measured_b = 85.0 + load_factor * 145.0 + random.uniform(-4.0, 4.0)
                # Expected baseline
                expected_b = 75.0 + load_factor * 125.0
            else:
                # Overnight baseline
                measured_b = 32.0 + random.uniform(-2.0, 2.0)
                expected_b = 26.0

            # If F1 / F4 active, add persistent unexplained load
            if self.active_faults.get("F1"):
                measured_b += 8.5  # persistent waste across labs
            if self.active_faults.get("F4"):
                measured_b += 4.2

            unexplained_b = max(0.0, measured_b - expected_b)
            step_kwh_m = measured_b * 0.25
            step_kwh_e = expected_b * 0.25
            cum_kwh_measured += step_kwh_m
            cum_kwh_expected += step_kwh_e

            # Peak tariff applies 18:00 - 22:00
            tariff = settings.TARIFF_BASE * (settings.TARIFF_PEAK_SURCHARGE if (18.0 <= hour < 22.0) else 1.0)
            cost_inr = step_kwh_m * tariff

            series.append({
                "timestamp": step_time.isoformat(),
                "time": step_time.strftime("%H:%M"),
                "hour": hour,
                "outdoor_temp_c": outdoor_t,
                "measured_kw": round(measured_b, 1),
                "expected_kw": round(expected_b, 1),
                "unexplained_kw": round(unexplained_b, 1),
                "hvac_kw": round(measured_b * 0.52, 1),
                "lighting_kw": round(measured_b * 0.14, 1),
                "plug_kw": round(measured_b * 0.24, 1),
                "other_kw": round(measured_b * 0.10, 1),
                "cum_kwh": round(cum_kwh_measured, 1),
                "cost_inr": round(cost_inr, 1),
                "co2_kg": round(step_kwh_m * settings.GRID_EMISSION_FACTOR, 2)
            })

        return series

generator_service = SyntheticDataGenerator()
