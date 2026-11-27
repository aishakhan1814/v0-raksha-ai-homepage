"""Minimal public surface for the remote retrospective ML service.

The broader FastAPI application contains operational endpoints that are not
needed by the ML host. This app exposes only model health, public model
metadata, and API-key-protected prediction.
"""

from fastapi import FastAPI

from .main import (
    DonorStatusPredictionRequest,
    DonorStatusPredictionResponse,
    health_check,
    model_info,
    predict_donor_status,
)

app = FastAPI(
    title="RakshAI Retrospective Donor Engagement Model",
    description="Experimental administrative classification API; not a clinical decision service.",
    version="1.0.0",
)

app.add_api_route("/health", health_check, methods=["GET"])
app.add_api_route("/model/info", model_info, methods=["GET"])
app.add_api_route(
    "/predict/donor-status",
    predict_donor_status,
    methods=["POST"],
    response_model=DonorStatusPredictionResponse,
)
