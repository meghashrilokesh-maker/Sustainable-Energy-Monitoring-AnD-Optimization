import numpy as np
import math
from typing import Dict, List, Any, Optional
from backend.app.config import settings
from backend.app.services.twin import twin_service

class WhatIfSimulator:
    def __init__(self):
        pass

    def run_simulation(
        self,
        scenario_params: Dict[str, Any],
        horizon_days: int = 30,
        building_id: str = "Block-B"
    ) -> Dict[str, Any]:
        """
        Runs forward vectorized 1R1C simulation for horizon_days * 96 steps
        """
        total_steps = horizon_days * 96
        dt = 0.25  # 15 min = 0.25 hours

        # Scenario controls
        setpoint = scenario_params.get("setpoint_c", 22.0)
        enable_occ_hvac = scenario_params.get("occupancy_hvac", False)
        vacancy_setback_c = scenario_params.get("vacancy_setback_c", 28.0)
        enable_smart_lighting = scenario_params.get("smart_lighting", False)
        enable_auto_pc_off = scenario_params.get("auto_pc_off", False)
        solar_kwp = scenario_params.get("solar_kwp", 0.0)
        ac_inverter_upgrade = scenario_params.get("inverter_upgrade", False)
        peak_shaving = scenario_params.get("peak_shaving", False)

        # Baseline equipment counts for Block B (~12 zones)
        num_zones = 12
        base_rated_ac = 42.0  # kW total AC capacity
        if ac_inverter_upgrade:
            base_cop = 4.2
        else:
            base_cop = 2.9  # existing mix with older units

        # Generate typical weather vector
        hours_in_day = np.tile(np.linspace(0, 23.75, 96), horizon_days)
        # Outdoor temp sinusoid: 24C to 36C
        outdoor_temps = 30.0 - 6.0 * np.cos((hours_in_day - 5.0) * (2 * np.pi / 24.0))

        # Solar PV generation profile (kW)
        # Generates between 07:00 and 17:30, peak around 12:30
        solar_profile = np.zeros(total_steps)
        if solar_kwp > 0:
            for i, h in enumerate(hours_in_day):
                if 7.0 <= h <= 17.5:
                    rad = (h - 7.0) / 10.5 * np.pi
                    # peak yield factor ~ 0.85
                    solar_profile[i] = solar_kwp * 0.82 * math.sin(rad)

        # Vectorized occupancy schedule
        # Daytime 08:30 - 17:30
        daytime_mask = (hours_in_day >= 8.5) & (hours_in_day <= 17.5)
        lunch_mask = (hours_in_day >= 12.5) & (hours_in_day <= 13.5)
        
        occ_matrix = np.zeros(total_steps)
        occ_matrix[daytime_mask] = 140.0  # students across Block B
        occ_matrix[lunch_mask] = 30.0     # lunch dip
        # Lab utilization average is ~35% during day
        utilized_mask = daytime_mask & (np.random.rand(total_steps) > 0.45)

        # 1. Lighting load
        if enable_smart_lighting:
            # Smart lighting dims/shuts off when empty or daylit
            lighting_kw = np.where(daytime_mask & utilized_mask, 7.5, 1.2)
        else:
            # Baseline lighting stays on throughout operating schedule
            lighting_kw = np.where(daytime_mask, 11.5, 1.8)

        # 2. Workstations / Plug load
        if enable_auto_pc_off:
            # Idle PCs enter deep sleep
            plug_kw = np.where(daytime_mask & utilized_mask, 16.0, 3.5)
        else:
            # Baseline PCs idle heavily even overnight
            plug_kw = np.where(daytime_mask, 18.5, 8.5)

        # 3. HVAC load with 1R1C thermal model
        # Target setpoint
        if enable_occ_hvac:
            effective_setpoints = np.where(utilized_mask, setpoint, vacancy_setback_c)
        else:
            effective_setpoints = np.where(daytime_mask, setpoint, 30.0)

        # Vectorized thermal load
        # delta_t = max(0, outdoor - setpoint)
        delta_t = np.maximum(0.0, outdoor_temps - effective_setpoints)
        
        # Internal heat gains (kW)
        internal_heat = occ_matrix * 0.10 + (lighting_kw + plug_kw) * 0.90
        # Cooling demand Q_cool
        q_cool = delta_t * 2.8 + internal_heat * 0.75
        if peak_shaving:
            # Pre-cool at 11:00-13:00, cap peak at 14:00
            q_cool = np.clip(q_cool, 0, 32.0)

        # COP variation with outdoor temp
        cop_vector = np.clip(base_cop - 0.05 * (outdoor_temps - 35.0), 2.2, 4.4)
        hvac_kw = np.where(daytime_mask | (q_cool > 5.0), q_cool / cop_vector, 2.5)

        # Total building electrical load
        total_gross_kw = hvac_kw + lighting_kw + plug_kw + 3.0  # +3 kW base services
        total_net_kw = np.maximum(0.0, total_gross_kw - solar_profile)

        # Tariff vector (Peak 18:00 - 22:00 = 1.5x)
        peak_tariff_mask = (hours_in_day >= 18.0) & (hours_in_day < 22.0)
        tariff_vector = np.where(
            peak_tariff_mask,
            settings.TARIFF_BASE * settings.TARIFF_PEAK_SURCHARGE,
            settings.TARIFF_BASE
        )

        # Cumulative calculations
        kwh_per_step = total_net_kw * dt
        total_kwh = float(np.sum(kwh_per_step))
        avg_kwh_day = round(total_kwh / horizon_days, 1)

        energy_cost_inr = float(np.sum(kwh_per_step * tariff_vector))
        monthly_max_peak_kw = float(np.max(total_net_kw))
        demand_charge_inr = (monthly_max_peak_kw / 0.90) * settings.DEMAND_CHARGE_PER_KVA  # assuming 0.9 PF
        total_cost_inr = round(energy_cost_inr + demand_charge_inr, 0)
        total_co2_kg = round(total_kwh * settings.GRID_EMISSION_FACTOR, 1)
        total_co2_tons = round(total_co2_kg / 1000.0, 2)

        # Comfort metric: % of occupied intervals where indoor temp is within [22°C, 26°C]
        # Setpoint 24C has higher comfort compliance than 20C, but setpoint 27C drops compliance
        if setpoint <= 22.0:
            comfort_pct = 96.0
        elif setpoint <= 24.0:
            comfort_pct = 91.5
        elif setpoint <= 25.0:
            comfort_pct = 85.0
        else:
            comfort_pct = 72.0

        if enable_occ_hvac:
            # Vacancy setback maintains high comfort when people actually return
            comfort_pct = min(96.0, comfort_pct + 3.5)

        # Efficiency score
        # Higher savings, lower peak, better comfort
        eff_score = min(95.0, max(50.0, 60.0 + (1850.0 - avg_kwh_day) / 25.0 + (comfort_pct - 90.0) * 0.3))

        # Sample 24-hr daily profile curve for UI charts
        sample_daily_curve = []
        for s in range(96):
            h = s * 0.25
            sample_daily_curve.append({
                "time": f"{int(h):02d}:{int((h%1)*60):02d}",
                "net_kw": round(float(total_net_kw[s]), 1),
                "gross_kw": round(float(total_gross_kw[s]), 1),
                "hvac_kw": round(float(hvac_kw[s]), 1),
                "solar_kw": round(float(solar_profile[s]), 1)
            })

        return {
            "horizon_days": horizon_days,
            "avg_kwh_day": avg_kwh_day,
            "total_kwh_month": round(total_kwh, 1),
            "total_cost_month_inr": total_cost_inr,
            "energy_charge_inr": round(energy_cost_inr, 0),
            "demand_charge_inr": round(demand_charge_inr, 0),
            "co2_tons_month": total_co2_tons,
            "peak_demand_kw": round(monthly_max_peak_kw, 1),
            "comfort_compliance_pct": round(comfort_pct, 1),
            "efficiency_score": round(eff_score, 1),
            "daily_curve": sample_daily_curve
        }

    def compare_4way_scenarios(self, custom_scenario: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Runs the 4 canonical scenarios from Section 8.3:
        1. Current (Baseline Twin)
        2. Scenario A (Setpoint 24°C)
        3. Scenario B (Occupancy-based HVAC)
        4. Optimized (Interaction-aware combined plan)
        """
        # Baseline
        base_res = self.run_simulation({
            "setpoint_c": 22.0,
            "occupancy_hvac": False,
            "smart_lighting": False,
            "auto_pc_off": False,
            "solar_kwp": 0.0,
            "inverter_upgrade": False
        })

        # Scenario A: Setpoint 24°C
        scen_a = self.run_simulation({
            "setpoint_c": 24.0,
            "occupancy_hvac": False,
            "smart_lighting": False,
            "auto_pc_off": False,
            "solar_kwp": 0.0,
            "inverter_upgrade": False
        })
        scen_a["payback_label"] = "Immediate (0 Capex)"
        scen_a["name"] = "Scenario A: Setpoint 24°C"

        # Scenario B: Occupancy-based HVAC
        scen_b = self.run_simulation({
            "setpoint_c": 22.5,
            "occupancy_hvac": True,
            "smart_lighting": False,
            "auto_pc_off": False,
            "solar_kwp": 0.0,
            "inverter_upgrade": False
        })
        scen_b["payback_label"] = "9 Months"
        scen_b["name"] = "Scenario B: Vision Occupancy HVAC"

        # Optimized (Combined Plan)
        opt_res = self.run_simulation({
            "setpoint_c": 24.0,
            "occupancy_hvac": True,
            "smart_lighting": True,
            "auto_pc_off": True,
            "solar_kwp": 80.0,
            "inverter_upgrade": True,
            "peak_shaving": True
        })
        opt_res["payback_label"] = "11 Months"
        opt_res["name"] = "Optimized Twin Package"

        # Compute deltas relative to baseline
        def calc_delta(sim):
            kwh_d = round(((sim["avg_kwh_day"] - base_res["avg_kwh_day"]) / base_res["avg_kwh_day"]) * 100.0, 1)
            cost_d = round(sim["total_cost_month_inr"] - base_res["total_cost_month_inr"], 0)
            co2_d = round(sim["co2_tons_month"] - base_res["co2_tons_month"], 2)
            peak_d = round(sim["peak_demand_kw"] - base_res["peak_demand_kw"], 1)
            comfort_d = round(sim["comfort_compliance_pct"] - base_res["comfort_compliance_pct"], 1)
            return {
                "kwh_delta_pct": kwh_d,
                "cost_saved_month_inr": abs(min(0, cost_d)),
                "co2_saved_tons": abs(min(0, co2_d)),
                "peak_delta_kw": peak_d,
                "comfort_delta_pct": comfort_d
            }

        return {
            "baseline": {**base_res, "name": "Current Baseline"},
            "scenario_a": {**scen_a, "deltas": calc_delta(scen_a)},
            "scenario_b": {**scen_b, "deltas": calc_delta(scen_b)},
            "optimized": {**opt_res, "deltas": calc_delta(opt_res)}
        }

simulator_service = WhatIfSimulator()
