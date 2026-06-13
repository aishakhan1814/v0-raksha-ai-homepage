import sys
import os
import json

# Ensure backend folder is in path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import (
    step_function_match_handler,
    step_function_check_handler,
    step_function_escalate_handler
)

def run_step_function_simulation():
    patient_id = "RKSH-ARJUN9"
    wait_seconds = 10
    
    print("=" * 80)
    print(f"STARTING AWS STEP FUNCTION STATE MACHINE SIMULATION FOR PATIENT: {patient_id}")
    print("=" * 80)

    # 1. State: MatchDonor
    print("\n>>> STATE 1: MatchDonor (Invoking match handler...)")
    match_event = {"patient_id": patient_id, "wait_seconds": wait_seconds}
    match_output = step_function_match_handler(match_event, None)
    
    print("Match Lambda Output Payload:")
    print(json.dumps(match_output, indent=2))
    
    if match_output.get("status") == "NO_DONOR_FOUND":
        print("Flow terminated: No donor found.")
        return
        
    # 2. State: SendOutreach (SNS Publish direct integration)
    print("\n>>> STATE 2: SendOutreach (Direct AWS SNS Publish integration)")
    print(f"Executing: sns.publish(PhoneNumber={match_output['donor_phone']}, Message='{match_output['outreach_message']}')")
    print(f"Outbound SMS sent successfully to registered donor: {match_output['donor_name']} ({match_output['donor_phone']})")

    # 3. State: WaitPeriod
    print(f"\n>>> STATE 3: WaitPeriod (WaitState)")
    print(f"Reading wait duration from: $.wait_seconds = {match_output['wait_seconds']} seconds")
    print(f"Simulating waiting {match_output['wait_seconds']} seconds...")

    # 4. State: CheckResponse (Invoking checkResponse handler)
    # Scenario A: No Response (Status remains 'Pending')
    print("\n>>> STATE 4 (Scenario A): CheckResponse -> No Response Case")
    # Simulate payload passed to check handler
    check_event = {
        "patient_id": patient_id,
        "donor_id": match_output["donor_id"]
    }
    # Execute checkResponse (should return NO_RESPONSE since database status is 'Pending')
    check_output_a = step_function_check_handler(check_event, None)
    print("Check Response Output (Scenario A):")
    print(json.dumps(check_output_a, indent=2))
    
    if check_output_a.get("status") == "NO_RESPONSE":
        print("\n>>> STATE 5 (Scenario A): EscalateOutreach (Invoking escalate handler...)")
        escalate_event = check_output_a
        escalate_output = step_function_escalate_handler(escalate_event, None)
        print("Escalation Output:")
        print(json.dumps(escalate_output, indent=2))
        print("Flow completed: State Machine reached EndEscalated state.")

    # Scenario B: Successful Fulfillment (Status updated to 'Accepted')
    print("\n" + "-"*50)
    print(">>> STATE 4 (Scenario B): CheckResponse -> Response Received Case")
    
    # We will simulate a response by passing a mock event where the check handler detects acceptance.
    # In a real environment, the patient or coordinator updates the record in DynamoDB.
    # We can inject a mock event or temporarily check the code logic.
    # Since our checkResponse handler evaluates if the patient record's status is 'Fulfilled' or 'Accepted',
    # we can simulate the check handler receiving the status update:
    print("Simulating that Arjun's mother accepted Suresh K.'s match (status set to 'Accepted' in DB)...")
    
    # We construct a mock representation of a fulfilled state:
    fulfilled_mock_result = {
        "status": "FULFILLED",
        "patient_id": patient_id,
        "donor_id": match_output["donor_id"],
        "request_status": "Accepted"
    }
    print("Check Response Output (Scenario B Mocked):")
    print(json.dumps(fulfilled_mock_result, indent=2))
    
    if fulfilled_mock_result.get("status") == "FULFILLED":
        print("\n>>> STATE 5 (Scenario B): Choice routes to EndFulfilled")
        print("Flow completed: State Machine reached EndFulfilled state successfully!")

    print("\n" + "=" * 80)
    print("AWS STEP FUNCTION STATE MACHINE SIMULATION COMPLETED")
    print("=" * 80)

if __name__ == '__main__':
    run_step_function_simulation()
