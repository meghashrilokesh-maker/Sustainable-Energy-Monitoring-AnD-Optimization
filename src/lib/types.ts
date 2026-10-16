export interface SiteSummary {
  site_id: string;
  site_name: string;
  tariff: {
    base_inr_per_kwh: number;
    peak_surcharge_factor: number;
    demand_charge_per_kva: number;
  };
  emission_factor_kg_co2_kwh: number;
  operating_hours: string;
  live_totals: {
    measured_kw: number;
    expected_kw: number;
    unexplained_kw: number;
    recoverable_inr_day: number;
    recoverable_co2_day: number;
    contracted_demand_kw: number;
    overall_efficiency_score: number;
  };
  buildings: {
    [key: string]: {
      building_id: string;
      zone_count: number;
      total_occupancy: number;
      measured_kw: number;
      expected_kw: number;
      unexplained_kw: number;
      ul_ratio_pct: number;
      efficiency_score: number;
      breakdown_kw: {
        hvac: number;
        lighting: number;
        plug_loads: number;
        other: number;
      };
      breakdown_pct: {
        hvac: number;
        lighting: number;
        plug_loads: number;
        other: number;
      };
    };
  };
  active_anomalies_count: number;
  verified_savings_to_date: {
    inr_month: number;
    kwh_month: number;
    co2_kg_month: number;
    trees_equivalent: number;
  };
}

export interface ZoneState {
  zone_id: string;
  name: string;
  building_id: string;
  floor: number;
  type: string;
  area_m2: number;
  occupancy: number;
  vacant_seconds: number;
  temp_c: number;
  outdoor_temp_c: number;
  setpoint_c: number;
  rh_pct: number;
  co2_ppm: number;
  measured_kw: number;
  expected_kw: number;
  unexplained_kw: number;
  category_breakdown: {
    hvac: number;
    lighting: number;
    plug_loads: number;
    other: number;
  };
  equipment_states: {
    hvac: string;
    lights: string;
    pcs_on: number;
    fan: string;
    window: string;
  };
  data_quality: string;
  confidence: number;
  last_updated: string;
}

export interface ZoneMetadata {
  id: string;
  building_id: string;
  floor: number;
  name: string;
  type: string;
  area_m2: number;
  volume_m3: number;
  polygon: number[][];
  thermal_R: number;
  thermal_C: number;
  comfort_min_c: number;
  comfort_max_c: number;
  camera_id: string;
  meter_id: string;
}

export interface CVObservation {
  camera_id: string;
  zone_id: string;
  active_clip: string;
  timestamp: string;
  privacy_mode: boolean;
  detection: {
    person_count: number;
    vacant_seconds: number;
    vacant_minutes: number;
    confidence: number;
    bounding_boxes: Array<{
      id: string;
      bbox: number[];
      conf: number;
    }>;
  };
  equipment_states: Array<{
    equipment_id: string;
    type: string;
    state: string;
    confidence: number;
    lux?: number;
    count_on?: number;
    motion_energy?: number;
  }>;
  reconciliation: {
    meter_kw: number;
    expected_kw: number;
    unexplained_kw: number;
    diagnosis: string;
    status: string;
    narrative: string;
  };
}

export interface Anomaly {
  anomaly_id: string;
  type: string;
  title: string;
  zone_id: string;
  zone_name: string;
  building_id: string;
  severity: number;
  severity_label: string;
  status: string;
  detected_at: string;
  evidence: Array<{
    k: string;
    label: string;
    v: string | number;
    detail: string;
  }>;
  baseline: {
    expected_kw: number;
    measured_kw: number;
    unexplained_kw: number;
  };
  impact_if_unresolved: {
    kwh_day: number;
    inr_day: number;
    kg_co2_day: number;
  };
  causal_chain: Array<{
    step: number;
    time: string;
    event: string;
  }>;
  reason_codes: string[];
  ai_explanation: string;
  recommended_actions: Array<{
    code: string;
    label: string;
    est_saving_pct: number;
  }>;
}

export interface ScenarioComparison {
  baseline: {
    name: string;
    avg_kwh_day: number;
    total_cost_month_inr: number;
    co2_tons_month: number;
    peak_demand_kw: number;
    comfort_compliance_pct: number;
    efficiency_score: number;
    daily_curve: any[];
  };
  scenario_a: {
    name: string;
    avg_kwh_day: number;
    total_cost_month_inr: number;
    co2_tons_month: number;
    peak_demand_kw: number;
    comfort_compliance_pct: number;
    efficiency_score: number;
    payback_label: string;
    deltas: {
      kwh_delta_pct: number;
      cost_saved_month_inr: number;
      co2_saved_tons: number;
      peak_delta_kw: number;
      comfort_delta_pct: number;
    };
  };
  scenario_b: {
    name: string;
    avg_kwh_day: number;
    total_cost_month_inr: number;
    co2_tons_month: number;
    peak_demand_kw: number;
    comfort_compliance_pct: number;
    efficiency_score: number;
    payback_label: string;
    deltas: {
      kwh_delta_pct: number;
      cost_saved_month_inr: number;
      co2_saved_tons: number;
      peak_delta_kw: number;
      comfort_delta_pct: number;
    };
  };
  optimized: {
    name: string;
    avg_kwh_day: number;
    total_cost_month_inr: number;
    co2_tons_month: number;
    peak_demand_kw: number;
    comfort_compliance_pct: number;
    efficiency_score: number;
    payback_label: string;
    deltas: {
      kwh_delta_pct: number;
      cost_saved_month_inr: number;
      co2_saved_tons: number;
      peak_delta_kw: number;
      comfort_delta_pct: number;
    };
  };
}

export interface RankedAction {
  id: string;
  rank: number;
  code: string;
  title: string;
  description: string;
  difficulty: number;
  capex_inr: number;
  payback_months: number;
  payback_str: string;
  saving_kwh_pct: number;
  saving_inr_month: number;
  saving_co2_month_t: number;
  peak_reduction_kw: number;
  comfort_impact_pct: number;
  category: string;
  score: number;
  score_pct: number;
}

export interface UCIRecord {
  date: string;
  appWh: number;
  lgtWh: number;
  appKw: number;
  lgtKw: number;
  totalKw: number;
  t: number[];   // T1 to T9
  rh: number[];  // RH_1 to RH_9
  tOut: number;
  press: number;
  rhOut: number;
  wind: number;
  vis: number;
  tdew: number;
}

export interface SimulationState {
  currentIndex: number;
  totalRecords: number;
  isPlaying: boolean;
  speed: number;
  currentRecord: UCIRecord | null;
  cumKwh: number;
  cumCostInr: number;
  cumCo2Kg: number;
  peakKw: number;
  unexplainedKw: number;
  efficiencyScore: number;
  history: Array<{
    time: string;
    measured_kw: number;
    expected_kw: number;
    unexplained_kw: number;
    outdoor_temp_c: number;
    appliance_kw: number;
    lights_kw: number;
  }>;
}
