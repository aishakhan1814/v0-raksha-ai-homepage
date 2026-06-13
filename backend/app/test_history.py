import os
import json

_LOCAL_CHAT_SESSIONS = {}

def get_chat_history_from_db(patient_id: str):
    if patient_id not in _LOCAL_CHAT_SESSIONS:
        # Initial seeded context showing a returning family session
        _LOCAL_CHAT_SESSIONS[patient_id] = [
            {"role": "user", "content": "Hi, I am Arjun's mother. We are visiting KIMS Hospital next week. Do we have B+ donors ready there?"},
            {"role": "assistant", "content": "Hello Mrs. Sharma! Yes, we have two B+ compatible donors ready for Arjun in Hyderabad: Ramesh R. (O+, Primary, 97% reliability) and Suresh K. (B+, Standby, 84% reliability). KIMS is fully aligned."}
        ]
    return list(_LOCAL_CHAT_SESSIONS[patient_id])

def save_chat_history_to_db(patient_id: str, messages: list):
    _LOCAL_CHAT_SESSIONS[patient_id] = messages

def simulate_chat_flow(patient_id: str, message: str):
    # 1. Retrieve history
    history = get_chat_history_from_db(patient_id)
    print(f"Context length before query: {len(history)} messages.")
    
    # 2. Append new user query
    history.append({"role": "user", "content": message})
    
    # 3. Slide context window to last 5 messages for Bedrock context
    context_messages = list(history[-5:])
    while context_messages and context_messages[0]["role"] != "user":
        context_messages.pop(0)
    
    print(f"Bedrock Context Window Length: {len(context_messages)} messages.")
    
    # 4. Generate fallback response utilizing history context
    msg_lower = message.lower()
    if any(k in msg_lower for k in ["ramesh", "suresh", "contact", "phone", "number", "email"]):
        reply = (
            "Ramesh R.'s contact is +919999999999 (email: ramesh.r@email.com). "
            "Suresh K.'s contact is +918888888888. Please route any communication through the care coordinator for safety."
        )
    else:
        reply = "Hello! I am Raksha, your care coordinator. How can I help you?"
        
    # 5. Append reply to history and save
    history.append({"role": "assistant", "content": reply})
    save_chat_history_to_db(patient_id, history)
    return reply

def run_test():
    patient_id = "RKSH-ARJUN9"
    print("--- 1. LOADING INITIAL CARE MEMORY ON MOUNT ---")
    initial_history = get_chat_history_from_db(patient_id)
    print(json.dumps(initial_history, indent=2))
    
    print("\n--- 2. RETURNING MOTHER SENDS FOLLOW-UP ---")
    query = "Thank you! What are their contact details?"
    print(f"User: {query}")
    reply = simulate_chat_flow(patient_id, query)
    print(f"Raksha: {reply}")
    
    print("\n--- 3. VERIFYING DYNAMODB UPDATED SESSION HISTORY ---")
    updated_history = get_chat_history_from_db(patient_id)
    print(json.dumps(updated_history, indent=2))

if __name__ == '__main__':
    run_test()
