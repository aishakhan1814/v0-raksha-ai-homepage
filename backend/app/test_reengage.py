import sys
import os
import asyncio

# Adjust path to import backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import reengage_user, ReengageRequest

async def test_reengage():
    print("Testing reengage_user function for donor Rahul V...")
    req_donor = ReengageRequest(
        name="Rahul V.",
        role="Donor",
        reason="Deferred status, needs confirmation check"
    )
    res_donor = await reengage_user(req_donor)
    print("Donor Response:", res_donor)
    assert res_donor["success"] is True
    assert res_donor["role"] == "Donor"
    
    print("\nTesting reengage_user function for patient Karan M...")
    req_patient = ReengageRequest(
        name="Karan M.",
        role="Patient",
        reason="SLA window warning alert"
    )
    res_patient = await reengage_user(req_patient)
    print("Patient Response:", res_patient)
    assert res_patient["success"] is True
    assert res_patient["role"] == "Patient"
    
    print("\nAll tests completed successfully!")

if __name__ == "__main__":
    asyncio.run(test_reengage())
