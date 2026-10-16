import { SiteSummary, ZoneState, ZoneMetadata, Anomaly, ScenarioComparison, RankedAction, CVObservation } from "./types";

export const MOCK_SITE_SUMMARY: SiteSummary = {
  site_id: "aryabhatta_campus",
  site_name: "Aryabhatta Engineering Campus",
  tariff: {
    base_inr_per_kwh: 8.5,
    peak_surcharge_factor: 1.4,
    demand_charge_per_kva: 350
  },
  emission_factor_kg_co2_kwh: 0.82,
  operating_hours: "08:00 - 18:00",
  live_totals: {
    measured_kw: 118.5,
    expected_kw: 114.2,
    unexplained_kw: 3.42,
    recoverable_inr_day: 4100,
    recoverable_co2_day: 67.3,
    contracted_demand_kw: 600,
    overall_efficiency_score: 74
  },
  buildings: {
    "Block-B": {
      building_id: "Block-B",
      zone_count: 6,
      total_occupancy: 95,
      measured_kw: 72.8,
      expected_kw: 69.1,
      unexplained_kw: 3.7,
      ul_ratio_pct: 5.1,
      efficiency_score: 71,
      breakdown_kw: { hvac: 48.2, lighting: 12.8, plug_loads: 22.4, other: 9.3 },
      breakdown_pct: { hvac: 52, lighting: 14, plug_loads: 24, other: 10 }
    },
    "Block-A": {
      building_id: "Block-A",
      zone_count: 6,
      total_occupancy: 120,
      measured_kw: 45.7,
      expected_kw: 45.1,
      unexplained_kw: 0.6,
      ul_ratio_pct: 1.3,
      efficiency_score: 83,
      breakdown_kw: { hvac: 24.5, lighting: 9.2, plug_loads: 8.5, other: 3.5 },
      breakdown_pct: { hvac: 54, lighting: 20, plug_loads: 18, other: 8 }
    }
  },
  active_anomalies_count: 3,
  verified_savings_to_date: {
    inr_month: 66000,
    kwh_month: 7765,
    co2_kg_month: 6367,
    trees_equivalent: 290
  }
};

export function generateMockHistory(daysAgo = 0): any[] {
  const series: any[] = [];
  let cumKwh = 0;

  for (let step = 0; step < 96; step++) {
    const totalMinutes = step * 15;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    const hourFloat = hour + minute / 60;
    const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

    // Outdoor temp curve
    const rad = (hourFloat - 5.0) * (2 * Math.PI / 24.0);
    const outdoorT = Number((30.0 - 6.0 * Math.cos(rad) + Math.sin(hourFloat * 1.5) * 0.4).toFixed(1));

    const isOperating = hourFloat >= 8.0 && hourFloat <= 18.0;

    let measured: number;
    let expected: number;

    if (isOperating) {
      const bell = Math.exp(-Math.pow(hourFloat - 14.2, 2) / 16.0);
      measured = 85.0 + bell * 145.0 + (Math.sin(step) * 3.5);
      expected = 75.0 + bell * 125.0;
      measured += 8.5; // persistent unexplained waste in labs
    } else {
      measured = 32.0 + (Math.sin(step * 0.5) * 1.5);
      expected = 26.0;
      measured += 2.5;
    }

    const unexplained = Math.max(0, measured - expected);
    const stepKwh = measured * 0.25;
    cumKwh += stepKwh;

    const tariff = 8.5 * (hourFloat >= 18.0 && hourFloat < 22.0 ? 1.4 : 1.0);
    const costInr = stepKwh * tariff;
    const co2Kg = stepKwh * 0.82;

    series.push({
      timestamp: `2026-10-15T${timeStr}:00Z`,
      time: timeStr,
      hour: hourFloat,
      outdoor_temp_c: outdoorT,
      measured_kw: Number(measured.toFixed(1)),
      expected_kw: Number(expected.toFixed(1)),
      unexplained_kw: Number(unexplained.toFixed(1)),
      hvac_kw: Number((measured * 0.52).toFixed(1)),
      lighting_kw: Number((measured * 0.14).toFixed(1)),
      plug_kw: Number((measured * 0.24).toFixed(1)),
      other_kw: Number((measured * 0.10).toFixed(1)),
      cum_kwh: Number(cumKwh.toFixed(1)),
      cost_inr: Number(costInr.toFixed(1)),
      co2_kg: Number(co2Kg.toFixed(2))
    });
  }

  return series;
}

