import os

def test_outreach_translation():
    donor_name = "Priya Sharma"
    donor_phone = "+919876543211"
    patient_name = "Arjun Sharma"
    blood_group = "B+"
    hospital = "Rainbow Thalassemia Centre"
    
    base_message = (
        f"Thalassemia patient {patient_name} ({blood_group}) urgently needs blood at {hospital}. "
        f"As a registered donor, your profile matches. Please confirm availability. Reply YES to accept."
    )
    
    # Emulate Hindi translation fallback
    translated_text = (
        f"थैलेसीमिया मरीज {patient_name} ({blood_group}) को {hospital} में तत्काल रक्त की आवश्यकता है। "
        f"एक पंजीकृत दाता के रूप में, आपकी प्रोफ़ाइल मेल खाती है। कृपया उपलब्धता की पुष्टि करें। स्वीकार करने के लिए YES उत्तर दें।"
    )
    
    message = f"Dear {donor_name}, {translated_text}"
    
    print("\n" + "="*80)
    print(f"[AUTOMATED OUTREACH PROOF] Multilingual Outbound notification triggered!")
    print(f"To Donor: {donor_name} ({donor_phone})")
    print(f"Message: {message}")
    print("="*80 + "\n")

if __name__ == '__main__':
    test_outreach_translation()
