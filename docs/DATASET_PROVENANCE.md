# 📊 UCI Appliances Energy Prediction Dataset — Provenance & Specification

## 1. Provenance & Citations

- **Dataset Identifier**: UCI Machine Learning Repository Dataset #374 ([UCI Repository Link](https://archive.ics.uci.edu/dataset/374/appliances-energy-prediction))
- **Primary Source Authors**: 
  - Luis M. Candanedo (Université de Mons, UMONS, Belgium)
  - Véronique Feldheim (Université de Mons, UMONS, Belgium)
  - Dominique Deramaix (Université de Mons, UMONS, Belgium)
- **Original Research Publication**:
  > Candanedo, L.M., Feldheim, V., & Deramaix, D. (2017). *Data driven prediction models of energy use of appliances in a low-energy house*. **Energy and Buildings**, Vol. 140, pp. 81–97. DOI: [10.1016/j.enbuild.2017.01.083](https://doi.org/10.1016/j.enbuild.2017.01.083)
- **Author's GitHub Code & Data Repository**: [https://github.com/LuisM78/Appliances-energy-prediction-data](https://github.com/LuisM78/Appliances-energy-prediction-data)
- **Donation Date**: February 14, 2017
- **License**: Creative Commons Attribution 4.0 International (CC BY 4.0)

---

## 2. Experimental Setup & Data Collection

The experimental house is located in **Stambruges, Belgium** and is designed as a low-energy residential building:
- **Duration**: Monitored for ~4.5 months from **January 11, 2016 at 17:00:00** to **May 27, 2016 at 18:00:00**.
- **Sampling Interval**: Logged at **10-minute intervals** continuously ($19,735$ total observations).
- **Sensors Used**:
  - Electrical energy was logged with **M-Bus energy meters**.
  - Temperature and humidity inside the house were acquired using a wireless sensor mesh network based on **ZigBee** transceivers. Every node recorded conditions every ~3.3 minutes, averaged over 10-minute reporting periods.
  - Outdoor meteorological conditions were recorded from the nearest airport weather station in **Chievres, Belgium** (reliable prognosis dataset, rp5.ru).

---

## 3. Data Dictionary & Physical Units

| Attribute | Description | Native Unit | System Standardized Unit & Formula |
| :--- | :--- | :--- | :--- |
| `date` | Timestamp of observation | `YYYY-MM-DD HH:MM:SS` | UTC ISO-8601 string |
| `Appliances` | Energy consumption of household appliances | $Wh$ / 10 min | $P_{app} = \text{Appliances} \times 0.006\text{ kW}$ |
| `lights` | Energy consumption of lighting fixtures | $Wh$ / 10 min | $P_{light} = \text{lights} \times 0.006\text{ kW}$ |
| `T1` | Temperature in kitchen area | $^{\circ}C$ | $^{\circ}C$ (Mapped to Zone 1) |
| `RH_1` | Relative humidity in kitchen area | $\%$ | $\%$ |
| `T2` | Temperature in living room area | $^{\circ}C$ | $^{\circ}C$ (Mapped to Zone 2) |
| `RH_2` | Relative humidity in living room area | $\%$ | $\%$ |
| `T3` | Temperature in laundry room area | $^{\circ}C$ | $^{\circ}C$ (Mapped to Zone 3) |
| `RH_3` | Relative humidity in laundry room area | $\%$ | $\%$ |
| `T4` | Temperature in office room | $^{\circ}C$ | $^{\circ}C$ (Mapped to Zone 4) |
| `RH_4` | Relative humidity in office room | $\%$ | $\%$ |
| `T5` | Temperature in bathroom | $^{\circ}C$ | $^{\circ}C$ (Mapped to Zone 5) |
| `RH_5` | Relative humidity in bathroom | $\%$ | $\%$ |
| `T6` | Temperature outside (building north facade) | $^{\circ}C$ | $^{\circ}C$ |
| `RH_6` | Relative humidity outside (north facade) | $\%$ | $\%$ |
| `T7` | Temperature in ironing room | $^{\circ}C$ | $^{\circ}C$ (Mapped to Zone 7) |
| `RH_7` | Relative humidity in ironing room | $\%$ | $\%$ |
| `T8` | Temperature in teenager room 2 | $^{\circ}C$ | $^{\circ}C$ (Mapped to Zone 8) |
| `RH_8` | Relative humidity in teenager room 2 | $\%$ | $\%$ |
| `T9` | Temperature in parents room | $^{\circ}C$ | $^{\circ}C$ (Mapped to Zone 9) |
| `RH_9` | Relative humidity in parents room | $\%$ | $\%$ |
| `T_out` | Outside temperature (Chievres weather station) | $^{\circ}C$ | $^{\circ}C$ (Ambient heat source) |
| `Press_mm_hg`| Atmospheric pressure | $mm\text{ Hg}$ | $mm\text{ Hg}$ |
| `RH_out` | Outside relative humidity | $\%$ | $\%$ |
| `Windspeed` | Outside wind speed | $m/s$ | $m/s$ |
| `Visibility` | Outside visibility | $km$ | $km$ |
| `Tdewpoint` | Dew point temperature | $^{\circ}C$ | $^{\circ}C$ |
| `rv1`, `rv2` | Non-predictive random variables | Dimensionless | Used in original study for feature filtering |

---

## 4. Energy & Accounting Calculations

1. **Power Conversion ($Wh \to kW$)**:
   Since readings are aggregated over 10-minute periods ($1/6$ of an hour):
   $$P (\text{kW}) = \frac{\text{Energy } (Wh) \times 60 / 10}{1000} = \text{Energy } (Wh) \times 0.006$$

2. **Cumulative Energy ($kWh$)**:
   $$E_{\text{cumulative}} = \sum_{t=0}^{N} \left( P_{\text{total}}(t) \times \frac{10}{60} \right)\text{ kWh}$$

3. **Cost Calculation**:
   $$\text{Cost } (₹) = \sum_{t=0}^{N} \left( E_{\text{step}}(t) \times \text{Tariff}(t) \right)$$
   Where:
   - Base Tariff: ₹8.50 per kWh
   - Peak Surcharge Factor: 1.50× (applicable during 18:00 – 22:00)

4. **Carbon Footprint**:
   $$\text{Emissions } (kg\text{ }CO_2) = E_{\text{cumulative}} \times 0.82\text{ kg } CO_2/\text{kWh}$$

---

## 5. Scientific & Ethical Transparency

- **Simulation Label**: All replayed values are prominently tagged as **"Simulated Live — UCI Dataset"**.
- **Context Disclaimer**: The dataset records historical low-energy residential building telemetry from Stambruges, Belgium. They are ingested to simulate realistic physical dynamics (thermal lag, occupancy-correlated electrical loads, diurnal spikes).
- **Twin Boundary**: Simulation controls and optimization actions affect the **software twin simulation only** and do not claim to actuate physical equipment.