export const MOCK_ZONES: ZoneMetadata[] = [
  // Block B Floor 1
  {
    id: "B-101",
    building_id: "Block-B",
    floor: 1,
    name: "Computer Lab 1",
    type: "lab",
    area_m2: 110,
    volume_m3: 330,
    polygon: [[10, 10], [90, 10], [90, 80], [10, 80]],
    thermal_R: 0.045,
    thermal_C: 18.5,
    comfort_min_c: 22.0,
    comfort_max_c: 26.0,
    camera_id: "cam-b101",
    meter_id: "M-B101"
  },
  {
    id: "B-102",
    building_id: "Block-B",
    floor: 1,
    name: "IoT & Embedded Lab",
    type: "lab",
    area_m2: 95,
    volume_m3: 285,
    polygon: [[95, 10], [175, 10], [175, 80], [95, 80]],
    thermal_R: 0.048,
    thermal_C: 16.0,
    comfort_min_c: 22.0,
    comfort_max_c: 26.0,
    camera_id: "cam-b102",
    meter_id: "M-B102"
  },
  {
    id: "B-103",
    building_id: "Block-B",
    floor: 1,
    name: "Lecture Hall 101",
    type: "classroom",
    area_m2: 140,
    volume_m3: 440,
    polygon: [[180, 10], [280, 10], [280, 80], [180, 80]],
    thermal_R: 0.040,
    thermal_C: 22.0,
    comfort_min_c: 22.0,
    comfort_max_c: 26.0,
    camera_id: "cam-b103",
    meter_id: "M-B103"
  },
  {
    id: "B-104",
    building_id: "Block-B",
    floor: 1,
    name: "Faculty Cabin A",
    type: "office",
    area_m2: 55,
    volume_m3: 165,
    polygon: [[10, 85], [90, 85], [90, 145], [10, 145]],
    thermal_R: 0.065,
    thermal_C: 10.5,
    comfort_min_c: 22.5,
    comfort_max_c: 26.0,
    camera_id: "cam-b104",
    meter_id: "M-B104"
  },
  {
    id: "B-105",
    building_id: "Block-B",
    floor: 1,
    name: "Corridor & Concourse L1",
    type: "corridor",
    area_m2: 120,
    volume_m3: 360,
    polygon: [[95, 85], [175, 85], [175, 145], [95, 145]],
    thermal_R: 0.035,
    thermal_C: 15.0,
    comfort_min_c: 21.0,
    comfort_max_c: 28.0,
    camera_id: "cam-b105",
    meter_id: "M-B105"
  },
  {
    id: "B-106",
    building_id: "Block-B",
    floor: 1,
    name: "Robotics Workshop",
    type: "lab",
    area_m2: 130,
    volume_m3: 400,
    polygon: [[180, 85], [280, 85], [280, 145], [180, 145]],
    thermal_R: 0.042,
    thermal_C: 20.0,
    comfort_min_c: 22.0,
    comfort_max_c: 26.5,
    camera_id: "cam-b106",
    meter_id: "M-B106"
  },

  // Block B Floor 2
  {
    id: "B-201",
    building_id: "Block-B",
    floor: 2,
    name: "AI & Machine Learning Lab",
    type: "lab",
    area_m2: 115,
    volume_m3: 345,
    polygon: [[10, 10], [90, 10], [90, 80], [10, 80]],
    thermal_R: 0.046,
    thermal_C: 19.0,
    comfort_min_c: 22.0,
    comfort_max_c: 25.5,
    camera_id: "cam-b201",
    meter_id: "M-B201"
  },
  {
    id: "B-202",
    building_id: "Block-B",
    floor: 2,
    name: "Data Science Lab",
    type: "lab",
    area_m2: 95,
    volume_m3: 285,
    polygon: [[95, 10], [175, 10], [175, 80], [95, 80]],
    thermal_R: 0.047,
    thermal_C: 16.5,
    comfort_min_c: 22.0,
    comfort_max_c: 25.5,
    camera_id: "cam-b202",
    meter_id: "M-B202"
  },
  {
    id: "B-203",
    building_id: "Block-B",
    floor: 2,
    name: "Lecture Hall 201",
    type: "classroom",
    area_m2: 140,
    volume_m3: 440,
    polygon: [[180, 10], [280, 10], [280, 80], [180, 80]],
    thermal_R: 0.041,
    thermal_C: 22.5,
    comfort_min_c: 22.0,
    comfort_max_c: 26.0,
    camera_id: "cam-b203",
    meter_id: "M-B203"
  },
  {
    id: "B-204",
    building_id: "Block-B",
    floor: 2,
    name: "Advanced Computing Lab",
    type: "lab",
    area_m2: 125,
    volume_m3: 375,
    polygon: [[10, 85], [90, 85], [90, 145], [10, 145]],
    thermal_R: 0.043,
    thermal_C: 19.5,
    comfort_min_c: 22.0,
    comfort_max_c: 25.0,
    camera_id: "cam-b204-01",
    meter_id: "M-B204"
  },
  {
    id: "B-205",
    building_id: "Block-B",
    floor: 2,
    name: "Corridor & Study Lounge L2",
    type: "corridor",
    area_m2: 120,
    volume_m3: 360,
    polygon: [[95, 85], [175, 85], [175, 145], [95, 145]],
    thermal_R: 0.038,
    thermal_C: 15.5,
    comfort_min_c: 21.0,
    comfort_max_c: 27.5,
    camera_id: "cam-b205",
    meter_id: "M-B205"
  },
  {
    id: "B-207",
    building_id: "Block-B",
    floor: 2,
    name: "Cybersecurity & Networks Lab",
    type: "lab",
    area_m2: 110,
    volume_m3: 330,
    polygon: [[180, 85], [280, 85], [280, 145], [180, 145]],
    thermal_R: 0.045,
    thermal_C: 18.0,
    comfort_min_c: 22.0,
    comfort_max_c: 25.5,
    camera_id: "cam-b207",
    meter_id: "M-B207"
  },

  // Block A Floor 1
  {
    id: "A-101",
    building_id: "Block-A",
    floor: 1,
    name: "Campus Admin Office",
    type: "office",
    area_m2: 130,
    volume_m3: 390,
    polygon: [[10, 10], [90, 10], [90, 80], [10, 80]],
    thermal_R: 0.052,
    thermal_C: 18.0,
    comfort_min_c: 22.5,
    comfort_max_c: 26.0,
    camera_id: "cam-a101",
    meter_id: "M-A101"
  },
  {
    id: "A-102",
    building_id: "Block-A",
    floor: 1,
    name: "Executive Conference Room",
    type: "office",
    area_m2: 80,
    volume_m3: 240,
    polygon: [[95, 10], [175, 10], [175, 80], [95, 80]],
    thermal_R: 0.055,
    thermal_C: 14.0,
    comfort_min_c: 22.0,
    comfort_max_c: 25.0,
    camera_id: "cam-a102",
    meter_id: "M-A102"
  },
  {
    id: "A-103",
    building_id: "Block-A",
    floor: 1,
    name: "Lecture Theater A1",
    type: "classroom",
    area_m2: 150,
    volume_m3: 480,
    polygon: [[180, 10], [280, 10], [280, 80], [180, 80]],
    thermal_R: 0.042,
    thermal_C: 24.0,
    comfort_min_c: 22.0,
    comfort_max_c: 26.0,
    camera_id: "cam-a103",
    meter_id: "M-A103"
  },

  // Block A Floor 2
  {
    id: "A-201",
    building_id: "Block-A",
    floor: 2,
    name: "Central Library & Digital Reading",
    type: "office",
    area_m2: 180,
    volume_m3: 540,
    polygon: [[10, 10], [100, 10], [100, 80], [10, 80]],
    thermal_R: 0.048,
    thermal_C: 28.0,
    comfort_min_c: 22.5,
    comfort_max_c: 26.0,
    camera_id: "cam-a201",
    meter_id: "M-A201"
  },
  {
    id: "A-202",
    building_id: "Block-A",
    floor: 2,
    name: "Faculty Research Hub",
    type: "office",
    area_m2: 85,
    volume_m3: 255,
    polygon: [[105, 10], [175, 10], [175, 80], [105, 80]],
    thermal_R: 0.054,
    thermal_C: 15.0,
    comfort_min_c: 22.0,
    comfort_max_c: 26.0,
    camera_id: "cam-a202",
    meter_id: "M-A202"
  },
  {
    id: "A-203",
    building_id: "Block-A",
    floor: 2,
    name: "Auditorium Seminar Hall",
    type: "classroom",
    area_m2: 210,
    volume_m3: 680,
    polygon: [[180, 10], [280, 10], [280, 80], [180, 80]],
    thermal_R: 0.038,
    thermal_C: 32.0,
    comfort_min_c: 22.0,
    comfort_max_c: 25.5,
    camera_id: "cam-a203",
    meter_id: "M-A203"
  }
];

