import os
import json
import datetime

def load_fallback_data():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    fallback_path = os.path.abspath(os.path.join(current_dir, "../../public/seed_data.json"))
    with open(fallback_path, "r", encoding="utf-8") as f:
        return json.load(f)

def check_blood_compatibility(donor_bg, patient_bg):
    compatibility = {
        "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
        "O+": ["O+", "A+", "B+", "AB+"],
        "A-": ["A-", "A+", "AB-", "AB+"],
        "A+": ["A+", "AB+"],
        "B-": ["B-", "B+", "AB-", "AB+"],
        "B+": ["B+", "AB+"],
        "AB-": ["AB-", "AB+"],
        "AB+": ["AB+"]
    }
    if donor_bg == patient_bg:
        return "exact"
    elif patient_bg in compatibility.get(donor_bg, []):
        return "compatible"
    return "incompatible"

def test_matching_logic():
    data = load_fallback_data()
    patients = data.get("patients", [])
    donors = data.get("donors", [])
    
    # Target patient: Arjun Sharma
    patient = None
    for p in patients:
        if p.get("requestId") == "RKSH-ARJUN9":
            patient = p
            break
            
    assert patient is not None, "Arjun Sharma not found in seed patients"
    
    patient_blood = patient.get("bloodGroup") # B+
    patient_city = patient.get("city") or patient.get("address", "").split(",")[-1].strip() # Hyderabad
    patient_state = patient.get("state") or "Telangana"
    
    ref_date = datetime.date(2026, 6, 7)
    matched_donors = []
    
    for d in donors:
        donor_bg = d.get("bloodType")
        donor_city = d.get("city", "")
        donor_state = d.get("state", "")
        
        # 1. Blood type match (40 pts)
        blood_comp = check_blood_compatibility(donor_bg, patient_blood)
        if blood_comp == "exact":
            blood_score = 40.0
        elif blood_comp == "compatible":
            blood_score = 30.0
        else:
            blood_score = 0.0
            
        if blood_score == 0.0:
            continue
            
        # 2. City match (30 pts)
        if donor_city.lower() == patient_city.lower():
            city_score = 30.0
        elif donor_state.lower() == patient_state.lower() and donor_state != "":
            city_score = 15.0
        else:
            city_score = 0.0
            
        # 3. Recency (30 pts)
        last_donated_str = d.get("lastDonated")
        days_since = None
        if not last_donated_str:
            recency_score = 30.0
            days_since = 999
            eligible = True
            explanation_recency = "no previous donation (30/30)"
        else:
            ld_date = datetime.datetime.strptime(last_donated_str, "%Y-%m-%d").date()
            days_since = (ref_date - ld_date).days
            if days_since < 0:
                days_since = 999
            
            if days_since >= 180:
                recency_score = 30.0
                eligible = True
                explanation_recency = f"{days_since} days since last donation (30/30)"
            elif days_since >= 90:
                recency_score = 20.0
                eligible = True
                explanation_recency = f"{days_since} days since last donation (20/30)"
            else:
                recency_score = 0.0
                eligible = False
                explanation_recency = f"deferred: only {days_since} days since last donation (0/30)"
                
        total_score = round(blood_score + city_score + recency_score, 1)
        
        score_breakdown = {
            "bloodTypeMatchScore": blood_score,
            "cityMatchScore": city_score,
            "recencyScore": recency_score,
            "rankingLabel": "ML-powered ranking",
            "explanation": (
                f"ML-powered ranking: {blood_comp.capitalize()} blood type ({blood_score}/40), "
                f"{'exact' if city_score == 30 else ('state-only' if city_score == 15 else 'no')} city match ({city_score}/30), "
                f"{explanation_recency}."
            )
        }
        
        matched_donors.append({
            "donorId": d.get("donorId"),
            "name": f"{d.get('firstName')} {d.get('lastName')}",
            "bloodType": donor_bg,
            "city": donor_city,
            "matchScore": total_score,
            "scoreBreakdown": score_breakdown,
            "daysSinceLastDonation": days_since,
            "eligible": eligible
        })
        
    matched_donors.sort(key=lambda x: x["matchScore"], reverse=True)
    
    print(json.dumps({
        "patient": patient.get("firstName") + " " + patient.get("lastName"),
        "patientBlood": patient_blood,
        "patientCity": patient_city,
        "matches": matched_donors[:3]
    }, indent=2))

if __name__ == '__main__':
    test_matching_logic()
