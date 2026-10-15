import os
from pydantic import BaseModel

class PulseGridConfig(BaseModel):
    SITE_ID: str = "aryabhatta-campus"
    SITE_NAME: str = "Aryabhatta Engineering Campus"
    TARIFF_BASE: float = 8.50  # INR per kWh
    TARIFF_PEAK_SURCHARGE: float = 1.50  # Multiplier factor during 18:00 - 22:00
    DEMAND_CHARGE_PER_KVA: float = 350.0  # INR / kVA / month
    GRID_EMISSION_FACTOR: float = 0.82  # kg CO2 / kWh
    CONTRACTED_DEMAND_KW: float = 600.0  # kVA / kW limit
    SIMULATION_STEP_MIN: int = 15  # 96 steps per day
    OPERATING_HOURS_START: int = 8  # 08:00
    OPERATING_HOURS_END: int = 18   # 18:00
    
    # Auth
    JWT_SECRET: str = "pulsegrid-super-secret-key-2026-hackathon"
    JWT_ALGORITHM: str = "HS256"
    TOKEN_EXPIRE_MINUTES: int = 60 * 24

settings = PulseGridConfig()