export function getMockZoneStates(): ZoneState[] {
  const now = new Date().toISOString();

  return [
    {
      zone_id: "B-204",
      name: "Advanced Computing Lab",
      building_id: "Block-B",
      floor: 2,
      type: "lab",
      area_m2: 125,
      occupancy: 0,
      vacant_seconds: 3120,
      temp_c: 22.1,
      outdoor_temp_c: 32.4,
      setpoint_c: 22.0,
      rh_pct: 54.0,
      co2_ppm: 418.0,
      measured_kw: 3.42,
      expected_kw: 0.60,
      unexplained_kw: 2.82,
      category_breakdown: { hvac: 3.10, lighting: 0.50, plug_loads: 1.45, other: 0.1 },
      equipment_states: { hvac: "COOLING", lights: "ON", pcs_on: 17, fan: "OFF", window: "CLOSED" },
      data_quality: "GOOD",
      confidence: 0.98,
      last_updated: now
    },
    {
      zone_id: "B-207",
      name: "Cybersecurity & Networks Lab",
      building_id: "Block-B",
      floor: 2,
      type: "lab",
      area_m2: 110,
      occupancy: 0,
      vacant_seconds: 1400,
      temp_c: 23.0,
      outdoor_temp_c: 32.4,
      setpoint_c: 22.5,
      rh_pct: 51.0,
      co2_ppm: 430.0,
      measured_kw: 2.15,
      expected_kw: 1.30,
      unexplained_kw: 0.85,
      category_breakdown: { hvac: 1.20, lighting: 0.56, plug_loads: 1.10, other: 0.05 },
      equipment_states: { hvac: "COOLING", lights: "OFF", pcs_on: 24, fan: "OFF", window: "CLOSED" },
      data_quality: "GOOD",
      confidence: 0.94,
      last_updated: now
    },
    {
      zone_id: "B-201",
      name: "AI & Machine Learning Lab",
      building_id: "Block-B",
      floor: 2,
      type: "lab",
      area_m2: 115,
      occupancy: 24,
      vacant_seconds: 0,
      temp_c: 23.4,
      outdoor_temp_c: 32.4,
      setpoint_c: 23.0,
      rh_pct: 52.0,
      co2_ppm: 780.0,
      measured_kw: 4.85,
      expected_kw: 4.80,
      unexplained_kw: 0.05,
      category_breakdown: { hvac: 2.20, lighting: 0.60, plug_loads: 3.60, other: 0.1 },
      equipment_states: { hvac: "COOLING", lights: "ON", pcs_on: 20, fan: "ON", window: "CLOSED" },
      data_quality: "GOOD",
      confidence: 0.96,
      last_updated: now
    },
    {
      zone_id: "B-202",
      name: "Data Science Lab",
      building_id: "Block-B",
      floor: 2,
      type: "lab",
      area_m2: 95,
      occupancy: 18,
      vacant_seconds: 0,
      temp_c: 23.8,
      outdoor_temp_c: 32.4,
      setpoint_c: 23.0,
      rh_pct: 50.0,
      co2_ppm: 640.0,
      measured_kw: 3.20,
      expected_kw: 3.15,
      unexplained_kw: 0.05,
      category_breakdown: { hvac: 1.60, lighting: 0.45, plug_loads: 1.80, other: 0.1 },
      equipment_states: { hvac: "COOLING", lights: "ON", pcs_on: 18, fan: "ON", window: "CLOSED" },
      data_quality: "GOOD",
      confidence: 0.95,
      last_updated: now
    },
    {
      zone_id: "B-203",
      name: "Lecture Hall 201",
      building_id: "Block-B",
      floor: 2,
      type: "classroom",
      area_m2: 140,
      occupancy: 45,
      vacant_seconds: 0,
      temp_c: 24.1,
      outdoor_temp_c: 32.4,
      setpoint_c: 23.5,
      rh_pct: 56.0,
      co2_ppm: 880.0,
      measured_kw: 4.10,
      expected_kw: 4.05,
      unexplained_kw: 0.05,
      category_breakdown: { hvac: 2.80, lighting: 0.80, plug_loads: 0.40, other: 0.1 },
      equipment_states: { hvac: "COOLING", lights: "ON", pcs_on: 2, fan: "ON", window: "CLOSED" },
      data_quality: "GOOD",
      confidence: 0.97,
      last_updated: now
    },
    {
      zone_id: "B-205",
      name: "Corridor & Study Lounge L2",
      building_id: "Block-B",
      floor: 2,
      type: "corridor",
      area_m2: 120,
      occupancy: 8,
      vacant_seconds: 0,
      temp_c: 25.2,
      outdoor_temp_c: 32.4,
      setpoint_c: 25.0,
      rh_pct: 48.0,
      co2_ppm: 490.0,
      measured_kw: 1.10,
      expected_kw: 1.10,
      unexplained_kw: 0.00,
      category_breakdown: { hvac: 0.50, lighting: 0.40, plug_loads: 0.15, other: 0.05 },
      equipment_states: { hvac: "IDLE", lights: "ON", pcs_on: 0, fan: "ON", window: "CLOSED" },
      data_quality: "GOOD",
      confidence: 0.92,
      last_updated: now
    },

    // Floor 1
    {
      zone_id: "B-101",
      name: "Computer Lab 1",
      building_id: "Block-B",
      floor: 1,
      type: "lab",
      area_m2: 110,
      occupancy: 28,
      vacant_seconds: 0,
      temp_c: 23.2,
      outdoor_temp_c: 32.4,
      setpoint_c: 23.0,
      rh_pct: 53.0,
      co2_ppm: 720.0,
      measured_kw: 4.60,
      expected_kw: 4.55,
      unexplained_kw: 0.05,
      category_breakdown: { hvac: 2.20, lighting: 0.86, plug_loads: 2.72, other: 0.1 },
      equipment_states: { hvac: "COOLING", lights: "ON", pcs_on: 28, fan: "ON", window: "CLOSED" },
      data_quality: "GOOD",
      confidence: 0.97,
      last_updated: now
    },
    {
      zone_id: "B-102",
      name: "IoT & Embedded Lab",
      building_id: "Block-B",
      floor: 1,
      type: "lab",
      area_m2: 95,
      occupancy: 15,
      vacant_seconds: 0,
      temp_c: 23.5,
      outdoor_temp_c: 32.4,
      setpoint_c: 23.0,
      rh_pct: 51.0,
      co2_ppm: 610.0,
      measured_kw: 2.90,
      expected_kw: 2.85,
      unexplained_kw: 0.05,
      category_breakdown: { hvac: 1.50, lighting: 0.50, plug_loads: 1.20, other: 0.05 },
      equipment_states: { hvac: "COOLING", lights: "ON", pcs_on: 15, fan: "ON", window: "CLOSED" },
      data_quality: "GOOD",
      confidence: 0.95,
      last_updated: now
    },
    {
      zone_id: "B-103",
      name: "Lecture Hall 101",
      building_id: "Block-B",
      floor: 1,
      type: "classroom",
      area_m2: 140,
      occupancy: 50,
      vacant_seconds: 0,
      temp_c: 23.9,
      outdoor_temp_c: 32.4,
      setpoint_c: 23.0,
      rh_pct: 55.0,
      co2_ppm: 850.0,
      measured_kw: 4.30,
      expected_kw: 4.25,
      unexplained_kw: 0.05,
      category_breakdown: { hvac: 2.90, lighting: 0.90, plug_loads: 0.40, other: 0.1 },
      equipment_states: { hvac: "COOLING", lights: "ON", pcs_on: 2, fan: "ON", window: "CLOSED" },
      data_quality: "GOOD",
      confidence: 0.98,
      last_updated: now
    },
    {
      zone_id: "B-104",
      name: "Faculty Cabin A",
      building_id: "Block-B",
      floor: 1,
      type: "office",
      area_m2: 55,
      occupancy: 6,
      vacant_seconds: 0,
      temp_c: 23.6,
      outdoor_temp_c: 32.4,
      setpoint_c: 23.5,
      rh_pct: 49.0,
      co2_ppm: 520.0,
      measured_kw: 1.45,
      expected_kw: 1.40,
      unexplained_kw: 0.05,
      category_breakdown: { hvac: 0.80, lighting: 0.30, plug_loads: 0.40, other: 0.05 },
      equipment_states: { hvac: "COOLING", lights: "ON", pcs_on: 6, fan: "ON", window: "CLOSED" },
      data_quality: "GOOD",
      confidence: 0.94,
      last_updated: now
    },
    {
      zone_id: "B-105",
      name: "Corridor & Concourse L1",
      building_id: "Block-B",
      floor: 1,
      type: "corridor",
      area_m2: 120,
      occupancy: 12,
      vacant_seconds: 0,
      temp_c: 25.5,
      outdoor_temp_c: 32.4,
      setpoint_c: 25.0,
      rh_pct: 48.0,
      co2_ppm: 470.0,
      measured_kw: 1.25,
      expected_kw: 1.25,
      unexplained_kw: 0.00,
      category_breakdown: { hvac: 0.60, lighting: 0.45, plug_loads: 0.15, other: 0.05 },
      equipment_states: { hvac: "IDLE", lights: "ON", pcs_on: 0, fan: "ON", window: "CLOSED" },
      data_quality: "GOOD",
      confidence: 0.93,
      last_updated: now
    },
    {
      zone_id: "B-106",
      name: "Robotics Workshop",
      building_id: "Block-B",
      floor: 1,
      type: "lab",
      area_m2: 130,
      occupancy: 14,
      vacant_seconds: 0,
      temp_c: 24.0,
      outdoor_temp_c: 32.4,
      setpoint_c: 23.5,
      rh_pct: 50.0,
      co2_ppm: 580.0,
      measured_kw: 3.80,
      expected_kw: 3.75,
      unexplained_kw: 0.05,
      category_breakdown: { hvac: 1.90, lighting: 0.70, plug_loads: 1.10, other: 0.1 },
      equipment_states: { hvac: "COOLING", lights: "ON", pcs_on: 8, fan: "ON", window: "CLOSED" },
      data_quality: "GOOD",
      confidence: 0.95,
      last_updated: now
    },

    // Block A
    {
      zone_id: "A-101",
      name: "Campus Admin Office",
      building_id: "Block-A",
      floor: 1,
      type: "office",
      area_m2: 130,
      occupancy: 18,
      vacant_seconds: 0,
      temp_c: 23.5,
      outdoor_temp_c: 32.4,
      setpoint_c: 23.0,
      rh_pct: 51.0,
      co2_ppm: 590.0,
      measured_kw: 3.60,
      expected_kw: 3.55,
      unexplained_kw: 0.05,
      category_breakdown: { hvac: 1.80, lighting: 0.80, plug_loads: 0.90, other: 0.1 },
      equipment_states: { hvac: "COOLING", lights: "ON", pcs_on: 18, fan: "ON", window: "CLOSED" },
      data_quality: "GOOD",
      confidence: 0.96,
      last_updated: now
    },
    {
      zone_id: "A-102",
      name: "Executive Conference Room",
      building_id: "Block-A",
      floor: 1,
      type: "office",
      area_m2: 80,
      occupancy: 4,
      vacant_seconds: 0,
      temp_c: 22.8,
      outdoor_temp_c: 32.4,
      setpoint_c: 22.5,
      rh_pct: 49.0,
      co2_ppm: 480.0,
      measured_kw: 2.10,
      expected_kw: 2.05,
      unexplained_kw: 0.05,
      category_breakdown: { hvac: 1.20, lighting: 0.40, plug_loads: 0.45, other: 0.05 },
      equipment_states: { hvac: "COOLING", lights: "ON", pcs_on: 4, fan: "ON", window: "CLOSED" },
      data_quality: "GOOD",
      confidence: 0.95,
      last_updated: now
    },
    {
      zone_id: "A-103",
      name: "Lecture Theater A1",
      building_id: "Block-A",
      floor: 1,
      type: "classroom",
      area_m2: 150,
      occupancy: 65,
      vacant_seconds: 0,
      temp_c: 23.8,
      outdoor_temp_c: 32.4,
      setpoint_c: 23.0,
      rh_pct: 55.0,
      co2_ppm: 890.0,
      measured_kw: 5.20,
      expected_kw: 5.15,
      unexplained_kw: 0.05,
      category_breakdown: { hvac: 3.40, lighting: 1.10, plug_loads: 0.60, other: 0.1 },
      equipment_states: { hvac: "COOLING", lights: "ON", pcs_on: 3, fan: "ON", window: "CLOSED" },
      data_quality: "GOOD",
      confidence: 0.98,
      last_updated: now
    },
    {
      zone_id: "A-201",
      name: "Central Library & Digital Reading",
      building_id: "Block-A",
      floor: 2,
      type: "office",
      area_m2: 180,
      occupancy: 35,
      vacant_seconds: 0,
      temp_c: 23.6,
      outdoor_temp_c: 32.4,
      setpoint_c: 23.5,
      rh_pct: 50.0,
      co2_ppm: 620.0,
      measured_kw: 4.80,
      expected_kw: 4.75,
      unexplained_kw: 0.05,
      category_breakdown: { hvac: 2.60, lighting: 1.20, plug_loads: 0.90, other: 0.1 },
      equipment_states: { hvac: "COOLING", lights: "ON", pcs_on: 25, fan: "ON", window: "CLOSED" },
      data_quality: "GOOD",
      confidence: 0.97,
      last_updated: now
    },
    {
      zone_id: "A-202",
      name: "Faculty Research Hub",
      building_id: "Block-A",
      floor: 2,
      type: "office",
      area_m2: 85,
      occupancy: 10,
      vacant_seconds: 0,
      temp_c: 23.4,
      outdoor_temp_c: 32.4,
      setpoint_c: 23.0,
      rh_pct: 51.0,
      co2_ppm: 540.0,
      measured_kw: 2.40,
      expected_kw: 2.35,
      unexplained_kw: 0.05,
      category_breakdown: { hvac: 1.30, lighting: 0.45, plug_loads: 0.60, other: 0.05 },
      equipment_states: { hvac: "COOLING", lights: "ON", pcs_on: 10, fan: "ON", window: "CLOSED" },
      data_quality: "GOOD",
      confidence: 0.95,
      last_updated: now
    },
    {
      zone_id: "A-203",
      name: "Auditorium Seminar Hall",
      building_id: "Block-A",
      floor: 2,
      type: "classroom",
      area_m2: 210,
      occupancy: 80,
      vacant_seconds: 0,
      temp_c: 23.7,
      outdoor_temp_c: 32.4,
      setpoint_c: 23.0,
      rh_pct: 54.0,
      co2_ppm: 920.0,
      measured_kw: 6.80,
      expected_kw: 6.70,
      unexplained_kw: 0.10,
      category_breakdown: { hvac: 4.60, lighting: 1.40, plug_loads: 0.70, other: 0.1 },
      equipment_states: { hvac: "COOLING", lights: "ON", pcs_on: 4, fan: "ON", window: "CLOSED" },
      data_quality: "GOOD",
      confidence: 0.98,
      last_updated: now
    }
  ];
}

