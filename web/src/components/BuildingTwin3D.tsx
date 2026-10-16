"use client";

import React, { useState, useRef, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import {
  Flame,
  Zap,
  Users,
  Thermometer,
  AlertTriangle,
  RotateCcw,
  Layers,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  Info,
  Maximize2
} from "lucide-react";
import { ZoneMetadata, ZoneState } from "../lib/types";
import styles from "./BuildingTwin3D.module.css";

// Fallback demo zones matching Block-B 12 rooms when backend is offline
const DEMO_ZONES: ZoneMetadata[] = [
  // Floor 1
  { id: "B-101", building_id: "Block-B", floor: 1, name: "Computer Lab 1", type: "lab", area_m2: 110, volume_m3: 330, polygon: [[10,10],[90,10],[90,80],[10,80]], thermal_R: 0.045, thermal_C: 18.5, comfort_min_c: 22, comfort_max_c: 26, camera_id: "cam-b101", meter_id: "M-B101" },
  { id: "B-102", building_id: "Block-B", floor: 1, name: "IoT & Embedded Lab", type: "lab", area_m2: 95, volume_m3: 285, polygon: [[95,10],[175,10],[175,80],[95,80]], thermal_R: 0.048, thermal_C: 16.0, comfort_min_c: 22, comfort_max_c: 26, camera_id: "cam-b102", meter_id: "M-B102" },
  { id: "B-103", building_id: "Block-B", floor: 1, name: "Lecture Hall 101", type: "classroom", area_m2: 140, volume_m3: 440, polygon: [[180,10],[280,10],[280,80],[180,80]], thermal_R: 0.04, thermal_C: 22.0, comfort_min_c: 22, comfort_max_c: 26, camera_id: "cam-b103", meter_id: "M-B103" },
  { id: "B-104", building_id: "Block-B", floor: 1, name: "Faculty Cabin A", type: "office", area_m2: 55, volume_m3: 165, polygon: [[10,85],[90,85],[90,145],[10,145]], thermal_R: 0.065, thermal_C: 10.5, comfort_min_c: 22.5, comfort_max_c: 26, camera_id: "cam-b104", meter_id: "M-B104" },
  { id: "B-105", building_id: "Block-B", floor: 1, name: "Corridor & Concourse L1", type: "corridor", area_m2: 120, volume_m3: 360, polygon: [[95,85],[175,85],[175,145],[95,145]], thermal_R: 0.035, thermal_C: 15.0, comfort_min_c: 21, comfort_max_c: 28, camera_id: "cam-b105", meter_id: "M-B105" },
  { id: "B-106", building_id: "Block-B", floor: 1, name: "Robotics Workshop", type: "lab", area_m2: 130, volume_m3: 400, polygon: [[180,85],[280,85],[280,145],[180,145]], thermal_R: 0.042, thermal_C: 20.0, comfort_min_c: 22, comfort_max_c: 26.5, camera_id: "cam-b106", meter_id: "M-B106" },
  // Floor 2
  { id: "B-201", building_id: "Block-B", floor: 2, name: "AI & Machine Learning Lab", type: "lab", area_m2: 115, volume_m3: 345, polygon: [[10,10],[90,10],[90,80],[10,80]], thermal_R: 0.046, thermal_C: 19.0, comfort_min_c: 22, comfort_max_c: 25.5, camera_id: "cam-b201", meter_id: "M-B201" },
  { id: "B-202", building_id: "Block-B", floor: 2, name: "Data Science Lab", type: "lab", area_m2: 95, volume_m3: 285, polygon: [[95,10],[175,10],[175,80],[95,80]], thermal_R: 0.047, thermal_C: 16.5, comfort_min_c: 22, comfort_max_c: 25.5, camera_id: "cam-b202", meter_id: "M-B202" },
  { id: "B-203", building_id: "Block-B", floor: 2, name: "Lecture Hall 201", type: "classroom", area_m2: 140, volume_m3: 440, polygon: [[180,10],[280,10],[280,80],[180,80]], thermal_R: 0.041, thermal_C: 22.5, comfort_min_c: 22, comfort_max_c: 26, camera_id: "cam-b203", meter_id: "M-B203" },
  { id: "B-204", building_id: "Block-B", floor: 2, name: "Advanced Computing Lab", type: "lab", area_m2: 125, volume_m3: 375, polygon: [[10,85],[90,85],[90,145],[10,145]], thermal_R: 0.043, thermal_C: 19.5, comfort_min_c: 22, comfort_max_c: 25, camera_id: "cam-b204-01", meter_id: "M-B204" },
  { id: "B-205", building_id: "Block-B", floor: 2, name: "Corridor & Study Lounge L2", type: "corridor", area_m2: 120, volume_m3: 360, polygon: [[95,85],[175,85],[175,145],[95,145]], thermal_R: 0.038, thermal_C: 15.5, comfort_min_c: 21, comfort_max_c: 27.5, camera_id: "cam-b205", meter_id: "M-B205" },
  { id: "B-207", building_id: "Block-B", floor: 2, name: "Cybersecurity & Networks Lab", type: "lab", area_m2: 110, volume_m3: 330, polygon: [[180,85],[280,85],[280,145],[180,145]], thermal_R: 0.045, thermal_C: 18.0, comfort_min_c: 22, comfort_max_c: 25.5, camera_id: "cam-b207", meter_id: "M-B207" },
];

const DEMO_STATES: Record<string, ZoneState> = {
  "B-101": { zone_id: "B-101", name: "Computer Lab 1", building_id: "Block-B", floor: 1, type: "lab", area_m2: 110, occupancy: 24, vacant_seconds: 0, temp_c: 23.4, outdoor_temp_c: 32.5, setpoint_c: 24.0, rh_pct: 54, co2_ppm: 680, measured_kw: 1.85, expected_kw: 1.80, unexplained_kw: 0.05, category_breakdown: { hvac: 1.1, lighting: 0.35, plug_loads: 0.4, other: 0.0 }, equipment_states: { hvac: "COOLING_NORMAL", lights: "ON", pcs_on: 24, fan: "AUTO", window: "CLOSED" }, data_quality: "GOOD", confidence: 0.95, last_updated: new Date().toISOString() },
  "B-102": { zone_id: "B-102", name: "IoT & Embedded Lab", building_id: "Block-B", floor: 1, type: "lab", area_m2: 95, occupancy: 16, vacant_seconds: 0, temp_c: 23.8, outdoor_temp_c: 32.5, setpoint_c: 24.0, rh_pct: 52, co2_ppm: 620, measured_kw: 1.10, expected_kw: 1.05, unexplained_kw: 0.05, category_breakdown: { hvac: 0.65, lighting: 0.25, plug_loads: 0.2, other: 0.0 }, equipment_states: { hvac: "COOLING_NORMAL", lights: "ON", pcs_on: 16, fan: "AUTO", window: "CLOSED" }, data_quality: "GOOD", confidence: 0.94, last_updated: new Date().toISOString() },
  "B-103": { zone_id: "B-103", name: "Lecture Hall 101", building_id: "Block-B", floor: 1, type: "classroom", area_m2: 140, occupancy: 42, vacant_seconds: 0, temp_c: 24.1, outdoor_temp_c: 32.5, setpoint_c: 24.0, rh_pct: 56, co2_ppm: 820, measured_kw: 2.10, expected_kw: 2.00, unexplained_kw: 0.10, category_breakdown: { hvac: 1.45, lighting: 0.45, plug_loads: 0.2, other: 0.0 }, equipment_states: { hvac: "COOLING_NORMAL", lights: "ON", pcs_on: 2, fan: "AUTO", window: "CLOSED" }, data_quality: "GOOD", confidence: 0.96, last_updated: new Date().toISOString() },
  "B-104": { zone_id: "B-104", name: "Faculty Cabin A", building_id: "Block-B", floor: 1, type: "office", area_m2: 55, occupancy: 3, vacant_seconds: 0, temp_c: 24.0, outdoor_temp_c: 32.5, setpoint_c: 24.0, rh_pct: 50, co2_ppm: 520, measured_kw: 0.45, expected_kw: 0.40, unexplained_kw: 0.05, category_breakdown: { hvac: 0.28, lighting: 0.1, plug_loads: 0.07, other: 0.0 }, equipment_states: { hvac: "COOLING_NORMAL", lights: "ON", pcs_on: 3, fan: "LOW", window: "CLOSED" }, data_quality: "GOOD", confidence: 0.92, last_updated: new Date().toISOString() },
  "B-105": { zone_id: "B-105", name: "Corridor & Concourse L1", building_id: "Block-B", floor: 1, type: "corridor", area_m2: 120, occupancy: 8, vacant_seconds: 0, temp_c: 25.2, outdoor_temp_c: 32.5, setpoint_c: 25.0, rh_pct: 55, co2_ppm: 490, measured_kw: 0.80, expected_kw: 0.80, unexplained_kw: 0.00, category_breakdown: { hvac: 0.0, lighting: 0.8, plug_loads: 0.0, other: 0.0 }, equipment_states: { hvac: "OFF", lights: "ON", pcs_on: 0, fan: "OFF", window: "OPEN" }, data_quality: "GOOD", confidence: 0.91, last_updated: new Date().toISOString() },
  "B-106": { zone_id: "B-106", name: "Robotics Workshop", building_id: "Block-B", floor: 1, type: "lab", area_m2: 130, occupancy: 14, vacant_seconds: 0, temp_c: 23.6, outdoor_temp_c: 32.5, setpoint_c: 24.0, rh_pct: 53, co2_ppm: 590, measured_kw: 1.95, expected_kw: 1.85, unexplained_kw: 0.10, category_breakdown: { hvac: 1.15, lighting: 0.4, plug_loads: 0.4, other: 0.0 }, equipment_states: { hvac: "COOLING_NORMAL", lights: "ON", pcs_on: 12, fan: "AUTO", window: "CLOSED" }, data_quality: "GOOD", confidence: 0.95, last_updated: new Date().toISOString() },
  "B-201": { zone_id: "B-201", name: "AI & Machine Learning Lab", building_id: "Block-B", floor: 2, type: "lab", area_m2: 115, occupancy: 22, vacant_seconds: 0, temp_c: 23.5, outdoor_temp_c: 32.5, setpoint_c: 24.0, rh_pct: 52, co2_ppm: 690, measured_kw: 2.40, expected_kw: 2.30, unexplained_kw: 0.10, category_breakdown: { hvac: 1.35, lighting: 0.35, plug_loads: 0.7, other: 0.0 }, equipment_states: { hvac: "COOLING_NORMAL", lights: "ON", pcs_on: 22, fan: "AUTO", window: "CLOSED" }, data_quality: "GOOD", confidence: 0.96, last_updated: new Date().toISOString() },
  "B-202": { zone_id: "B-202", name: "Data Science Lab", building_id: "Block-B", floor: 2, type: "lab", area_m2: 95, occupancy: 18, vacant_seconds: 0, temp_c: 23.9, outdoor_temp_c: 32.5, setpoint_c: 24.0, rh_pct: 51, co2_ppm: 640, measured_kw: 1.65, expected_kw: 1.60, unexplained_kw: 0.05, category_breakdown: { hvac: 0.95, lighting: 0.3, plug_loads: 0.4, other: 0.0 }, equipment_states: { hvac: "COOLING_NORMAL", lights: "ON", pcs_on: 18, fan: "AUTO", window: "CLOSED" }, data_quality: "GOOD", confidence: 0.94, last_updated: new Date().toISOString() },
  "B-203": { zone_id: "B-203", name: "Lecture Hall 201", building_id: "Block-B", floor: 2, type: "classroom", area_m2: 140, occupancy: 38, vacant_seconds: 0, temp_c: 24.2, outdoor_temp_c: 32.5, setpoint_c: 24.0, rh_pct: 55, co2_ppm: 780, measured_kw: 2.80, expected_kw: 2.70, unexplained_kw: 0.10, category_breakdown: { hvac: 1.9, lighting: 0.6, plug_loads: 0.3, other: 0.0 }, equipment_states: { hvac: "COOLING_NORMAL", lights: "ON", pcs_on: 4, fan: "AUTO", window: "CLOSED" }, data_quality: "GOOD", confidence: 0.95, last_updated: new Date().toISOString() },
  "B-204": { zone_id: "B-204", name: "Advanced Computing Lab", building_id: "Block-B", floor: 2, type: "lab", area_m2: 125, occupancy: 0, vacant_seconds: 2840, temp_c: 20.8, outdoor_temp_c: 32.5, setpoint_c: 20.0, rh_pct: 46, co2_ppm: 430, measured_kw: 3.42, expected_kw: 1.20, unexplained_kw: 2.22, category_breakdown: { hvac: 2.65, lighting: 0.52, plug_loads: 0.25, other: 0.0 }, equipment_states: { hvac: "COOLING_HIGH", lights: "ON", pcs_on: 24, fan: "HIGH", window: "CLOSED" }, data_quality: "FAULT_ACTIVE", confidence: 0.98, last_updated: new Date().toISOString() },
  "B-205": { zone_id: "B-205", name: "Corridor & Study Lounge L2", building_id: "Block-B", floor: 2, type: "corridor", area_m2: 120, occupancy: 6, vacant_seconds: 0, temp_c: 25.1, outdoor_temp_c: 32.5, setpoint_c: 25.0, rh_pct: 54, co2_ppm: 510, measured_kw: 0.90, expected_kw: 0.85, unexplained_kw: 0.05, category_breakdown: { hvac: 0.0, lighting: 0.9, plug_loads: 0.0, other: 0.0 }, equipment_states: { hvac: "OFF", lights: "ON", pcs_on: 0, fan: "OFF", window: "CLOSED" }, data_quality: "GOOD", confidence: 0.93, last_updated: new Date().toISOString() },
  "B-207": { zone_id: "B-207", name: "Cybersecurity & Networks Lab", building_id: "Block-B", floor: 2, type: "lab", area_m2: 110, occupancy: 0, vacant_seconds: 1420, temp_c: 21.8, outdoor_temp_c: 32.5, setpoint_c: 22.0, rh_pct: 48, co2_ppm: 450, measured_kw: 2.75, expected_kw: 1.90, unexplained_kw: 0.85, category_breakdown: { hvac: 1.95, lighting: 0.45, plug_loads: 0.35, other: 0.0 }, equipment_states: { hvac: "COOLING_HIGH", lights: "ON", pcs_on: 15, fan: "MED", window: "CLOSED" }, data_quality: "SUSPICIOUS", confidence: 0.92, last_updated: new Date().toISOString() },
};

// Spatial layout in 3D: symmetrical 3x2 grid per floor
const ROOM_COORDINATES: Record<string, { col: number; row: number; width: number; depth: number }> = {
  // Floor 1 (Back Row: -2.1, Front Row: +2.1)
  "B-101": { col: -3.7, row: -2.1, width: 3.2, depth: 3.0 },
  "B-102": { col: 0.0,  row: -2.1, width: 3.2, depth: 3.0 },
  "B-103": { col: 3.7,  row: -2.1, width: 3.2, depth: 3.0 },
  "B-104": { col: -3.7, row: 2.1,  width: 3.2, depth: 3.0 },
  "B-105": { col: 0.0,  row: 2.1,  width: 3.2, depth: 3.0 },
  "B-106": { col: 3.7,  row: 2.1,  width: 3.2, depth: 3.0 },
  // Floor 2
  "B-201": { col: -3.7, row: -2.1, width: 3.2, depth: 3.0 },
  "B-202": { col: 0.0,  row: -2.1, width: 3.2, depth: 3.0 },
  "B-203": { col: 3.7,  row: -2.1, width: 3.2, depth: 3.0 },
  "B-204": { col: -3.7, row: 2.1,  width: 3.2, depth: 3.0 },
  "B-205": { col: 0.0,  row: 2.1,  width: 3.2, depth: 3.0 },
  "B-207": { col: 3.7,  row: 2.1,  width: 3.2, depth: 3.0 },
};

type LayerMode = "waste" | "power" | "occupancy" | "temp" | "anomalies";
type FloorFilter = "all" | "exploded" | "1" | "2";

interface BuildingTwin3DProps {
  zones?: ZoneMetadata[];
  zoneStates?: ZoneState[];
  onForkScenario?: (zoneId: string) => void;
}

// Camera controller component
function CameraResetController({ resetTrigger }: { resetTrigger: number }) {
  const { camera } = useThree();
  React.useEffect(() => {
    if (resetTrigger > 0) {
      camera.position.set(9.5, 8.5, 10.5);
      camera.lookAt(0, 1.3, 0);
    }
  }, [resetTrigger, camera]);
  return null;
}

// 3D Room Box Unit
function Room3DUnit({
  zone,
  state,
  activeLayer,
  isSelected,
  isHovered,
  floorY,
  showLabel,
  onSelect,
  onHover,
  onUnhover,
}: {
  zone: ZoneMetadata;
  state: ZoneState;
  activeLayer: LayerMode;
  isSelected: boolean;
  isHovered: boolean;
  floorY: number;
  showLabel: boolean;
  onSelect: () => void;
  onHover: () => void;
  onUnhover: () => void;
}) {
  const coords = ROOM_COORDINATES[zone.id] || { col: 0, row: 0, width: 3.2, depth: 3.0 };
  const roomHeight = 1.15;

  // Determine dynamic room color based on active layer
  const { colorHex, emissiveHex, statusLabel, ledColor } = useMemo(() => {
    if (activeLayer === "waste") {
      if (state.unexplained_kw > 1.2) {
        return { colorHex: "#f43f5e", emissiveHex: "#e11d48", statusLabel: `+${state.unexplained_kw.toFixed(2)} kW UL`, ledColor: "#f43f5e" };
      }
      if (state.unexplained_kw > 0.4) {
        return { colorHex: "#f59e0b", emissiveHex: "#d97706", statusLabel: `+${state.unexplained_kw.toFixed(2)} kW UL`, ledColor: "#f59e0b" };
      }
      return { colorHex: "#10b981", emissiveHex: "#059669", statusLabel: "Nominal", ledColor: "#10b981" };
    }

    if (activeLayer === "power") {
      const density = (state.measured_kw * 1000) / (state.area_m2 || 100);
      if (density > 25) {
        return { colorHex: "#0284c7", emissiveHex: "#0369a1", statusLabel: `${state.measured_kw.toFixed(1)} kW`, ledColor: "#0284c7" };
      }
      if (density > 15) {
        return { colorHex: "#06b6d4", emissiveHex: "#0891b2", statusLabel: `${state.measured_kw.toFixed(1)} kW`, ledColor: "#06b6d4" };
      }
      return { colorHex: "#38bdf8", emissiveHex: "#0284c7", statusLabel: `${state.measured_kw.toFixed(1)} kW`, ledColor: "#38bdf8" };
    }

    if (activeLayer === "occupancy") {
      if (state.occupancy > 20) {
        return { colorHex: "#8b5cf6", emissiveHex: "#7c3aed", statusLabel: `${state.occupancy} ppl`, ledColor: "#8b5cf6" };
      }
      if (state.occupancy > 0) {
        return { colorHex: "#a855f7", emissiveHex: "#9333ea", statusLabel: `${state.occupancy} ppl`, ledColor: "#a855f7" };
      }
      return { colorHex: "#475569", emissiveHex: "#334155", statusLabel: "0 ppl", ledColor: "#64748b" };
    }

    if (activeLayer === "temp") {
      if (state.temp_c > 25.0) {
        return { colorHex: "#ef4444", emissiveHex: "#dc2626", statusLabel: `${state.temp_c.toFixed(1)}°C`, ledColor: "#ef4444" };
      }
      if (state.temp_c < 22.0) {
        return { colorHex: "#3b82f6", emissiveHex: "#2563eb", statusLabel: `${state.temp_c.toFixed(1)}°C`, ledColor: "#3b82f6" };
      }
      return { colorHex: "#10b981", emissiveHex: "#059669", statusLabel: `${state.temp_c.toFixed(1)}°C`, ledColor: "#10b981" };
    }

    // Anomalies layer
    if (zone.id === "B-204") {
      return { colorHex: "#f43f5e", emissiveHex: "#e11d48", statusLabel: "HVAC Waste Anomaly", ledColor: "#f43f5e" };
    }
    if (zone.id === "B-207") {
      return { colorHex: "#f59e0b", emissiveHex: "#d97706", statusLabel: "Unoccupied Cooling", ledColor: "#f59e0b" };
    }
    return { colorHex: "#10b981", emissiveHex: "#059669", statusLabel: "Nominal", ledColor: "#10b981" };
  }, [activeLayer, state, zone.id]);

  const hasAnomaly = state.unexplained_kw > 1.2 || zone.id === "B-204";

  return (
    <group position={[coords.col, floorY, coords.row]}>
      {/* Interactive Floor Slab */}
      <mesh
        position={[0, 0.08, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover();
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onUnhover();
        }}
      >
        <boxGeometry args={[coords.width - 0.2, 0.16, coords.depth - 0.2]} />
        <meshStandardMaterial
          color={colorHex}
          emissive={emissiveHex}
          emissiveIntensity={isSelected ? 0.65 : isHovered ? 0.45 : 0.22}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>

      {/* Selected Neon Outline Wireframe Box */}
      {isSelected && (
        <mesh position={[0, roomHeight / 2 + 0.08, 0]}>
          <boxGeometry args={[coords.width - 0.1, roomHeight + 0.1, coords.depth - 0.1]} />
          <meshBasicMaterial color="#38bdf8" wireframe />
        </mesh>
      )}

      {/* Perimeter Glass Half-Walls */}
      {/* North Wall */}
      <mesh position={[0, roomHeight / 2, -(coords.depth - 0.2) / 2]}>
        <boxGeometry args={[coords.width - 0.2, roomHeight, 0.06]} />
        <meshStandardMaterial
          color="#94a3b8"
          transparent
          opacity={isHovered ? 0.45 : 0.18}
          roughness={0.1}
        />
      </mesh>
      {/* West Wall */}
      <mesh position={[-(coords.width - 0.2) / 2, roomHeight / 2, 0]}>
        <boxGeometry args={[0.06, roomHeight, coords.depth - 0.2]} />
        <meshStandardMaterial
          color="#94a3b8"
          transparent
          opacity={isHovered ? 0.45 : 0.18}
          roughness={0.1}
        />
      </mesh>
      {/* East Wall */}
      <mesh position={[(coords.width - 0.2) / 2, roomHeight / 2, 0]}>
        <boxGeometry args={[0.06, roomHeight, coords.depth - 0.2]} />
        <meshStandardMaterial
          color="#94a3b8"
          transparent
          opacity={isHovered ? 0.45 : 0.18}
          roughness={0.1}
        />
      </mesh>

      {/* Interior Equipment Accent: Server rack or desks */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.7, 0.35, 0.45]} />
        <meshStandardMaterial
          color={hasAnomaly ? "#f43f5e" : "#334155"}
          emissive={hasAnomaly ? "#e11d48" : "#1e293b"}
          emissiveIntensity={hasAnomaly ? 0.6 : 0.15}
        />
      </mesh>

      {/* Clean Compact Floating ID Badge */}
      {showLabel && (
        <Html
          position={[0, roomHeight + 0.25, 0]}
          center
          distanceFactor={18}
          zIndexRange={[100, 0]}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            onMouseEnter={onHover}
            onMouseLeave={onUnhover}
            style={{
              cursor: "pointer",
              padding: "3px 8px",
              borderRadius: "5px",
              fontSize: "11px",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
              userSelect: "none",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              background: isSelected
                ? "#0284c7"
                : isHovered
                ? "#1e293b"
                : hasAnomaly
                ? "#4c0519"
                : "#0f172a",
              color: isSelected
                ? "#ffffff"
                : isHovered
                ? "#38bdf8"
                : hasAnomaly
                ? "#fda4af"
                : "#e2e8f0",
              border: isSelected
                ? "2px solid #ffffff"
                : isHovered
                ? "1px solid #38bdf8"
                : hasAnomaly
                ? "1px solid #f43f5e"
                : "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: isSelected
                ? "0 0 16px rgba(56, 189, 248, 0.8)"
                : "0 2px 8px rgba(0, 0, 0, 0.4)",
              transform: isSelected || isHovered ? "scale(1.12)" : "scale(1)",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                backgroundColor: ledColor,
                display: "inline-block",
                boxShadow: hasAnomaly ? "0 0 8px #f43f5e" : "none"
              }}
            />
            <span>{zone.id}</span>

            {/* Extended Status Pill ONLY visible on Hover or Selection */}
            {(isHovered || isSelected) && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 500,
                  opacity: 0.9,
                  borderLeft: "1px solid rgba(255, 255, 255, 0.25)",
                  paddingLeft: "5px",
                  color: isSelected ? "#ffffff" : "#cbd5e1"
                }}
              >
                {statusLabel}
              </span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

export function BuildingTwin3D({
  zones: propZones,
  zoneStates: propZoneStates,
  onForkScenario
}: BuildingTwin3DProps) {
  // Determine if using live backend data or high-fidelity fallback demo
  const isLiveBackend = Boolean((propZones && propZones.length > 0) && (propZoneStates && propZoneStates.length > 0));

  const zones = useMemo(() => {
    if (isLiveBackend && propZones) {
      const blockBZones = propZones.filter(z => z.building_id === "Block-B");
      if (blockBZones.length > 0) return blockBZones;
    }
    return DEMO_ZONES;
  }, [isLiveBackend, propZones]);

  const zoneStateMap = useMemo(() => {
    const map: Record<string, ZoneState> = { ...DEMO_STATES };
    if (isLiveBackend && propZoneStates) {
      propZoneStates.forEach(s => {
        map[s.zone_id] = s;
      });
    }
    return map;
  }, [isLiveBackend, propZoneStates]);

  const [activeLayer, setActiveLayer] = useState<LayerMode>("waste");
  const [floorFilter, setFloorFilter] = useState<FloorFilter>("all");
  const [selectedZoneId, setSelectedZoneId] = useState<string>("B-204");
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [resetTrigger, setResetTrigger] = useState<number>(0);

  // Selected zone objects
  const selectedZone = zones.find(z => z.id === selectedZoneId) || zones[0];
  const selectedState = zoneStateMap[selectedZone?.id] || DEMO_STATES[selectedZone?.id] || DEMO_STATES["B-204"];

  // Filter zones by floor visibility
  const visibleZones = useMemo(() => {
    if (floorFilter === "1") return zones.filter(z => z.floor === 1);
    if (floorFilter === "2") return zones.filter(z => z.floor === 2);
    return zones; // "all" or "exploded"
  }, [zones, floorFilter]);

  // Calculate Y positions for floors
  const getFloorY = (floor: number) => {
    if (floorFilter === "exploded") {
      return floor === 1 ? 0.15 : 3.5; // High separation in exploded view
    }
    return floor === 1 ? 0.15 : 1.75; // Standard two-floor stack
  };

  const handleResetCamera = () => {
    setResetTrigger(prev => prev + 1);
  };

  return (
    <div className={styles.container}>
      {/* Top Controls Bar: Data source, Floor filter, Layer switcher, Reset */}
      <div className={styles.topBar}>
        <div className={styles.groupLeft}>
          {/* Telemetry Status Badge */}
          <div className={isLiveBackend ? styles.badgeLive : styles.badgeDemo}>
            <span className={styles.statusDot} />
            <span>{isLiveBackend ? "● Live Backend Telemetry" : "◈ Demo Simulation (Block-B)"}</span>
          </div>

          {/* Floor Filters */}
          <div className={styles.segmentedControl}>
            {[
              { id: "all", label: "All Floors" },
              { id: "exploded", label: "Exploded 3D" },
              { id: "1", label: "Level 1" },
              { id: "2", label: "Level 2" },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFloorFilter(f.id as FloorFilter)}
                className={floorFilter === f.id ? styles.controlBtnActive : styles.controlBtn}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Layer Switcher & Reset Button */}
        <div className={styles.groupLeft}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            {[
              { id: "waste", label: "Waste (UL)", icon: Flame, color: "#f43f5e" },
              { id: "power", label: "Power", icon: Zap, color: "#38bdf8" },
              { id: "occupancy", label: "Occupancy", icon: Users, color: "#a855f7" },
              { id: "temp", label: "Thermal", icon: Thermometer, color: "#10b981" },
              { id: "anomalies", label: "Anomalies", icon: AlertTriangle, color: "#f59e0b" },
            ].map(layer => {
              const Icon = layer.icon;
              const isActive = activeLayer === layer.id;
              return (
                <button
                  key={layer.id}
                  onClick={() => setActiveLayer(layer.id as LayerMode)}
                  className={isActive ? styles.layerBtnActive : styles.layerBtn}
                >
                  <Icon size={14} color={layer.color} />
                  <span>{layer.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleResetCamera}
            title="Reset Camera View"
            className={styles.resetBtn}
          >
            <RotateCcw size={14} />
            <span>Reset Cam</span>
          </button>
        </div>
      </div>

      {/* Main 3D Space: 3D Canvas (Left) + Room Telemetry Panel (Right) */}
      <div className={styles.mainGrid}>
        {/* 3D Canvas Container */}
        <div className={styles.canvasCard}>
          <div className={styles.canvasHeader}>
            <div className={styles.canvasTitle}>
              <Layers size={16} color="#38bdf8" />
              <span>Block-B 3D Structural Digital Twin · 12 Multi-Level Zones</span>
            </div>
            <div>
              <span>Drag to orbit · Scroll to zoom · Click room to inspect</span>
            </div>
          </div>

          <div className={styles.canvasWrapper}>
            <Canvas
              camera={{ position: [9.5, 8.5, 10.5], fov: 42 }}
              onPointerMissed={() => setHoveredZoneId(null)}
            >
              <color attach="background" args={["#070b13"]} />

              {/* Lighting */}
              <ambientLight intensity={1.3} />
              <directionalLight position={[10, 15, 10]} intensity={2.0} castShadow />
              <pointLight position={[-10, 8, -8]} intensity={0.7} color="#38bdf8" />
              <pointLight position={[10, 5, 8]} intensity={0.5} color="#818cf8" />

              {/* Ground Grid */}
              <gridHelper args={[24, 24, "#1e293b", "#0f172a"]} position={[0, -0.02, 0]} />

              {/* Level 1 Foundation Base Slab */}
              {(floorFilter === "all" || floorFilter === "exploded" || floorFilter === "1") && (
                <mesh position={[0, 0.05, 0]}>
                  <boxGeometry args={[11.6, 0.1, 8.4]} />
                  <meshStandardMaterial color="#0f172a" roughness={0.7} />
                </mesh>
              )}

              {/* Intermediate Floor/Ceiling Slab */}
              {(floorFilter === "all" || floorFilter === "exploded" || floorFilter === "2") && (
                <mesh position={[0, floorFilter === "exploded" ? 3.35 : 1.65, 0]}>
                  <boxGeometry args={[11.6, 0.1, 8.4]} />
                  <meshStandardMaterial
                    color="#1e293b"
                    transparent
                    opacity={floorFilter === "exploded" ? 0.35 : 0.22}
                    roughness={0.4}
                  />
                </mesh>
              )}

              {/* Render Visible 3D Rooms */}
              {visibleZones.map(zone => {
                const state = zoneStateMap[zone.id] || DEMO_STATES[zone.id];
                const floorY = getFloorY(zone.floor);
                return (
                  <Room3DUnit
                    key={zone.id}
                    zone={zone}
                    state={state}
                    activeLayer={activeLayer}
                    isSelected={selectedZoneId === zone.id}
                    isHovered={hoveredZoneId === zone.id}
                    floorY={floorY}
                    showLabel={true}
                    onSelect={() => setSelectedZoneId(zone.id)}
                    onHover={() => setHoveredZoneId(zone.id)}
                    onUnhover={() => {
                      if (hoveredZoneId === zone.id) setHoveredZoneId(null);
                    }}
                  />
                );
              })}

              {/* Orbit Controls with Centered Target */}
              <OrbitControls
                makeDefault
                target={[0, 1.3, 0]}
                enableDamping
                dampingFactor={0.08}
                minDistance={5}
                maxDistance={28}
                maxPolarAngle={Math.PI / 2 - 0.05} // prevent under-ground clipping
              />

              <CameraResetController resetTrigger={resetTrigger} />
            </Canvas>

            {/* Quick 3D Legend overlay inside canvas */}
            <div className={styles.canvasLegend}>
              <span style={{ fontWeight: 600, color: "#94a3b8" }}>Legend:</span>
              <div className={styles.legendChip}>
                <span className={styles.legendDotRed} />
                <span>Critical Waste / Alert</span>
              </div>
              <div className={styles.legendChip}>
                <span className={styles.legendDotAmber} />
                <span>Moderate Load</span>
              </div>
              <div className={styles.legendChip}>
                <span className={styles.legendDotGreen} />
                <span>Nominal / Efficient</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Zone Telemetry Side Panel */}
        <aside className={styles.sidePanel}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Header info */}
            <div className={styles.panelHeader}>
              <div>
                <div className={styles.zoneIdRow}>
                  <span className={styles.zoneIdTitle}>
                    {selectedZone?.id}
                  </span>
                  <span className={styles.pillLevel}>
                    Level {selectedZone?.floor}
                  </span>
                  <span className={styles.pillType}>
                    {selectedZone?.type}
                  </span>
                </div>
                <div className={styles.zoneName}>
                  {selectedZone?.name}
                </div>
              </div>

              {/* Defect Indicator Badge */}
              {selectedState?.unexplained_kw > 1.0 ? (
                <div className={styles.defectBadge}>
                  <AlertTriangle size={14} color="#f43f5e" />
                  <span>Defect Hotspot</span>
                </div>
              ) : (
                <div className={styles.nominalBadge}>
                  <span>Nominal</span>
                </div>
              )}
            </div>

            {/* Measured vs Waste Gauges Grid */}
            <div className={styles.metricsGrid2}>
              <div className={styles.metricCard}>
                <div className={styles.metricCardLabel}>
                  <span>Measured Power</span>
                  <Zap size={14} color="#38bdf8" />
                </div>
                <div className={styles.metricCardValCyan}>
                  {selectedState?.measured_kw?.toFixed(2)} kW
                </div>
                <div className={styles.metricCardSub}>
                  Expected: {selectedState?.expected_kw?.toFixed(2)} kW
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricCardLabel}>
                  <span>Unexplained Waste</span>
                  <Flame size={14} color="#f43f5e" />
                </div>
                <div className={selectedState?.unexplained_kw > 1.0 ? styles.metricCardValRose : styles.metricCardValEmerald}>
                  +{selectedState?.unexplained_kw?.toFixed(2)} kW
                </div>
                <div className={styles.metricCardSub}>
                  {selectedState?.unexplained_kw > 1.0 ? "Severe Anomaly Leakage" : "Negligible Deviation"}
                </div>
              </div>
            </div>

            {/* Environmental & Occupancy Grid */}
            <div className={styles.metricsGrid3}>
              <div className={styles.telemetryMiniCard}>
                <div className={styles.telemetryMiniLabel}>Occupancy</div>
                <div className={styles.telemetryMiniVal}>{selectedState?.occupancy} ppl</div>
                <div className={styles.telemetryMiniSub}>{selectedState?.occupancy === 0 ? "Vacant" : "In Session"}</div>
              </div>

              <div className={styles.telemetryMiniCard}>
                <div className={styles.telemetryMiniLabel}>Indoor Temp</div>
                <div className={styles.telemetryMiniVal}>{selectedState?.temp_c?.toFixed(1)}°C</div>
                <div className={styles.telemetryMiniSub}>Set: {selectedState?.setpoint_c}°C</div>
              </div>

              <div className={styles.telemetryMiniCard}>
                <div className={styles.telemetryMiniLabel}>RH / Area</div>
                <div className={styles.telemetryMiniVal}>{selectedState?.rh_pct}%</div>
                <div className={styles.telemetryMiniSub}>{selectedZone?.area_m2} m²</div>
              </div>
            </div>

            {/* Sub-metered Load Breakdown */}
            <div className={styles.breakdownSection}>
              <div className={styles.breakdownTitleRow}>
                <span>Sub-metered Load Breakdown</span>
                <span style={{ color: "#64748b", fontWeight: 400 }}>Telemetry</span>
              </div>

              {/* HVAC */}
              <div className={styles.breakdownRow}>
                <div className={styles.breakdownLabels}>
                  <span style={{ color: "#94a3b8" }}>HVAC System</span>
                  <span style={{ fontFamily: "monospace", color: "#38bdf8", fontWeight: 700 }}>
                    {selectedState?.category_breakdown?.hvac?.toFixed(2)} kW
                  </span>
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressBarHvac}
                    style={{
                      width: `${Math.min(100, ((selectedState?.category_breakdown?.hvac || 0) / (selectedState?.measured_kw || 1)) * 100)}%`
                    }}
                  />
                </div>
              </div>

              {/* Lighting */}
              <div className={styles.breakdownRow}>
                <div className={styles.breakdownLabels}>
                  <span style={{ color: "#94a3b8" }}>Lighting Grid</span>
                  <span style={{ fontFamily: "monospace", color: "#f59e0b", fontWeight: 700 }}>
                    {selectedState?.category_breakdown?.lighting?.toFixed(2)} kW
                  </span>
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressBarLight}
                    style={{
                      width: `${Math.min(100, ((selectedState?.category_breakdown?.lighting || 0) / (selectedState?.measured_kw || 1)) * 100)}%`
                    }}
                  />
                </div>
              </div>

              {/* Plug Loads */}
              <div className={styles.breakdownRow}>
                <div className={styles.breakdownLabels}>
                  <span style={{ color: "#94a3b8" }}>Plug & PCs</span>
                  <span style={{ fontFamily: "monospace", color: "#a855f7", fontWeight: 700 }}>
                    {selectedState?.category_breakdown?.plug_loads?.toFixed(2)} kW
                  </span>
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressBarPlug}
                    style={{
                      width: `${Math.min(100, ((selectedState?.category_breakdown?.plug_loads || 0) / (selectedState?.measured_kw || 1)) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Actuators & Equipment Card */}
            <div className={styles.actuatorsCard}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "#cbd5e1" }}>
                Actuator & Control Telemetry
              </div>
              <div className={styles.actuatorsGrid}>
                <div className={styles.actuatorItem}>
                  <span style={{ color: "#94a3b8" }}>HVAC State:</span>
                  <span style={{
                    fontWeight: 700,
                    color: selectedState?.equipment_states?.hvac?.includes("HIGH") ? "#f43f5e" : "#34d399"
                  }}>
                    {selectedState?.equipment_states?.hvac || "AUTO"}
                  </span>
                </div>
                <div className={styles.actuatorItem}>
                  <span style={{ color: "#94a3b8" }}>Lights:</span>
                  <span style={{ fontWeight: 700, color: "#f1f5f9" }}>
                    {selectedState?.equipment_states?.lights || "ON"}
                  </span>
                </div>
                <div className={styles.actuatorItem}>
                  <span style={{ color: "#94a3b8" }}>PCs Online:</span>
                  <span style={{ fontWeight: 700, fontFamily: "monospace", color: "#38bdf8" }}>
                    {selectedState?.equipment_states?.pcs_on || 0}
                  </span>
                </div>
                <div className={styles.actuatorItem}>
                  <span style={{ color: "#94a3b8" }}>Confidence:</span>
                  <span style={{ fontWeight: 700, fontFamily: "monospace", color: "#34d399" }}>
                    {Math.round((selectedState?.confidence || 0.95) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div>
            <button
              onClick={() => onForkScenario && onForkScenario(selectedZone?.id)}
              className={styles.forkBtn}
            >
              <ArrowUpRight size={14} />
              <span>Fork {selectedZone?.id} to What-If Simulator</span>
            </button>

            <div className={styles.footerNote}>
              {isLiveBackend
                ? "Live telemetry synchronized with campus edge gateway."
                : "◈ Demo simulation values active for hackathon inspection."}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default BuildingTwin3D;
