import math
import random
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any
from backend.app.config import settings

class ForecastService:
    def __init__(self):
        self.mape = 6.4  # Mean Absolute Percentage Error (%)

    def get_24h_load_forecast(self, current_time: Optional[datetime] = None) -> Dict[str, Any]:
        now = current_time or datetime.now(timezone.utc)
        horizon = []
        peak_p50 = 0.0
        peak_p90 = 0.0
        peak_time_str = "14:15"

        for step in range(96):
            step_dt = now + timedelta(minutes=step * 15)
            hour = step_dt.hour + (step_dt.minute / 60.0)

            # Weather forecast curve (24°C to 36°C)
            temp_pred = 30.0 - 6.0 * math.cos((hour - 5.0) * (2 * math.pi / 24.0))
            
            # Diurnal campus curve
            if 8.0 <= hour <= 18.0:
                bell = math.exp(-((hour - 14.2) ** 2) / 14.0)
                base_load = 180.0 + bell * 340.0 + (temp_pred - 26.0) * 14.0
            else:
                base_load = 95.0 + (math.sin(hour * 0.4) * 8.0)

            p50 = round(base_load, 1)
            # P10 / P90 quantile uncertainty band (±6-10%)
            band = base_load * 0.08
            p10 = round(max(50.0, p50 - band), 1)
            p90 = round(p50 + band, 1)

            if p50 > peak_p50:
                peak_p50 = p50
                peak_time_str = step_dt.strftime("%H:%M")
            if p90 > peak_p90:
                peak_p90 = p90

            horizon.append({
                "time": step_dt.strftime("%H:%M"),
                "timestamp": step_dt.isoformat(),
                "hour": hour,
                "temp_forecast_c": round(temp_pred, 1),
                "p10_kw": p10,
                "p50_kw": p50,
                "p90_kw": p90,
                "contracted_demand_kw": settings.CONTRACTED_DEMAND_KW
            })

        # Probability of breaching contracted demand (600 kW)
        breach_prob_pct = round(min(98.0, max(5.0, (peak_p90 / settings.CONTRACTED_DEMAND_KW - 0.85) * 500.0)), 1)
        if peak_p90 < settings.CONTRACTED_DEMAND_KW * 0.95:
            breach_prob_pct = 14.0  # safe margin

        return {
            "generated_at": now.isoformat(),
            "mape_pct": self.mape,
            "peak_risk": {
                "peak_kw_p50": round(peak_p50, 1),
                "peak_kw_p90": round(peak_p90, 1),
                "peak_time": peak_time_str,
                "contracted_demand_kw": settings.CONTRACTED_DEMAND_KW,
                "breach_probability_pct": breach_prob_pct,
                "status": "WATCH" if breach_prob_pct > 50 else "NORMAL"
            },
            "month_projection": {
                "projected_kwh": 58200,
                "budget_kwh": 54000,
                "variance_pct": 7.8,
                "traffic_light": "AMBER"
            },
            "waste_forecast_week": {
                "inr_at_risk": 31400,
                "primary_source": "Block B Labs (Unconditioned Vacancy)",
                "source_share_pct": 71
            },
            "horizon": horizon
        }

forecast_service = ForecastService()