export const MOCK_ANOMALIES: Anomaly[] = [
  {
    anomaly_id: "AN-R1-B-204",
    type: "EMPTY_ROOM_CONDITIONING",
    title: "Active Air Conditioning in Empty Room (Advanced Computing Lab B-204)",
    zone_id: "B-204",
    zone_name: "Advanced Computing Lab",
    building_id: "Block-B",
    severity: 84,
    severity_label: "CRITICAL",
    status: "OPEN",
    detected_at: new Date(Date.now() - 52 * 60 * 1000).toISOString(),
    evidence: [
      { k: "occupancy", label: "Occupancy", v: 0, detail: "0 occupants detected via CV (vacant for 52 min)" },
      { k: "hvac_power_kw", label: "HVAC Power", v: 3.1, detail: "Voltas cassette compressor running at active cooling load" },
      { k: "lights", label: "Lights State", v: "ON", detail: "Ceiling luminaires active" },
      { k: "pcs_on", label: "PCs Powered", v: 17, detail: "17 workstations drawing idle power" },
      { k: "setpoint_c", label: "Thermostat", v: 22.0, detail: "Set at 22°C (chilled)" }
    ],
    baseline: {
      expected_kw: 0.60,
      measured_kw: 3.42,
      unexplained_kw: 2.82
    },
    impact_if_unresolved: {
      kwh_day: 33.8,
      inr_day: 287,
      kg_co2_day: 27.7
    },
    causal_chain: [
      { step: 1, time: "52 min ago", event: "Class session concluded and occupants vacated the room" },
      { step: 2, time: "50 min ago", event: "Vision monitor logged zero occupancy, vacancy timer initiated" },
      { step: 3, time: "Current", event: "Thermostat stayed at 22°C with 17 PCs powered idle" },
      { step: 4, time: "Ongoing", event: "Twin registered 2.82 kW unexplained load burning ₹287/day" }
    ],
    reason_codes: ["R1", "R4"],
    ai_explanation: "Advanced Computing Lab B-204 has been completely vacant for 52 minutes, yet its AC is drawing 3.1 kW at a 22°C setpoint while 17 PCs remain powered. Typical expected baseline for this vacant lab is 0.60 kW, resulting in 2.82 kW of unexplained load (₹287/day if left unaddressed).",
    recommended_actions: [
      { code: "ACT-HVAC-SETBACK", label: "Switch HVAC to setback mode (28°C)", est_saving_pct: 14.2 },
      { code: "ACT-AUTO-PC", label: "Send sleep signal to idle PC bank", est_saving_pct: 6.8 },
      { code: "ACT-OCC-SCHEDULE", label: "Enable Vision-Grounded Auto-Setback Policy", est_saving_pct: 18.5 }
    ]
  },
  {
    anomaly_id: "AN-R4-B-207",
    type: "COMPRESSOR_DEGRADATION",
    title: "Degraded Compressor COP / High Power Intensity (Cybersecurity Lab B-207)",
    zone_id: "B-207",
    zone_name: "Cybersecurity & Networks Lab",
    building_id: "Block-B",
    severity: 76,
    severity_label: "CRITICAL",
    status: "OPEN",
    detected_at: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    evidence: [
      { k: "measured_cop", label: "Measured COP", v: "1.95", detail: "20.4% efficiency degradation vs rated 2.45 COP" },
      { k: "compressor_runtime", label: "Runtime", v: "98%", detail: "Compressor running non-stop without cycling" },
      { k: "unexplained_kw", label: "Waste Power", v: 0.85, detail: "Persistent excess power draw" },
      { k: "pcs_on", label: "Idle PCs", v: 24, detail: "24 workstations powered after class hours" }
    ],
    baseline: {
      expected_kw: 1.30,
      measured_kw: 2.15,
      unexplained_kw: 0.85
    },
    impact_if_unresolved: {
      kwh_day: 18.2,
      inr_day: 155,
      kg_co2_day: 14.9
    },
    causal_chain: [
      { step: 1, time: "3 hours ago", event: "Thermostat call triggered cooling under ambient 32°C" },
      { step: 2, time: "2 hours ago", event: "Refrigerant charge degradation caused compressor to draw 40% excess power" },
      { step: 3, time: "Current", event: "COP measured at 1.95 with 24 idle workstations" }
    ],
    reason_codes: ["R4", "R2"],
    ai_explanation: "Cybersecurity Lab B-207 AC unit is exhibiting severe compressor degradation (measured COP of 1.95 vs rated 2.45), requiring continuous full-load draw even with low occupancy.",
    recommended_actions: [
      { code: "ACT-MAINT-HVAC", label: "Schedule HVAC coil cleaning and refrigerant recharge", est_saving_pct: 12.0 },
      { code: "ACT-AUTO-PC", label: "Enable auto power-down for 24 lab PCs", est_saving_pct: 8.5 }
    ]
  },
  {
    anomaly_id: "AN-R2-B-101",
    type: "AFTER_HOURS_LOAD",
    title: "After-Hours Idle PC Bank Standby Load (Computer Lab 1)",
    zone_id: "B-101",
    zone_name: "Computer Lab 1",
    building_id: "Block-B",
    severity: 65,
    severity_label: "WARNING",
    status: "OPEN",
    detected_at: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    evidence: [
      { k: "occupancy", label: "Occupancy", v: 0, detail: "Room empty during late evening inspection" },
      { k: "pcs_on", label: "Active PCs", v: 28, detail: "28 PCs drawing 85W each instead of sleep" },
      { k: "standby_kw", label: "Plug Load", v: 2.38, detail: "Excessive idle workstation draw" }
    ],
    baseline: {
      expected_kw: 0.40,
      measured_kw: 2.78,
      unexplained_kw: 2.38
    },
    impact_if_unresolved: {
      kwh_day: 28.5,
      inr_day: 242,
      kg_co2_day: 23.4
    },
    causal_chain: [
      { step: 1, time: "6 hours ago", event: "Evening batch dismissed without logging off" },
      { step: 2, time: "Current", event: "28 workstations remained in full power state" }
    ],
    reason_codes: ["R2"],
    ai_explanation: "Computer Lab 1 has 28 workstations active with zero occupants present, generating unnecessary base plug load throughout off-hours.",
    recommended_actions: [
      { code: "ACT-AUTO-PC", label: "Broadcast automated sleep script to all lab clients", est_saving_pct: 15.0 }
    ]
  }
];

