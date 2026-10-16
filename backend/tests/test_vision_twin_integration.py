import unittest
from datetime import datetime, timezone

from backend.app.services.cv_service import cv_service
from backend.app.services.twin import twin_service
from backend.app.services.generator import generator_service


class TestVisionTwinIntegration(unittest.TestCase):
    def setUp(self):
        # Reset to default clip and standard faults before each test
        cv_service.select_clip("b204_vacant_cooling_clip")
        generator_service.active_faults["F1"] = True

    def test_vision_observation_mapping(self):
        """Test that active vision clip maps to the correct target zone and returns expected detection data."""
        # 1. B-204 vacant clip
        cv_service.select_clip("b204_vacant_cooling_clip")
        obs_b204 = cv_service.get_active_observation_for_zone("B-204")
        self.assertIsNotNone(obs_b204)
        self.assertEqual(obs_b204["zone_id"], "B-204")
        self.assertEqual(obs_b204["person_count"], 0)
        self.assertGreaterEqual(obs_b204["vacant_seconds"], 3120)
        self.assertEqual(obs_b204["equipment_states"]["lights"], "ON")
        self.assertEqual(obs_b204["equipment_states"]["pcs_on"], 17)

        # Isolation: B-101 and B-207 must return None when B-204 is the active clip
        self.assertIsNone(cv_service.get_active_observation_for_zone("B-101"))
        self.assertIsNone(cv_service.get_active_observation_for_zone("B-207"))
        self.assertIsNone(cv_service.get_active_observation_for_zone("B-102"))

        # 2. B-101 occupied clip
        cv_service.select_clip("b101_occupied_clip")
        obs_b101 = cv_service.get_active_observation_for_zone("B-101")
        self.assertIsNotNone(obs_b101)
        self.assertEqual(obs_b101["zone_id"], "B-101")
        self.assertEqual(obs_b101["person_count"], 24)
        self.assertEqual(obs_b101["vacant_seconds"], 0)
        self.assertEqual(obs_b101["equipment_states"]["lights"], "ON")
        self.assertEqual(obs_b101["equipment_states"]["pcs_on"], 24)
        self.assertEqual(obs_b101["equipment_states"]["fan"], "ON")

        # Isolation: B-204 must return None when B-101 is the active clip
        self.assertIsNone(cv_service.get_active_observation_for_zone("B-204"))

        # 3. B-207 after-hours clip
        cv_service.select_clip("b207_after_hours_clip")
        obs_b207 = cv_service.get_active_observation_for_zone("B-207")
        self.assertIsNotNone(obs_b207)
        self.assertEqual(obs_b207["zone_id"], "B-207")
        self.assertEqual(obs_b207["person_count"], 0)
        self.assertGreaterEqual(obs_b207["vacant_seconds"], 14400)
        self.assertEqual(obs_b207["equipment_states"]["pcs_on"], 20)
        self.assertEqual(obs_b207["equipment_states"]["fan"], "ON")

        # 4. Live webcam nominal scenario
        cv_service.select_clip("live_webcam")
        obs_webcam = cv_service.get_active_observation_for_zone("B-204")
        self.assertIsNotNone(obs_webcam)
        self.assertEqual(obs_webcam["person_count"], 1)

    def test_twin_state_updates_from_vision(self):
        """Test that Digital Twin calculations reflect active vision observations."""
        # Switch to B-101 occupied clip (24 active students)
        cv_service.select_clip("b101_occupied_clip")
        generator_service.generate_live_campus_tick()

        b101_state = twin_service.get_zone_state("B-101")
        self.assertIsNotNone(b101_state)
        self.assertEqual(b101_state["occupancy"], 24)
        self.assertEqual(b101_state["equipment_states"]["pcs_on"], 24)
        self.assertEqual(b101_state["equipment_states"]["lights"], "ON")
        self.assertEqual(b101_state["equipment_states"]["fan"], "ON")
        # In B-101 with 24 people, expected power should scale up with occupancy
        self.assertGreater(b101_state["expected_kw"], 2.0)

    def test_empty_room_conditioning_fusion_hook(self):
        """Test B-204 vacant cooling anomaly when F1 fault and vacant clip are active."""
        cv_service.select_clip("b204_vacant_cooling_clip")
        generator_service.active_faults["F1"] = True
        generator_service.generate_live_campus_tick()

        b204_state = twin_service.get_zone_state("B-204")
        self.assertIsNotNone(b204_state)
        # Vision proves room is vacant
        self.assertEqual(b204_state["occupancy"], 0)
        self.assertGreaterEqual(b204_state["vacant_seconds"], 3120)
        # But equipment is running
        self.assertEqual(b204_state["equipment_states"]["hvac"], "COOLING")
        self.assertGreater(b204_state["measured_kw"], 3.0)
        # Resulting in massive Unexplained Load (UL > 2.0 kW)
        self.assertGreater(b204_state["unexplained_kw"], 2.0)

    def test_zone_isolation_safety(self):
        """Verify that vision observations in one zone never leak into or affect other zones."""
        cv_service.select_clip("b101_occupied_clip")

        sim_time = datetime(2026, 10, 16, 11, 0, tzinfo=timezone.utc)
        tick_b101 = generator_service.generate_zone_tick("B-101", sim_time)
        tick_b102 = generator_service.generate_zone_tick("B-102", sim_time)

        # B-101 received 24 people from vision
        self.assertEqual(tick_b101["occupancy"], 24)
        self.assertEqual(tick_b101["equipment_states"]["pcs_on"], 24)

        # B-102 was NOT targeted by vision, so it operates independently on schedule
        # It must NOT inherit B-101's 24 occupants or 24 PCs
        self.assertNotEqual(tick_b102["equipment_states"]["pcs_on"], 24)

    def test_fallback_safety_on_unknown_clip(self):
        """Verify that unknown clip IDs safely fall back to standard simulation without raising exceptions."""
        cv_service.select_clip("unknown_or_custom_clip")
        sim_time = datetime(2026, 10, 16, 11, 0, tzinfo=timezone.utc)
        try:
            state = generator_service.generate_zone_tick("B-204", sim_time)
            self.assertIsNotNone(state)
            self.assertIn("occupancy", state)
            self.assertIn("measured_kw", state)
        except Exception as e:
            self.fail(f"generate_zone_tick raised an unexpected exception: {e}")


if __name__ == "__main__":
    unittest.main()
