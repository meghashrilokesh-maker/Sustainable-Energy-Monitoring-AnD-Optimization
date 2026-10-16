"use client";

import React, { useState, useMemo } from "react";
import { 
  Layers, 
  Clock, 
  Flame, 
  Zap, 
  Users, 
  Thermometer, 
  AlertTriangle, 
  Box, 
  ExternalLink, 
  Info,
  Sliders,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { ZoneState, ZoneMetadata } from "../lib/types";
import styles from "./DigitalTwinView.module.css";

// Fallback campus zones for Block-B and Block-A from backend/data/zones.json
const CAMPUS_FALLBACK_ZONES: ZoneMetadata[] = [
  // Block-B Floor 1
  { id: "B-101", building_id: "Block-B", floor: 1, name: "Computer Lab 1", type: "lab", area_m2: 110, volume_m3: 330, polygon: [[10, 10], [90, 10], [90, 80], [10, 80]], thermal_R: 0.045, thermal_C: 18.5, comfort_min_c: 22.0, comfort_max_c: 26.0, camera_id: "cam-b101", meter_id: "M-B101" },
  { id: "B-102", building_id: "Block-B", floor: 1, name: "IoT & Embedded Lab", type: "lab", area_m2: 95, volume_m3: 285, polygon: [[95, 10], [175, 10], [175, 80], [95, 80]], thermal_R: 0.048, thermal_C: 16.0, comfort_min_c: 22.0, comfort_max_c: 26.0, camera_id: "cam-b102", meter_id: "M-B102" },
  { id: "B-103", building_id: "Block-B", floor: 1, name: "Lecture Hall 101", type: "classroom", area_m2: 140, volume_m3: 440, polygon: [[180, 10], [280, 10], [280, 80], [180, 80]], thermal_R: 0.040, thermal_C: 22.0, comfort_min_c: 22.0, comfort_max_c: 26.0, camera_id: "cam-b103", meter_id: "M-B103" },
  { id: "B-104", building_id: "Block-B", floor: 1, name: "Faculty Cabin A", type: "office", area_m2: 55, volume_m3: 165, polygon: [[10, 85], [90, 85], [90, 145], [10, 145]], thermal_R: 0.065, thermal_C: 10.5, comfort_min_c: 22.5, comfort_max_c: 26.0, camera_id: "cam-b104", meter_id: "M-B104" },
  { id: "B-105", building_id: "Block-B", floor: 1, name: "Corridor & Concourse L1", type: "corridor", area_m2: 120, volume_m3: 360, polygon: [[95, 85], [175, 85], [175, 145], [95, 145]], thermal_R: 0.035, thermal_C: 15.0, comfort_min_c: 21.0, comfort_max_c: 28.0, camera_id: "cam-b105", meter_id: "M-B105" },
  { id: "B-106", building_id: "Block-B", floor: 1, name: "Robotics Workshop", type: "lab", area_m2: 130, volume_m3: 400, polygon: [[180, 85], [280, 85], [280, 145], [180, 145]], thermal_R: 0.042, thermal_C: 20.0, comfort_min_c: 22.0, comfort_max_c: 26.5, camera_id: "cam-b106", meter_id: "M-B106" },
  // Block-B Floor 2
  { id: "B-201", building_id: "Block-B", floor: 2, name: "AI & Machine Learning Lab", type: "lab", area_m2: 115, volume_m3: 345, polygon: [[10, 10], [90, 10], [90, 80], [10, 80]], thermal_R: 0.046, thermal_C: 19.0, comfort_min_c: 22.0, comfort_max_c: 25.5, camera_id: "cam-b201", meter_id: "M-B201" },
  { id: "B-202", building_id: "Block-B", floor: 2, name: "Data Science Lab", type: "lab", area_m2: 95, volume_m3: 285, polygon: [[95, 10], [175, 10], [175, 80], [95, 80]], thermal_R: 0.047, thermal_C: 16.5, comfort_min_c: 22.0, comfort_max_c: 25.5, camera_id: "cam-b202", meter_id: "M-B202" },
  { id: "B-203", building_id: "Block-B", floor: 2, name: "Lecture Hall 201", type: "classroom", area_m2: 140, volume_m3: 440, polygon: [[180, 10], [280, 10], [280, 80], [180, 80]], thermal_R: 0.041, thermal_C: 22.5, comfort_min_c: 22.0, comfort_max_c: 26.0, camera_id: "cam-b203", meter_id: "M-B203" },
  { id: "B-204", building_id: "Block-B", floor: 2, name: "Advanced Computing Lab", type: "lab", area_m2: 125, volume_m3: 375, polygon: [[10, 85], [90, 85], [90, 145], [10, 145]], thermal_R: 0.043, thermal_C: 19.5, comfort_min_c: 22.0, comfort_max_c: 25.0, camera_id: "cam-b204-01", meter_id: "M-B204" },
  { id: "B-205", building_id: "Block-B", floor: 2, name: "Corridor & Study Lounge L2", type: "corridor", area_m2: 120, volume_m3: 360, polygon: [[95, 85], [175, 85], [175, 145], [95, 145]], thermal_R: 0.038, thermal_C: 15.5, comfort_min_c: 21.0, comfort_max_c: 27.5, camera_id: "cam-b205", meter_id: "M-B205" },
  { id: "B-207", building_id: "Block-B", floor: 2, name: "Cybersecurity & Networks Lab", type: "lab", area_m2: 110, volume_m3: 330, polygon: [[180, 85], [280, 85], [280, 145], [180, 145]], thermal_R: 0.045, thermal_C: 18.0, comfort_min_c: 22.0, comfort_max_c: 25.5, camera_id: "cam-b207", meter_id: "M-B207" },
  // Block-A Floor 1
  { id: "A-101", building_id: "Block-A", floor: 1, name: "Campus Admin Office", type: "office", area_m2: 130, volume_m3: 390, polygon: [[10, 10], [90, 10], [90, 80], [10, 80]], thermal_R: 0.052, thermal_C: 18.0, comfort_min_c: 22.5, comfort_max_c: 26.0, camera_id: "cam-a101", meter_id: "M-A101" },
  { id: "A-102", building_id: "Block-A", floor: 1, name: "Executive Conference Room", type: "office", area_m2: 80, volume_m3: 240, polygon: [[95, 10], [175, 10], [175, 80], [95, 80]], thermal_R: 0.055, thermal_C: 14.0, comfort_min_c: 22.0, comfort_max_c: 25.0, camera_id: "cam-a102", meter_id: "M-A102" },
  { id: "A-103", building_id: "Block-A", floor: 1, name: "Lecture Theater A1", type: "classroom", area_m2: 150, volume_m3: 480, polygon: [[180, 10], [280, 10], [280, 80], [180, 80]], thermal_R: 0.042, thermal_C: 24.0, comfort_min_c: 22.0, comfort_max_c: 26.0, camera_id: "cam-a103", meter_id: "M-A103" },
  // Block-A Floor 2
  { id: "A-201", building_id: "Block-A", floor: 2, name: "Central Library & Digital Reading", type: "office", area_m2: 180, volume_m3: 540, polygon: [[10, 10], [100, 10], [100, 80], [10, 80]], thermal_R: 0.048, thermal_C: 28.0, comfort_min_c: 22.5, comfort_max_c: 26.0, camera_id: "cam-a201", meter_id: "M-A201" },
  { id: "A-202", building_id: "Block-A", floor: 2, name: "Faculty Research Hub", type: "office", area_m2: 85, volume_m3: 255, polygon: [[105, 10], [175, 10], [175, 80], [105, 80]], thermal_R: 0.054, thermal_C: 15.0, comfort_min_c: 22.0, comfort_max_c: 26.0, camera_id: "cam-a202", meter_id: "M-A202" },
  { id: "A-203", building_id: "Block-A", floor: 2, name: "Auditorium Seminar Hall", type: "classroom", area_m2: 210, volume_m3: 680, polygon: [[180, 10], [280, 10], [280, 80], [180, 80]], thermal_R: 0.038, thermal_C: 32.0, comfort_min_c: 22.0, comfort_max_c: 26.0, camera_id: "cam-a203", meter_id: "M-A203" }
];

const CAMPUS_FALLBACK_STATES: ZoneState[] = [
  { zone_id: "B-101", name: "Computer Lab 1", building_id: "Block-B", floor: 1, type: "lab", area_m2: 110, occupancy: 24, vacant_seconds: 0, temp_c: 23.4, outdoor_temp_c: 32.5, setpoint_c: 24.0, rh_pct: 54, co2_ppm: 680, measured_kw: 1.85, expected_kw: 1.80, unexplained_kw: 0.05, category_breakdown: { hvac: 1.1, lighting: 0.35, plug_loads: 0.4, other: 0.0 }, equipment_states: { hvac: "COOLING_NORMAL", lights: "ON", pcs_on: 24, fan: "AUTO", window: "CLOSED" }, data_quality: "GOOD", confidence: 0.95, last_updated: new Date().toISOString() },
  { zone_id: "B-102", name: "IoT & Embedded Lab", building_id: "Block-B", floor: 1, type: "lab", area_m2: 95, occupancy: 16, vacant_seconds: 0, temp_c: 23.8, outdoor_temp_c: 32.5, setpoint_c: 24.0, rh_pct: 52, co2_ppm: 620, measured_kw: 1.10, expected_kw: 1.05, unexplained_kw: 0.05, category_breakdown: { hvac: 0.65, lighting: 0.25, plug_loads: 0.2, other: 0.0 }, equipment_states: { hvac: "COOLING_NORMAL", lights: "ON", pcs_on: 16, fan: "AUTO", window: "CLOSED" }, data_quality: "GOOD", confidence: 0.94, last_updated: new Date().toISOString() },
  { zone_id: "B-103", name: "Lecture Hall 101", building_id: "Block-B", floor: 1, type: "classroom", area_m2: 140, occupancy: 42, vacant_seconds: 0, temp_c: 24.1, outdoor_temp_c: 32.5, setpoint_c: 24.0, rh_pct: 56, co2_ppm: 820, measured_kw: 2.10, expected_kw: 2.00, unexplained_kw: 0.10, category_breakdown: { hvac: 1.45, lighting: 0.45, plug_loads: 0.2, other: 0.0 }, equipment_states: { hvac: "COOLING_NORMAL", lights: "ON", pcs_on: 2, fan: "AUTO", window: "CLOSED" }, data_quality: "GOOD", confidence: 0.96, last_updated: new Date().toISOString() },
  { zone_id: "B-104", name: "Faculty Cabin A", building_id: "Block-B", floor: 1, type: "office", area_m2: 55, occupancy: 3, vacant_seconds: 0, temp_c: 24.0, outdoor_temp_c: 32.5, setpoint_c: 24.0, rh_pct: 50, co2_ppm: 520, measured_kw: 0.45, expected_kw: 0.40, unexplained_kw: 0.05, category_breakdown: { hvac: 0.28, lighting: 0.1, plug_loads: 0.07, other: 0.0 }, equipment_states: { hvac: "COOLING_NORMAL", lights: "ON", pcs_on: 3, fan: "LOW", window: "CLOSED" }, data_quality: "GOOD", confidence: 0.92, last_updated: new Date().toISOString() },
  { zone_id: "B-105", name: "Corridor & Concourse L1", building_id: "Block-B", floor: 1, type: "corridor", area_m2: 120, occupancy: 8, vacant_seconds: 0, temp_c: 25.2, outdoor_temp_c: 32.5, setpoint_c: 25.0, rh_pct: 55, co2_ppm: 490, measured_kw: 0.80, expected_kw: 0.80, unexplained_kw: 0.00, category_breakdown: { hvac: 0.0, lighting: 0.8, plug_loads: 0.0, other: 0.0 }, equipment_states: { hvac: "OFF", lights: "ON", pcs_on: 0, fan: "OFF", window: "OPEN" }, data_quality: "GOOD", confidence: 0.91, last_updated: new Date().toISOString() },
  { zone_id: "B-106", name: "Robotics Workshop", building_id: "Block-B", floor: 1, type: "lab", area_m2: 130, occupancy: 14, vacant_seconds: 0, temp_c: 23.6, outdoor_temp_c: 32.5, setpoint_c: 24.0, rh_pct: 53, co2_ppm: 590, measured_kw: 1.95, expected_kw: 1.85, unexplained_kw: 0.10, category_breakdown: { hvac: 1.15, lighting: 0.4, plug_loads: 0.4, other: 0.0 }, equipment_states: { hvac: "COOLING_NORMAL", lights: "ON", pcs_on: 12, fan: "AUTO", window: "CLOSED" }, data_quality: "GOOD", confidence: 0.95, last_updated: new Date().toISOString() },
  { zone_id: "B-201", name: "AI & Machine Learning Lab", building_id: "Block-B", floor: 2, type: "lab", area_m2: 115, occupancy: 22, vacant_seconds: 0, temp_c: 23.5, outdoor_temp_c: 32.5, setpoint_c: 24.0, rh_pct: 52, co2_ppm: 690, measured_kw: 2.40, expected_kw: 2.30, unexplained_kw: 0.10, category_breakdown: { hvac: 1.35, lighting: 0.35, plug_loads: 0.7, other: 0.0 }, equipment_states: { hvac: "COOLING_NORMAL", lights: "ON", pcs_on: 22, fan: "AUTO", window: "CLOSED" }, data_quality: "GOOD", confidence: 0.96, last_updated: new Date().toISOString() },
  { zone_id: "B-202", name: "Data Science Lab", building_id: "Block-B", floor: 2, type: "lab", area_m2: 95, occupancy: 18, vacant_seconds: 0, temp_c: 23.9, outdoor_temp_c: 32.5, setpoint_c: 24.0, rh_pct: 51, co2_ppm: 640, measured_kw: 1.65, expected_kw: 1.60, unexplained_kw: 0.05, category_breakdown: { hvac: 0.95, lighting: 0.3, plug_loads: 0.4, other: 0.0 }, equipment_states: { hvac: "COOLING_NORMAL", lights: "ON", pcs_on: 18, fan: "AUTO", window: "CLOSED" }, data_quality: "GOOD", confidence: 0.94, last_updated: new Date().toISOString() },
  { zone_id: "B-203", name: "Lecture Hall 201", building_id: "Block-B", floor: 2, type: "classroom", area_m2: 140, occupancy: 38, vacant_seconds: 0, temp_c: 24.2, outdoor_temp_c: 32.5, setpoint_c: 24.0, rh_pct: 55, co2_ppm: 780, measured_kw: 2.80, expected_kw: 2.70, unexplained_kw: 0.10, category_breakdown: { hvac: 1.9, lighting: 0.6, plug_loads: 0.3, other: 0.0 }, equipment_states: { hvac: "COOLING_NORMAL", lights: "ON", pcs_on: 4, fan: "AUTO", window: "CLOSED" }, data_quality: "GOOD", confidence: 0.95, last_updated: new Date().toISOString() },
  { zone_id: "B-204", name: "Advanced Computing Lab", building_id: "Block-B", floor: 2, type: "lab", area_m2: 125, occupancy: 0, vacant_seconds: 2840, temp_c: 20.8, outdoor_temp_c: 32.5, setpoint_c: 20.0, rh_pct: 46, co2_ppm: 430, measured_kw: 3.42, expected_kw: 1.20, unexplained_kw: 2.22, category_breakdown: { hvac: 2.65, lighting: 0.52, plug_loads: 0.25, other: 0.0 }, equipment_states: { hvac: "COOLING_HIGH", lights: "ON", pcs_on: 24, fan: "HIGH", window: "CLOSED" }, data_quality: "FAULT_ACTIVE", confidence: 0.98, last_updated: new Date().toISOString() },
  { zone_id: "B-205", name: "Corridor & Study Lounge L2", building_id: "Block-B", floor: 2, type: "corridor", area_m2: 120, occupancy: 6, vacant_seconds: 0, temp_c: 25.1, outdoor_temp_c: 32.5, setpoint_c: 25.0, rh_pct: 54, co2_ppm: 510, measured_kw: 0.90, expected_kw: 0.85, unexplained_kw: 0.05, category_breakdown: { hvac: 0.0, lighting: 0.9, plug_loads: 0.0, other: 0.0 }, equipment_states: { hvac: "OFF", lights: "ON", pcs_on: 0, fan: "OFF", window: "CLOSED" }, data_quality: "GOOD", confidence: 0.93, last_updated: new Date().toISOString() },
  { zone_id: "B-207", name: "Cybersecurity & Networks Lab", building_id: "Block-B", floor: 2, type: "lab", area_m2: 110, occupancy: 0, vacant_seconds: 1420, temp_c: 21.8, outdoor_temp_c: 32.5, setpoint_c: 22.0, rh_pct: 48, co2_ppm: 450, measured_kw: 2.75, expected_kw: 1.90, unexplained_kw: 0.85, category_breakdown: { hvac: 1.95, lighting: 0.45, plug_loads: 0.35, other: 0.0 }, equipment_states: { hvac: "COOLING_HIGH", lights: "ON", pcs_on: 15, fan: "MED", window: "CLOSED" }, data_quality: "SUSPICIOUS", confidence: 0.92, last_updated: new Date().toISOString() },
  { zone_id: "A-101", name: "Campus Admin Office", building_id: "Block-A", floor: 1, type: "office", area_m2: 130, occupancy: 12, vacant_seconds: 0, temp_c: 23.5, outdoor_temp_c: 32.5, setpoint_c: 24.0, rh_pct: 50, co2_ppm: 550, measured_kw: 1.40, expected_kw: 1.35, unexplained_kw: 0.05, category_breakdown: { hvac: 0.8, lighting: 0.35, plug_loads: 0.25, other: 0.0 }, equipment_states: { hvac: "COOLING_NORMAL", lights: "ON", pcs_on: 12, fan: "AUTO", window: "CLOSED" }, data_quality: "GOOD", confidence: 0.94, last_updated: new Date().toISOString() },
  { zone_id: "A-102", name: "Executive Conference Room", building_id: "Block-A", floor: 1, type: "office", area_m2: 80, occupancy: 6, vacant_seconds: 0, temp_c: 23.2, outdoor_temp_c: 32.5, setpoint_c: 23.0, rh_pct: 48, co2_ppm: 520, measured_kw: 0.95, expected_kw: 0.90, unexplained_kw: 0.05, category_breakdown: { hvac: 0.6, lighting: 0.2, plug_loads: 0.15, other: 0.0 }, equipment_states: { hvac: "COOLING_NORMAL", lights: "ON", pcs_on: 2, fan: "AUTO", window: "CLOSED" }, data_quality: "GOOD", confidence: 0.95, last_updated: new Date().toISOString() },
  { zone_id: "A-103", name: "Lecture Theater A1", building_id: "Block-A", floor: 1, type: "classroom", area_m2: 150, occupancy: 60, vacant_seconds: 0, temp_c: 24.0, outdoor_temp_c: 32.5, setpoint_c: 24.0, rh_pct: 58, co2_ppm: 890, measured_kw: 2.85, expected_kw: 2.75, unexplained_kw: 0.10, category_breakdown: { hvac: 2.0, lighting: 0.55, plug_loads: 0.3, other: 0.0 }, equipment_states: { hvac: "COOLING_NORMAL", lights: "ON", pcs_on: 2, fan: "AUTO", window: "CLOSED" }, data_quality: "GOOD", confidence: 0.96, last_updated: new Date().toISOString() },
  { zone_id: "A-201", name: "Central Library & Digital Reading", building_id: "Block-A", floor: 2, type: "office", area_m2: 180, occupancy: 45, vacant_seconds: 0, temp_c: 23.6, outdoor_temp_c: 32.5, setpoint_c: 24.0, rh_pct: 52, co2_ppm: 710, measured_kw: 2.20, expected_kw: 2.10, unexplained_kw: 0.10, category_breakdown: { hvac: 1.3, lighting: 0.6, plug_loads: 0.3, other: 0.0 }, equipment_states: { hvac: "COOLING_NORMAL", lights: "ON", pcs_on: 20, fan: "AUTO", window: "CLOSED" }, data_quality: "GOOD", confidence: 0.95, last_updated: new Date().toISOString() },
  { zone_id: "A-202", name: "Faculty Research Hub", building_id: "Block-A", floor: 2, type: "office", area_m2: 85, occupancy: 10, vacant_seconds: 0, temp_c: 23.8, outdoor_temp_c: 32.5, setpoint_c: 24.0, rh_pct: 50, co2_ppm: 560, measured_kw: 1.15, expected_kw: 1.10, unexplained_kw: 0.05, category_breakdown: { hvac: 0.7, lighting: 0.25, plug_loads: 0.2, other: 0.0 }, equipment_states: { hvac: "COOLING_NORMAL", lights: "ON", pcs_on: 10, fan: "AUTO", window: "CLOSED" }, data_quality: "GOOD", confidence: 0.93, last_updated: new Date().toISOString() },
  { zone_id: "A-203", name: "Auditorium Seminar Hall", building_id: "Block-A", floor: 2, type: "classroom", area_m2: 210, occupancy: 85, vacant_seconds: 0, temp_c: 24.2, outdoor_temp_c: 32.5, setpoint_c: 24.0, rh_pct: 60, co2_ppm: 940, measured_kw: 3.60, expected_kw: 3.45, unexplained_kw: 0.15, category_breakdown: { hvac: 2.7, lighting: 0.6, plug_loads: 0.3, other: 0.0 }, equipment_states: { hvac: "COOLING_NORMAL", lights: "ON", pcs_on: 4, fan: "AUTO", window: "CLOSED" }, data_quality: "GOOD", confidence: 0.97, last_updated: new Date().toISOString() }
];

interface DigitalTwinProps {
  zones: ZoneMetadata[];
  zoneStates: ZoneState[];
  onForkScenario: (zoneId: string) => void;
}

export const DigitalTwinView: React.FC<DigitalTwinProps> = ({
  zones: propZones,
  zoneStates: propZoneStates,
  onForkScenario
}) => {
  const [activeLayer, setActiveLayer] = useState<"waste" | "power" | "occupancy" | "temp" | "anomalies">("waste");
  const [selectedFloor, setSelectedFloor] = useState<number>(2);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("Block-B");
  const [selectedZoneId, setSelectedZoneId] = useState<string>("B-204");
  const [timeOffsetHours, setTimeOffsetHours] = useState<number>(0);
  const [is3DIsometric, setIs3DIsometric] = useState<boolean>(false);

  // Fallback resilience: Use live backend data if available, otherwise use campus fallback metadata
  const effectiveZones = useMemo(() => {
    return (propZones && propZones.length > 0) ? propZones : CAMPUS_FALLBACK_ZONES;
  }, [propZones]);

  const effectiveZoneStates = useMemo(() => {
    return (propZoneStates && propZoneStates.length > 0) ? propZoneStates : CAMPUS_FALLBACK_STATES;
  }, [propZoneStates]);

  // Filter zones for selected building & floor
  const filteredZones = useMemo(() => {
    return effectiveZones.filter(
      z => z.building_id === selectedBuilding && z.floor === selectedFloor
    );
  }, [effectiveZones, selectedBuilding, selectedFloor]);

  // Find selected zone or default to first in filtered
  const selectedZone = effectiveZones.find(z => z.id === selectedZoneId) || filteredZones[0] || effectiveZones[0];
  const selectedState = effectiveZoneStates.find(s => s.zone_id === selectedZone?.id) || CAMPUS_FALLBACK_STATES[0];

  // Color generator based on active layer
  const getZoneFillColor = (zoneId: string) => {
    const state = effectiveZoneStates.find(s => s.zone_id === zoneId);
    if (!state) return "#1e293b";

    if (activeLayer === "waste") {
      if (state.unexplained_kw > 1.2) return "rgba(244, 63, 94, 0.85)"; // Red hotspot
      if (state.unexplained_kw > 0.4) return "rgba(245, 158, 11, 0.75)"; // Amber
      return "rgba(16, 185, 129, 0.45)"; // Normal Green
    } else if (activeLayer === "power") {
      const density = (state.measured_kw * 1000) / (state.area_m2 || 100);
      if (density > 25) return "rgba(56, 189, 248, 0.85)";
      if (density > 15) return "rgba(56, 189, 248, 0.55)";
      return "rgba(56, 189, 248, 0.30)";
    } else if (activeLayer === "occupancy") {
      if (state.occupancy > 20) return "rgba(168, 85, 247, 0.85)";
      if (state.occupancy > 0) return "rgba(168, 85, 247, 0.50)";
      return "rgba(51, 65, 85, 0.40)";
    } else if (activeLayer === "temp") {
      if (state.temp_c > 25.0) return "rgba(239, 68, 68, 0.75)";
      if (state.temp_c < 22.0) return "rgba(59, 130, 246, 0.75)";
      return "rgba(16, 185, 129, 0.50)";
    } else {
      // Anomalies
      if (zoneId === "B-204") return "rgba(244, 63, 94, 0.85)";
      if (zoneId === "B-207") return "rgba(245, 158, 11, 0.75)";
      return "rgba(16, 185, 129, 0.45)";
    }
  };

  return (
    <div className={styles.container}>
      {/* Top Controls: Building/Floor picker, Layer Switcher, 2.5D Toggle */}
      <div className={styles.topBar}>
        <div className={styles.controlsGroup}>
          {/* Building Picker */}
          <div className={styles.segmentedBox}>
            <button
              onClick={() => {
                setSelectedBuilding("Block-B");
                setSelectedZoneId("B-204");
              }}
              className={selectedBuilding === "Block-B" ? styles.btnPrimary : styles.btnGhost}
            >
              Block B (Active Twin)
            </button>
            <button
              onClick={() => {
                setSelectedBuilding("Block-A");
                setSelectedZoneId("A-201");
              }}
              className={selectedBuilding === "Block-A" ? styles.btnPrimary : styles.btnGhost}
            >
              Block A (Admin & Hall)
            </button>
          </div>

          {/* Floor Picker */}
          <div className={styles.segmentedBox}>
            <button
              onClick={() => setSelectedFloor(1)}
              className={selectedFloor === 1 ? styles.btnSecondary : styles.btnGhost}
            >
              Level 1
            </button>
            <button
              onClick={() => setSelectedFloor(2)}
              className={selectedFloor === 2 ? styles.btnSecondary : styles.btnGhost}
            >
              Level 2
            </button>
          </div>
        </div>

        {/* Layer Switcher & 2.5D Isometric */}
        <div className={styles.controlsGroup}>
          {[
            { id: "waste", label: "Waste (UL)", icon: Flame, color: "#f43f5e" },
            { id: "power", label: "Power Density", icon: Zap, color: "#38bdf8" },
            { id: "occupancy", label: "Occupancy (CV)", icon: Users, color: "#a855f7" },
            { id: "temp", label: "Thermal (°C)", icon: Thermometer, color: "#10b981" },
            { id: "anomalies", label: "Anomalies", icon: AlertTriangle, color: "#f59e0b" }
          ].map(layer => {
            const Icon = layer.icon;
            const isActive = activeLayer === layer.id;
            return (
              <button
                key={layer.id}
                onClick={() => setActiveLayer(layer.id as any)}
                className={isActive ? styles.layerBtnActive : styles.layerBtn}
              >
                <Icon size={14} color={layer.color} />
                <span>{layer.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => setIs3DIsometric(!is3DIsometric)}
            className={is3DIsometric ? styles.isoToggleBtnActive : styles.isoToggleBtn}
          >
            <Box size={14} color="#38bdf8" />
            <span>2.5D Isometric</span>
          </button>
        </div>
      </div>

      {/* Main Twin Space: Spatial Floor Plan (Left) + Zone Detail Drawer (Right) */}
      <div className={styles.mainGrid}>
        {/* Spatial Floor Plan Canvas */}
        <div className={styles.floorPlanCard}>
          <div>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>
                Spatial Floor Plan: {selectedBuilding} Level {selectedFloor}
              </span>
              <span>Click on any room polygon to inspect physics passport</span>
            </div>

            {/* SVG Interactive Floor Plan with Optional 2.5D Transform */}
            <div className={`${styles.svgViewport} ${is3DIsometric ? styles.svgViewportIso : ""}`}>
              {/* Floor Plan Coordinate Grid */}
              <svg viewBox="0 0 300 160" style={{ width: "100%", height: "100%", userSelect: "none" }}>
                <defs>
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="300" height="160" fill="url(#grid)" />

                {/* Render Zone Polygons */}
                {filteredZones.map(zone => {
                  const state = effectiveZoneStates.find(s => s.zone_id === zone.id);
                  const isSelected = selectedZoneId === zone.id;
                  const fillColor = getZoneFillColor(zone.id);

                  // Extract polygon points
                  const points = zone.polygon.map(p => `${p[0]},${p[1]}`).join(" ");
                  const centerX = (zone.polygon[0][0] + zone.polygon[2][0]) / 2;
                  const centerY = (zone.polygon[0][1] + zone.polygon[2][1]) / 2;

                  return (
                    <g 
                      key={zone.id} 
                      onClick={() => setSelectedZoneId(zone.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <polygon
                        points={points}
                        fill={fillColor}
                        stroke={isSelected ? "#38bdf8" : "rgba(255,255,255,0.35)"}
                        strokeWidth={isSelected ? "2.5" : "1"}
                        style={{
                          transition: "fill 0.2s ease, stroke 0.2s ease, filter 0.2s ease",
                          filter: isSelected ? "drop-shadow(0 0 8px rgba(56, 189, 248, 0.6))" : "none"
                        }}
                      />
                      {/* Zone Name Label */}
                      <text
                        x={centerX}
                        y={centerY - 6}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="6.5"
                        fontWeight="bold"
                        letterSpacing="0.5"
                        style={{ pointerEvents: "none" }}
                      >
                        {zone.id}
                      </text>
                      {/* Sub-Metric Label */}
                      <text
                        x={centerX}
                        y={centerY + 6}
                        textAnchor="middle"
                        fill={state && state.unexplained_kw > 1 ? "#fca5a5" : "#cbd5e1"}
                        fontSize="5"
                        fontFamily="monospace"
                        fontWeight="600"
                        style={{ pointerEvents: "none" }}
                      >
                        {activeLayer === "waste" 
                          ? `UL: +${state?.unexplained_kw?.toFixed(2) || 0} kW`
                          : activeLayer === "occupancy"
                          ? `Occ: ${state?.occupancy || 0}`
                          : `${state?.measured_kw?.toFixed(2) || 0} kW`}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Time Scrubber */}
          <div className={styles.timeScrubberBox}>
            <div className={styles.scrubberHeader}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                <Clock size={14} color="#38bdf8" />
                <span>Time-Travel Scrubber (Twin State Explorer)</span>
              </span>
              <span style={{ fontFamily: "monospace", color: "#38bdf8", fontWeight: 700 }}>
                {timeOffsetHours === 0 
                  ? "NOW (Live State)" 
                  : timeOffsetHours < 0 
                  ? `${Math.abs(timeOffsetHours)}h in Past (Replay)` 
                  : `+${timeOffsetHours}h in Future (Forecast)`}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "10px", color: "#64748b", fontFamily: "monospace" }}>-24h</span>
              <input
                type="range"
                min="-24"
                max="12"
                step="1"
                value={timeOffsetHours}
                onChange={(e) => setTimeOffsetHours(parseInt(e.target.value))}
                style={{ width: "100%", accentColor: "#0891b2", cursor: "pointer" }}
              />
              <span style={{ fontSize: "10px", color: "#64748b", fontFamily: "monospace" }}>+12h</span>
            </div>
            <p style={{ fontSize: "10px", color: "#64748b", marginTop: "4px" }}>
              Replay historical snapshots or simulate forward predictive states.
            </p>
          </div>
        </div>

        {/* Right: Zone Detail Drawer */}
        <aside className={styles.detailDrawer}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className={styles.drawerHeader}>
              <div>
                <span style={{ fontSize: "10px", fontFamily: "monospace", color: "#38bdf8", fontWeight: 700, textTransform: "uppercase" }}>
                  Zone Digital Twin
                </span>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", margin: "2px 0" }}>
                  {selectedZone?.name}
                </h3>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                  {selectedZone?.id} • {selectedZone?.type?.toUpperCase()}
                </span>
              </div>

              <span style={{
                padding: "3px 8px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 700,
                fontFamily: "monospace",
                background: selectedState && selectedState.unexplained_kw > 1 ? "rgba(244, 63, 94, 0.2)" : "rgba(16, 185, 129, 0.2)",
                border: selectedState && selectedState.unexplained_kw > 1 ? "1px solid #f43f5e" : "1px solid #10b981",
                color: selectedState && selectedState.unexplained_kw > 1 ? "#fb7185" : "#34d399",
              }}>
                {selectedState && selectedState.unexplained_kw > 1 ? "HIGH RESIDUAL" : "JUSTIFIED"}
              </span>
            </div>

            {/* Core Physics Metrics Grid */}
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <span style={{ color: "#94a3b8", fontSize: "10px" }}>Occupancy (CV)</span>
                <div style={{ fontSize: "16px", fontWeight: 700, fontFamily: "monospace", color: "#ffffff", marginTop: "2px" }}>
                  {selectedState?.occupancy ?? 0} Occupants
                </div>
                <div style={{ fontSize: "10px", color: "#64748b" }}>
                  {selectedState?.vacant_seconds ? `Vacant ${(selectedState.vacant_seconds/60).toFixed(0)} min` : "Active"}
                </div>
              </div>

              <div className={styles.metricCard}>
                <span style={{ color: "#94a3b8", fontSize: "10px" }}>Indoor Temperature</span>
                <div style={{ fontSize: "16px", fontWeight: 700, fontFamily: "monospace", color: "#ffffff", marginTop: "2px" }}>
                  {selectedState?.temp_c?.toFixed(1) ?? "23.5"}°C
                </div>
                <div style={{ fontSize: "10px", color: "#64748b" }}>
                  Setpoint: {selectedState?.setpoint_c ?? 22}°C
                </div>
              </div>

              <div className={styles.metricCard}>
                <span style={{ color: "#94a3b8", fontSize: "10px" }}>Measured Power</span>
                <div style={{ fontSize: "16px", fontWeight: 700, fontFamily: "monospace", color: "#38bdf8", marginTop: "2px" }}>
                  {selectedState?.measured_kw?.toFixed(2) ?? "0.50"} kW
                </div>
                <div style={{ fontSize: "10px", color: "#64748b" }}>
                  Expected: {selectedState?.expected_kw?.toFixed(2) ?? "0.50"} kW
                </div>
              </div>

              <div className={styles.metricCardWaste}>
                <span style={{ color: "#fb7185", fontSize: "10px" }}>Unexplained Load (UL)</span>
                <div style={{ fontSize: "16px", fontWeight: 700, fontFamily: "monospace", color: "#f43f5e", marginTop: "2px" }}>
                  +{selectedState?.unexplained_kw?.toFixed(2) ?? "0.00"} kW
                </div>
                <div style={{ fontSize: "10px", color: "#fda4af" }}>
                  Thermal residual waste
                </div>
              </div>
            </div>

            {/* Thermal Parameters & Physics Model */}
            <div className={styles.passportBox}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>
                1R1C Thermal Parameters (Physics Passport)
              </span>
              <div className={styles.passportRow}>
                <span>Thermal Resistance (R):</span>
                <span style={{ fontFamily: "monospace", color: "#f1f5f9" }}>{selectedZone?.thermal_R} K/kW</span>
              </div>
              <div className={styles.passportRow}>
                <span>Thermal Capacity (C):</span>
                <span style={{ fontFamily: "monospace", color: "#f1f5f9" }}>{selectedZone?.thermal_C} kWh/K</span>
              </div>
              <div className={styles.passportRow}>
                <span>Floor Area / Volume:</span>
                <span style={{ fontFamily: "monospace", color: "#f1f5f9" }}>{selectedZone?.area_m2} m² / {selectedZone?.volume_m3} m³</span>
              </div>
            </div>

            {/* Digital Equipment Passport Highlights */}
            <div className={styles.equipmentBox}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>
                Equipment Digital Passport
              </span>
              {selectedZone?.id === "B-204" ? (
                <div style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
                  <div>Model: <strong style={{ color: "#ffffff" }}>Voltas Cassette 2.0 Ton (Non-Inv)</strong></div>
                  <div>Health Score: <span style={{ color: "#f59e0b", fontWeight: 700 }}>68/100 (Degraded)</span></div>
                  <div>Measured COP: <span style={{ fontFamily: "monospace", color: "#f59e0b" }}>2.32 (vs 2.65 rated)</span></div>
                  <div style={{ color: "#34d399", fontSize: "11px" }}>Retrofit Payback: 2.28 years</div>
                </div>
              ) : selectedZone?.id === "B-207" ? (
                <div style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
                  <div>Model: <strong style={{ color: "#ffffff" }}>Carrier Split 1.5 Ton (Old Unit)</strong></div>
                  <div>Health Score: <span style={{ color: "#f43f5e", fontWeight: 700 }}>58/100 (Severe Wear)</span></div>
                  <div>Measured COP: <span style={{ fontFamily: "monospace", color: "#f43f5e" }}>1.95 (20.4% loss)</span></div>
                  <div style={{ color: "#34d399", fontSize: "11px" }}>Retrofit Payback: 1.64 years</div>
                </div>
              ) : (
                <div style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
                  <div>Model: <strong style={{ color: "#ffffff" }}>Daikin VRV Inverter Unit</strong></div>
                  <div>Health Score: <span style={{ color: "#34d399", fontWeight: 700 }}>94/100 (Nominal)</span></div>
                  <div>Measured COP: <span style={{ fontFamily: "monospace", color: "#34d399" }}>3.40 (COP 3.6 rated)</span></div>
                </div>
              )}
            </div>
          </div>

          {/* Action button: Fork to Scenario */}
          <div style={{ paddingTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", marginTop: "12px" }}>
            <button
              onClick={() => onForkScenario(selectedZone?.id || "B-204")}
              className={styles.forkBtn}
            >
              <Sliders size={14} />
              <span>Fork {selectedZone?.id} to What-If Simulator</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DigitalTwinView;