export const MOCK_FORECAST = {
  peak_risk: {
    peak_kw_p50: 612,
    peak_kw_p90: 645,
    peak_time: "14:15",
    contracted_demand_kw: 600,
    breach_probability_pct: 72,
    status: "WATCH"
  },
  month_projection: {
    projected_kwh: 58200,
    budget_kwh: 54000,
    variance_pct: 7.8,
    traffic_light: "AMBER"
  },
  horizon: Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const timeStr = `${hour.toString().padStart(2, "0")}:00`;
    const rad = (hour - 5.0) * (2 * Math.PI / 24.0);
    const bell = Math.exp(-Math.pow(hour - 14.2, 2) / 16.0);
    const p50 = Math.round(75 + bell * 490 + (Math.sin(hour) * 15));
    const p90 = Math.round(p50 * 1.12);
    const p10 = Math.round(p50 * 0.88);
    const solar = hour >= 6 && hour <= 18 ? Math.round(Math.sin((hour - 6) * Math.PI / 12) * 120) : 0;

    return {
      time: timeStr,
      hour,
      p10_kw: p10,
      p50_kw: p50,
      p90_kw: p90,
      contracted_demand_kw: 600,
      solar_kw: solar,
      net_grid_kw: Math.max(0, p50 - solar)
    };
  })
};

