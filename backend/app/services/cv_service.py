import os
import json
import time
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
from backend.app.services.twin import twin_service

class ComputerVisionService:
    def __init__(self):
        self.data_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data")
        self.calibration: Dict[str, Any] = {}
        self.active_clip = "b204_vacant_cooling_clip"
        self.privacy_mode_enabled = True
        self.clip_start_time = time.time()
        self.load_calibration()

    def load_calibration(self):
        cal_path = os.path.join(self.data_dir, "calibration.json")
        if os.path.exists(cal_path):
            with open(cal_path, "r", encoding="utf-8") as f:
                self.calibration = json.load(f)

    def select_clip(self, clip_id: str):
        self.active_clip = clip_id
        self.clip_start_time = time.time()

    def get_camera_observation(self, camera_id: str = "cam-b204-01") -> Dict[str, Any]:
        """
        Generates structured CV observation per Section 3.3
        """
        elapsed_sec = int(time.time() - self.clip_start_time)

        if self.active_clip == "b204_vacant_cooling_clip":
            # Scenario: People leave room -> vacancy timer ticks
            person_count = 0
            # vacancy timer starts from 52 mins (3120 sec) + elapsed
            vacant_seconds = 3120 + elapsed_sec
            lights_state = "ON"
            pcs_count = 17
            fan_state = "OFF"
            window_state = "CLOSED"
            bounding_boxes = []  # No people in frame
            zone_id = "B-204"

        elif self.active_clip == "b101_occupied_clip":
            person_count = 24
            vacant_seconds = 0
            lights_state = "ON"
            pcs_count = 24
            fan_state = "ON"
            window_state = "CLOSED"
            # Simulated person bounding boxes [x, y, w, h, conf, track_id]
            bounding_boxes = [
                {"id": f"p-{i+1}", "bbox": [120 + (i % 6) * 75, 180 + (i // 6) * 80, 48, 110], "conf": 0.94}
                for i in range(person_count)
            ]
            zone_id = "B-101"

        elif self.active_clip == "b207_after_hours_clip":
            person_count = 0
            vacant_seconds = 14400 + elapsed_sec
            lights_state = "ON"
            pcs_count = 20
            fan_state = "ON"
            window_state = "CLOSED"
            bounding_boxes = []
            zone_id = "B-207"

        else:  # live webcam or fallback
            person_count = 1
            vacant_seconds = 0
            lights_state = "ON"
            pcs_count = 1
            fan_state = "OFF"
            window_state = "CLOSED"
            bounding_boxes = [{"id": "p-live", "bbox": [240, 160, 160, 240], "conf": 0.96}]
            zone_id = "B-204"

        # Meter reading for the zone to compute the CV-vs-Meter reconciliation
        z_state = twin_service.get_zone_state(zone_id) or {}
        meter_kw = z_state.get("measured_kw", 3.42)
        expected_kw = z_state.get("expected_kw", 0.60)
        unexplained_kw = z_state.get("unexplained_kw", 2.82)

        # Belief fusion resolution
        if person_count == 0 and meter_kw > 1.5:
            fusion_diagnosis = "EMPTY_ROOM_CONDITIONING"
            fusion_status = "CRITICAL_WASTE"
            fusion_narrative = f"CV detects 0 occupants for {vacant_seconds//60} min, but meter reads {meter_kw} kW. Twin identifies {unexplained_kw} kW of Unexplained Load."
        elif person_count > 0 and meter_kw > 1.5:
            fusion_diagnosis = "NORMAL_JUSTIFIED"
            fusion_status = "JUSTIFIED"
            fusion_narrative = f"Occupancy of {person_count} verified. High power ({meter_kw} kW) is physically justified by occupant sensible heat and active workstations."
        else:
            fusion_diagnosis = "STANDBY"
            fusion_status = "NORMAL"
            fusion_narrative = "Power and visual occupancy are both at standby baseline."

        return {
            "camera_id": camera_id,
            "zone_id": zone_id,
            "active_clip": self.active_clip,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "privacy_mode": self.privacy_mode_enabled,
            "detection": {
                "person_count": person_count,
                "vacant_seconds": vacant_seconds,
                "vacant_minutes": vacant_seconds // 60,
                "confidence": 0.94,
                "bounding_boxes": bounding_boxes
            },
            "equipment_states": [
                {"equipment_id": f"{zone_id}-LIGHT-01", "type": "LIGHT", "state": lights_state, "confidence": 0.97, "lux": 240 if lights_state == "ON" else 15},
                {"equipment_id": f"{zone_id}-PC-BANK", "type": "PC", "state": "ON" if pcs_count > 0 else "OFF", "count_on": pcs_count, "confidence": 0.89},
                {"equipment_id": f"{zone_id}-FAN-02", "type": "FAN", "state": fan_state, "confidence": 0.91, "motion_energy": 24.5 if fan_state == "ON" else 1.2},
                {"equipment_id": f"{zone_id}-WINDOW-1", "type": "WINDOW", "state": window_state, "confidence": 0.82}
            ],
            "reconciliation": {
                "meter_kw": meter_kw,
                "expected_kw": expected_kw,
                "unexplained_kw": unexplained_kw,
                "diagnosis": fusion_diagnosis,
                "status": fusion_status,
                "narrative": fusion_narrative
            }
        }

cv_service = ComputerVisionService()
