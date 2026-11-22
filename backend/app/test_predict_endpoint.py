import sys
import os

# Add scratch lib path for dependencies
scratch_lib = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "scratch", "lib"))
if os.path.exists(scratch_lib) and scratch_lib not in sys.path:
    sys.path.insert(0, scratch_lib)

import unittest
from fastapi.testclient import TestClient
import backend.app.main as main_mod
from backend.app.main import app

SYNTHETIC_API_KEY = "test-synthetic-ml-key-12345"
AUTH_HEADERS = {"X-API-Key": SYNTHETIC_API_KEY}

class TestDonorStatusPredictionAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.environ["RAKSHAI_ML_API_KEY"] = SYNTHETIC_API_KEY
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        os.environ.pop("RAKSHAI_ML_API_KEY", None)

    def test_01_model_loaded_at_startup(self):
        """Verify model pipeline loaded at startup and is not None."""
        self.assertIsNotNone(main_mod.ml_pipeline, "ML inference pipeline failed to load at startup.")

    def test_02_predict_active_donor_with_valid_key(self):
        """Test prediction for active donor synthetic profile with valid API key."""
        payload = {
            "cycle_of_donations": 0.0,
            "frequency_in_days": 0.0,
            "registration_days": 720.0,
            "role": "Guest",
            "blood_group": "B Positive",
            "gender": "Female",
            "donor_type": "Other",
            "eligibility_status": "not eligible"
        }
        response = self.client.post("/predict/donor-status", json=payload, headers=AUTH_HEADERS)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("is_inactive", data)
        self.assertIn("status_label", data)
        self.assertIn("probabilities", data)
        self.assertIn("model_version", data)
        self.assertEqual(data["status_label"], "Active")
        self.assertEqual(data["is_inactive"], 0)
        self.assertGreater(data["probabilities"]["active"], 0.5)

    def test_03_predict_inactive_donor_with_valid_key(self):
        """Test prediction for inactive donor synthetic profile with valid API key."""
        payload = {
            "cycle_of_donations": 90.0,
            "frequency_in_days": 90.0,
            "registration_days": 180.0,
            "role": "Regular Donor",
            "blood_group": "O Positive",
            "gender": "Male",
            "donor_type": "Regular Donor",
            "eligibility_status": "eligible"
        }
        response = self.client.post("/predict/donor-status", json=payload, headers=AUTH_HEADERS)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status_label"], "Inactive")
        self.assertEqual(data["is_inactive"], 1)
        self.assertGreater(data["probabilities"]["inactive"], 0.5)

    def test_04_probabilities_bounds_and_sum(self):
        """Test that probabilities are bounded [0, 1] and sum to approximately 1.0."""
        payload = {
            "cycle_of_donations": 45.0,
            "frequency_in_days": 30.0,
            "registration_days": 300.0,
            "role": "Emergency Donor",
            "blood_group": "A Positive",
            "gender": "Female",
            "donor_type": "One-Time Donor",
            "eligibility_status": "eligible"
        }
        response = self.client.post("/predict/donor-status", json=payload, headers=AUTH_HEADERS)
        self.assertEqual(response.status_code, 200)
        probs = response.json()["probabilities"]
        p_act = probs["active"]
        p_inact = probs["inactive"]
        self.assertGreaterEqual(p_act, 0.0)
        self.assertLessEqual(p_act, 1.0)
        self.assertGreaterEqual(p_inact, 0.0)
        self.assertLessEqual(p_inact, 1.0)
        self.assertAlmostEqual(p_act + p_inact, 1.0, places=2)

    def test_05_reject_missing_feature(self):
        """Test 422 Unprocessable Entity rejection when a required feature is omitted."""
        invalid_payload = {
            "cycle_of_donations": 90.0,
            "frequency_in_days": 90.0,
            "role": "Regular Donor",
            "blood_group": "O Positive",
            "gender": "Male",
            "donor_type": "Regular Donor",
            "eligibility_status": "eligible"
        }
        response = self.client.post("/predict/donor-status", json=invalid_payload, headers=AUTH_HEADERS)
        self.assertEqual(response.status_code, 422)

    def test_06_reject_invalid_data_type(self):
        """Test 422 rejection when non-numeric value passed to numeric feature."""
        invalid_payload = {
            "cycle_of_donations": "invalid_string_instead_of_float",
            "frequency_in_days": 90.0,
            "registration_days": 180.0,
            "role": "Regular Donor",
            "blood_group": "O Positive",
            "gender": "Male",
            "donor_type": "Regular Donor",
            "eligibility_status": "eligible"
        }
        response = self.client.post("/predict/donor-status", json=invalid_payload, headers=AUTH_HEADERS)
        self.assertEqual(response.status_code, 422)

    def test_07_missing_api_key_header_returns_401(self):
        """Test that missing X-API-Key request header returns HTTP 401."""
        payload = {
            "cycle_of_donations": 90.0,
            "frequency_in_days": 90.0,
            "registration_days": 180.0,
            "role": "Regular Donor",
            "blood_group": "O Positive",
            "gender": "Male",
            "donor_type": "Regular Donor",
            "eligibility_status": "eligible"
        }
        response = self.client.post("/predict/donor-status", json=payload)
        self.assertEqual(response.status_code, 401)
        self.assertIn("Invalid or missing API key", response.json().get("detail", ""))

    def test_08_incorrect_api_key_header_returns_401(self):
        """Test that incorrect X-API-Key header returns HTTP 401."""
        payload = {
            "cycle_of_donations": 90.0,
            "frequency_in_days": 90.0,
            "registration_days": 180.0,
            "role": "Regular Donor",
            "blood_group": "O Positive",
            "gender": "Male",
            "donor_type": "Regular Donor",
            "eligibility_status": "eligible"
        }
        response = self.client.post(
            "/predict/donor-status",
            json=payload,
            headers={"X-API-Key": "wrong-synthetic-key"}
        )
        self.assertEqual(response.status_code, 401)
        self.assertIn("Invalid or missing API key", response.json().get("detail", ""))

    def test_09_missing_server_api_key_configuration_returns_503(self):
        """Test that unconfigured RAKSHAI_ML_API_KEY on server fails closed with HTTP 503."""
        payload = {
            "cycle_of_donations": 90.0,
            "frequency_in_days": 90.0,
            "registration_days": 180.0,
            "role": "Regular Donor",
            "blood_group": "O Positive",
            "gender": "Male",
            "donor_type": "Regular Donor",
            "eligibility_status": "eligible"
        }
        old_key = os.environ.pop("RAKSHAI_ML_API_KEY", None)
        try:
            response = self.client.post("/predict/donor-status", json=payload, headers=AUTH_HEADERS)
            self.assertEqual(response.status_code, 503)
            self.assertIn("not configured", response.json().get("detail", ""))
        finally:
            if old_key is not None:
                os.environ["RAKSHAI_ML_API_KEY"] = old_key

    def test_10_uninitialized_ml_pipeline_returns_503(self):
        """Test that uninitialized ml_pipeline returns HTTP 503 when authenticated."""
        payload = {
            "cycle_of_donations": 90.0,
            "frequency_in_days": 90.0,
            "registration_days": 180.0,
            "role": "Regular Donor",
            "blood_group": "O Positive",
            "gender": "Male",
            "donor_type": "Regular Donor",
            "eligibility_status": "eligible"
        }
        original_pipeline = main_mod.ml_pipeline
        try:
            main_mod.ml_pipeline = None
            response = self.client.post("/predict/donor-status", json=payload, headers=AUTH_HEADERS)
            self.assertEqual(response.status_code, 503)
            self.assertIn("unavailable", response.json().get("detail", ""))
        finally:
            main_mod.ml_pipeline = original_pipeline

    def test_11_existing_route_regression_health(self):
        """Test that existing /health endpoint remains functional and requires no ML key."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "healthy")

    def test_12_existing_route_regression_library_article(self):
        """Test that existing educational library article endpoint remains functional."""
        response = self.client.get("/library/article/recurring-donor-necessity")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("title", data)
        self.assertIn("Why Thalassemia Patients Need the Same Donor", data["title"])

if __name__ == "__main__":
    unittest.main()