export const MOCK_SCENARIOS: ScenarioComparison = {
  baseline: {
    name: "Baseline (Current Operations)",
    avg_kwh_day: 1850,
    total_cost_month_inr: 471750,
    co2_tons_month: 45.5,
    peak_demand_kw: 612,
    comfort_compliance_pct: 92,
    efficiency_score: 74,
    daily_curve: []
  },
  scenario_a: {
    name: "Occupancy Setbacks (Vision-Grounded)",
    avg_kwh_day: 1591,
    total_cost_month_inr: 405750,
    co2_tons_month: 39.1,
    peak_demand_kw: 548,
    comfort_compliance_pct: 94,
    efficiency_score: 88,
    payback_label: "Immediate (Zero Capex)",
    deltas: {
      kwh_delta_pct: -14.0,
      cost_saved_month_inr: 66000,
      co2_saved_tons: 6.4,
      peak_delta_kw: -64,
      comfort_delta_pct: 2.0
    }
  },
  scenario_b: {
    name: "Full Equipment Retrofit (Inverter + Solar 150 kWp)",
    avg_kwh_day: 1093,
    total_cost_month_inr: 278800,
    co2_tons_month: 26.9,
    peak_demand_kw: 420,
    comfort_compliance_pct: 96,
    efficiency_score: 94,
    payback_label: "2.8 Years Payback",
    deltas: {
      kwh_delta_pct: -40.9,
      cost_saved_month_inr: 192950,
      co2_saved_tons: 18.6,
      peak_delta_kw: -192,
      comfort_delta_pct: 4.0
    }
  },
  optimized: {
    name: "Net Zero AI Campus (Max Shaving + BESS)",
    avg_kwh_day: 773,
    total_cost_month_inr: 197200,
    co2_tons_month: 19.0,
    peak_demand_kw: 310,
    comfort_compliance_pct: 98,
    efficiency_score: 98,
    payback_label: "4.2 Years Payback",
    deltas: {
      kwh_delta_pct: -58.2,
      cost_saved_month_inr: 274550,
      co2_saved_tons: 26.5,
      peak_delta_kw: -302,
      comfort_delta_pct: 6.0
    }
  }
};

