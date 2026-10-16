import os
import csv
import math
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

from backend.app.config import settings

class UCISimulatorService:
    def __init__(self):
        self.data_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "energydata_complete.csv")
        self.records: List[Dict[str, Any]] = []
        self.current_index: int = 0
        self.is_running: bool = True
        self.speed: float = 1.0  # 1s real = 10m sim (1 record per second at 1x)
        self.cum_kwh: float = 0.0
        self.cum_cost_inr: float = 0.0
        self.cum_co2_kg: float = 0.0
        self.history: List[Dict[str, Any]] = []
        self.max_history: int = 144  # 24 hours of 10-min records
        self.load_dataset()

    def load_dataset(self):
        if not os.path.exists(self.data_path):
            print(f"[UCISimulator] Warning: Dataset not found at {self.data_path}")
            return

        try:
            with open(self.data_path, "r", encoding="utf-8") as f:
                reader = csv.reader(f)
                header = next(reader, None)
                if not header:
                    return

                for row in reader:
                    if len(row) < 29:
                        continue
                    date = row[0].replace('"', '').strip()
                    app_wh = float(row[1]) if row[1].strip() else 0.0
                    lgt_wh = float(row[2]) if row[2].strip() else 0.0
                    
                    # Temperatures T1..T9
                    temps = [
                        float(row[3]), float(row[5]), float(row[7]),
                        float(row[9]), float(row[11]), float(row[13]),
                        float(row[15]), float(row[17]), float(row[19])
                    ]
                    # Humidities RH_1..RH_9
                    rhs = [
                        float(row[4]), float(row[6]), float(row[8]),
                        float(row[10]), float(row[12]), float(row[14]),
                        float(row[16]), float(row[18]), float(row[20])
                    ]
                    
                    t_out = float(row[21])
                    press = float(row[22])
                    rh_out = float(row[23])
                    wind = float(row[24])
                    vis = float(row[25])
                    tdew = float(row[26])

                    # Convert 10-min Wh to average kW
                    app_kw = round(app_wh * 0.006, 3)
                    lgt_kw = round(lgt_wh * 0.006, 3)
                    total_kw = round(app_kw + lgt_kw, 3)

                    self.records.append({
                        "date": date,
                        "appWh": app_wh,
                        "lgtWh": lgt_wh,
                        "appKw": app_kw,
                        "lgtKw": lgt_kw,
                        "totalKw": total_kw,
                        "t": temps,
                        "rh": rhs,
                        "tOut": t_out,
                        "press": press,
                        "rhOut": rh_out,
                        "wind": wind,
                        "vis": vis,
                        "tdew": tdew
                    })

            print(f"[UCISimulator] Successfully loaded {len(self.records)} records from {self.data_path}")
        except Exception as e:
            print(f"[UCISimulator] Error loading dataset: {e}")

    def start(self):
        self.is_running = True

    def pause(self):
        self.is_running = False

    def resume(self):
        self.is_running = True

    def reset(self):
        self.current_index = 0
        self.cum_kwh = 0.0
        self.cum_cost_inr = 0.0
        self.cum_co2_kg = 0.0
        self.history = []
        self.is_running = True

    def set_speed(self, speed: float):
        self.speed = max(0.1, min(120.0, speed))

    def scrub_to(self, index: int):
        if self.records:
            self.current_index = max(0, min(len(self.records) - 1, index))

    def tick(self, step_increment: int = 1) -> Dict[str, Any]:
        if not self.records:
            return {"error": "Dataset empty or not loaded"}

        if self.is_running:
            self.current_index = (self.current_index + step_increment) % len(self.records)

        rec = self.records[self.current_index]
        
        # Energy accounting: 10 minutes = 1/6 hour
        step_kwh = rec["totalKw"] * (10.0 / 60.0)
        self.cum_kwh += step_kwh

        # Time-of-day tariff
        try:
            dt = datetime.strptime(rec["date"], "%Y-%m-%d %H:%M:%S")
            hour = dt.hour + (dt.minute / 60.0)
        except Exception:
            hour = 12.0
            dt = datetime.now(timezone.utc)

        is_peak = (18.0 <= hour < 22.0)
        tariff = settings.TARIFF_BASE * (settings.TARIFF_PEAK_SURCHARGE if is_peak else 1.0)
        step_cost = step_kwh * tariff
        self.cum_cost_inr += step_cost
        self.cum_co2_kg += step_kwh * settings.GRID_EMISSION_FACTOR

        # Twin expected power (baseline baseline model: average expected idle load + diurnal curve)
        diurnal_factor = math.sin((hour - 6.0) / 24.0 * math.pi * 2.0)
        expected_kw = max(0.15, round(0.25 + 0.35 * max(0.0, diurnal_factor), 3))
        unexplained_kw = max(0.0, round(rec["totalKw"] - expected_kw, 3))

        frame = {
            "index": self.current_index,
            "total_records": len(self.records),
            "date": rec["date"],
            "timestamp": rec["date"],
            "hour": hour,
            "is_running": self.is_running,
            "speed": self.speed,
            "data_source": "UCI Appliances Energy Prediction (Dataset #374)",
            "data_label": "Simulated Live — UCI Dataset",
            "is_simulated": True,
            "live_metrics": {
                "measured_kw": rec["totalKw"],
                "appliances_kw": rec["appKw"],
                "lights_kw": rec["lgtKw"],
                "expected_kw": expected_kw,
                "unexplained_kw": unexplained_kw,
                "outdoor_temp_c": rec["tOut"],
                "cum_kwh": round(self.cum_kwh, 2),
                "cum_cost_inr": round(self.cum_cost_inr, 1),
                "cum_co2_kg": round(self.cum_co2_kg, 2),
                "contracted_demand_kw": settings.CONTRACTED_DEMAND_KW,
                "efficiency_score": max(40, min(98, round(100.0 - (unexplained_kw / (rec['totalKw'] + 0.1)) * 40.0)))
            },
            "zones": [
                {
                    "zone_id": f"Z{i+1}",
                    "name": f"Sensor Zone {i+1} ({self._zone_name(i)})",
                    "temp_c": rec["t"][i],
                    "rh_pct": rec["rh"][i],
                    "mapped_room": self._zone_name(i)
                }
                for i in range(9)
            ],
            "weather": {
                "outdoor_temp_c": rec["tOut"],
                "pressure_mm_hg": rec["press"],
                "rh_out_pct": rec["rhOut"],
                "wind_speed_ms": rec["wind"],
                "visibility_km": rec["vis"],
                "tdewpoint_c": rec["tdew"]
            }
        }

        # Keep history
        self.history.append({
            "time": rec["date"].split(" ")[1][:5] if " " in rec["date"] else rec["date"],
            "measured_kw": rec["totalKw"],
            "expected_kw": expected_kw,
            "unexplained_kw": unexplained_kw,
            "temp_c": rec["tOut"]
        })
        if len(self.history) > self.max_history:
            self.history.pop(0)

        frame["history"] = self.history
        return frame

    def _zone_name(self, index: int) -> str:
        names = [
            "Kitchen / Lab A",
            "Living Room / Common Hall",
            "Laundry / Utility Area",
            "Office / Workstation Cluster",
            "Bathroom / Restroom",
            "North Facade / Outdoor Exposure",
            "Ironing Room / Workshop",
            "Chamber 2 / Research Pod",
            "Master Room / Executive Office"
        ]
        return names[index] if index < len(names) else f"Zone {index+1}"

    def get_forecast(self, horizon_steps: int = 144) -> Dict[str, Any]:
        """
        Data-driven 24-hour forecast derived directly from subsequent UCI records.
        """
        if not self.records:
            return {"error": "Dataset not loaded"}

        horizon = []
        peak_p50 = 0.0
        peak_time = "14:00"

        for step in range(horizon_steps):
            idx = (self.current_index + step) % len(self.records)
            rec = self.records[idx]
            kw = rec["totalKw"]
            if kw > peak_p50:
                peak_p50 = kw
                peak_time = rec["date"].split(" ")[1][:5] if " " in rec["date"] else rec["date"]

            horizon.append({
                "time": rec["date"].split(" ")[1][:5] if " " in rec["date"] else rec["date"],
                "timestamp": rec["date"],
                "p50_kw": kw,
                "p10_kw": round(max(0.05, kw * 0.85), 3),
                "p90_kw": round(kw * 1.15, 3),
                "temp_c": rec["tOut"]
            })

        return {
            "data_source": "UCI Dataset Empirical Sequence",
            "current_date": self.records[self.current_index]["date"],
            "peak_risk": {
                "peak_kw_p50": round(peak_p50, 2),
                "peak_time": peak_time,
                "breach_probability_pct": round(min(100.0, (peak_p50 / settings.CONTRACTED_DEMAND_KW) * 100.0), 1)
            },
            "horizon": horizon
        }

uci_simulator_service = UCISimulatorService()