export const MOCK_OPTIMIZER_ACTIONS: RankedAction[] = [
  {
    id: "ACT-HVAC-SETBACK",
    rank: 1,
    code: "ACT-HVAC-SETBACK",
    title: "Dynamic Vacancy Setback (22°C → 28°C) in Block B Labs",
    description: "Automatically increase thermostat setpoint when CV confirms >20 min vacancy in academic computer labs.",
    difficulty: 1,
    capex_inr: 0,
    payback_months: 0,
    payback_str: "Immediate",
    saving_kwh_pct: 14.2,
    saving_inr_month: 38400,
    saving_co2_month_t: 3.7,
    peak_reduction_kw: 32,
    comfort_impact_pct: 0,
    category: "Operational",
    score: 95,
    score_pct: 95
  },
  {
    id: "ACT-AUTO-PC",
    rank: 2,
    code: "ACT-AUTO-PC",
    title: "Automated Workstation Sleep Policies for Labs B-204 & B-207",
    description: "Push Active Directory sleep trigger to idle PCs after 15 min of non-use outside scheduled class hours.",
    difficulty: 1,
    capex_inr: 0,
    payback_months: 0,
    payback_str: "Immediate",
    saving_kwh_pct: 6.8,
    saving_inr_month: 18200,
    saving_co2_month_t: 1.8,
    peak_reduction_kw: 12,
    comfort_impact_pct: 0,
    category: "Operational",
    score: 91,
    score_pct: 91
  },
  {
    id: "ACT-PEAK-SHAVE",
    rank: 3,
    code: "ACT-PEAK-SHAVE",
    title: "14:00-15:30 Pre-Cooling & Chiller Staggering",
    description: "Pre-cool lecture halls at 13:00 to shave peak demand below 600 kW contracted cap and avoid penalty surcharges.",
    difficulty: 2,
    capex_inr: 15000,
    payback_months: 1.2,
    payback_str: "1.2 Months",
    saving_kwh_pct: 4.5,
    saving_inr_month: 24500,
    saving_co2_month_t: 1.2,
    peak_reduction_kw: 48,
    comfort_impact_pct: 1.0,
    category: "Controls",
    score: 87,
    score_pct: 87
  },
  {
    id: "ACT-SOLAR-EXPANSION",
    rank: 4,
    code: "ACT-SOLAR-EXPANSION",
    title: "Rooftop Solar PV Installation (150 kWp) on Block B",
    description: "Install Tier-1 bifacial monocrystalline solar panels with string inverters covering 1,100 m² of available roof area.",
    difficulty: 4,
    capex_inr: 5800000,
    payback_months: 38,
    payback_str: "3.2 Years",
    saving_kwh_pct: 35.0,
    saving_inr_month: 152000,
    saving_co2_month_t: 14.8,
    peak_reduction_kw: 120,
    comfort_impact_pct: 0,
    category: "Capital",
    score: 84,
    score_pct: 84
  },
  {
    id: "ACT-INVERTER-RETROFIT",
    rank: 5,
    code: "ACT-INVERTER-RETROFIT",
    title: "Replace Degraded Cassette in B-207 with 5-Star Inverter AC",
    description: "Swap obsolete 8-year-old Voltas unit (COP 1.95) with high-efficiency Daikin Inverter (COP 4.4).",
    difficulty: 2,
    capex_inr: 54000,
    payback_months: 18,
    payback_str: "1.5 Years",
    saving_kwh_pct: 3.2,
    saving_inr_month: 3000,
    saving_co2_month_t: 0.3,
    peak_reduction_kw: 1.8,
    comfort_impact_pct: 3.0,
    category: "Equipment",
    score: 80,
    score_pct: 80
  }
];

export const MOCK_CAMERA_FEED: CVObservation = {
  camera_id: "cam-b204-01",
  zone_id: "B-204",
  active_clip: "b204_vacant_cooling_clip",
  timestamp: new Date().toISOString(),
  privacy_mode: true,
  detection: {
    person_count: 0,
    vacant_seconds: 3120,
    vacant_minutes: 52,
    confidence: 0.98,
    bounding_boxes: []
  },
  equipment_states: [
    { equipment_id: "EQ-B204-AC1", type: "AC", state: "COOLING", confidence: 0.95 },
    { equipment_id: "EQ-B204-LT", type: "LIGHT", state: "ON", confidence: 0.99, lux: 420 },
    { equipment_id: "EQ-B204-PC", type: "PC", state: "IDLE_ON", confidence: 0.92, count_on: 17 }
  ],
  reconciliation: {
    meter_kw: 3.42,
    expected_kw: 0.60,
    unexplained_kw: 2.82,
    diagnosis: "EMPTY_ROOM_CONDITIONING",
    status: "CRITICAL_WASTE",
    narrative: "CV confirms 0 persons in room for 52 minutes while AC compressor draws 3.1 kW and 17 PCs remain powered."
  }
};

export const MOCK_EQUIPMENT_PASSPORTS = [
  {
    id: "EQ-B101-AC1",
    zone_id: "B-101",
    type: "AC",
    make_model: "Daikin VRV Inverter 3.5kW",
    rated_kw: 3.5,
    standby_kw: 0.08,
    cop: 3.6,
    install_date: "2021-04-12",
    age_years: 5.5,
    passport: {
      rated_efficiency: "COP 3.6",
      measured_efficiency: "COP 3.4",
      degradation_pct: 5.5,
      last_service: "2026-05-10",
      health_score: 92
    }
  },
  {
    id: "EQ-B204-AC1",
    zone_id: "B-204",
    type: "AC",
    make_model: "Voltas Cassette 2.0 Ton (Non-Inverter)",
    rated_kw: 3.2,
    standby_kw: 0.12,
    cop: 2.65,
    install_date: "2018-03-22",
    age_years: 8.6,
    passport: {
      rated_efficiency: "COP 2.65 (3-Star 2018)",
      measured_efficiency: "COP 2.32",
      degradation_pct: 12.5,
      last_service: "2025-08-14",
      health_score: 68
    }
  },
  {
    id: "EQ-B207-AC1",
    zone_id: "B-207",
    type: "AC",
    make_model: "Carrier Split Non-Inverter 1.5 Ton",
    rated_kw: 2.8,
    standby_kw: 0.10,
    cop: 2.45,
    install_date: "2016-04-10",
    age_years: 10.5,
    passport: {
      rated_efficiency: "COP 2.45 (2-Star Old)",
      measured_efficiency: "COP 1.95 (Severe Degradation)",
      degradation_pct: 20.4,
      last_service: "2025-06-08",
      health_score: 58
    }
  },
  {
    id: "EQ-B201-AC1",
    zone_id: "B-201",
    type: "AC",
    make_model: "Mitsubishi Heavy Inverter 4.0kW",
    rated_kw: 3.8,
    standby_kw: 0.08,
    cop: 3.8,
    install_date: "2022-09-10",
    age_years: 4.1,
    passport: {
      rated_efficiency: "COP 3.8",
      measured_efficiency: "COP 3.7",
      degradation_pct: 2.6,
      last_service: "2026-04-12",
      health_score: 98
    }
  }
];

export const MOCK_EXECUTIVE_REPORT = {
  title: "PulseGrid Campus Energy & Sustainability Audit Report",
  site: "Aryabhatta Engineering Campus",
  date: "October 15, 2026",
  executive_summary: "During the reporting period, Aryabhatta Engineering Campus maintained an overall Energy Efficiency Score of 74/100. Continuous real-time reconciliation via the PulseGrid Digital Twin identified ₹4,100/day in recoverable Unexplained Load (UL), concentrated primarily in unoccupied academic laboratories in Block B. Implementing the vision-grounded occupancy setback package is projected to deliver ₹66,000/month in net savings and 6.4 tons of CO₂ abatement.",
  monthly_totals: {
    baseline_consumption_kwh: 55500,
    optimized_projection_kwh: 47735,
    savings_kwh: 7765,
    savings_inr: 66000,
    savings_co2_kg: 6367,
    trees_equivalent: 290
  },
  efficiency_score: 74,
  target_score: 85,
  peak_demand: {
    contracted_kw: 600,
    recorded_peak_kw: 612,
    projected_shaved_peak_kw: 548,
    demand_penalty_avoided_inr: 42000
  },
  critical_findings: [
    "Vacant computer laboratories in Block B (B-204 & B-207) account for 71% of total campus unexplained energy waste.",
    "Compressor degradation in unit EQ-B207-AC1 reduced COP to 1.95, drawing 40% excess power.",
    "Unmanaged workstation power schedules result in 2.38 kW persistent off-hours idle power."
  ]
};

export const MOCK_BRIEFING = {
  headline: "Campus Operating at 74/100 Efficiency — ₹4,100/day Recoverable Waste Identified",
  content: "Good afternoon. Aryabhatta Campus is drawing 118.5 kW with 3.42 kW unexplained load. Lab B-204 has been vacant for 52 minutes with AC active at 22°C. Applying automated setback will recover ₹287/day immediately.",
  generated_at: new Date().toISOString(),
  confidence: "High (0.97)"
};
