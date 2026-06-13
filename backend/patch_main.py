import os

main_path = 'app/main.py'
if not os.path.exists(main_path):
    main_path = 'backend/app/main.py'

print(f"Reading {main_path}...")
with open(main_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace language detection
old_detect = """            is_hindi = any(char in msg_lower for char in "অআইঈউঊঋএঐওঔকখগঘচছজঝটठडढणतथদधनपফবভমयरलवशषसहक्षत्रज्ञनमस्ते") or any(word in msg_lower for word in ["namaste", "aapka", "blood", "donor", "sharma", "khoon", "kab", "hospital", "madad", "help", "hindi"])
            is_telugu = any(char in msg_lower for char in "అఆఇఈఉఊఋఎఏఐఒఓఔకఖగఘచఛజఝటఠడఢణతథదధనపఫబభమయరలవశஷసహళక్ష") or any(word in msg_lower for word in ["namaste", "raktham", "datha", "sahayam", "eppudu", "telugu"])"""

new_detect = """            is_hindi = any(char in msg_lower for char in "অআইঈউঊঋএঐওঔকখগঘচছজঝটठडढणतथদधनপফবভমयरलवशषসহকষত্রজ্ঞনমস্তে") or any(word in msg_lower for word in ["namaste", "aapka", "sharma", "khoon", "kab", "madad", "hindi"])
            is_telugu = any(char in msg_lower for char in "అఆఇఈఉఊఋఎఏఐఒఓఔకఖగఘచఛజఝటఠడఢణతథదధనపఫబభమయరలవశషసహళక్ష") or any(word in msg_lower for word in ["raktham", "datha", "sahayam", "eppudu", "telugu"])
            is_tamil = any(char in msg_lower for char in "அஆஇஈஉஊஎஏஐஒஓஔகஙசஞடணதநபமயரலவழளறன") or any(word in msg_lower for word in ["vanakkam", "raththam", "dhaadha", "udhavi", "eppodhu", "tamil"])
            is_bengali = any(char in msg_lower for char in "অআইঈউঊঋএঐওঔকখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহড়ঢ়য়ৎংঃঁ") or any(word in msg_lower for word in ["namaskar", "rokto", "data", "sahajjo", "kobe", "bengali", "bangla"])"""

# Let's check if old_detect is in content. If not, let's find a more flexible replacement.
if old_detect not in content:
    # Try with a simpler target
    print("Exact old_detect block not found, trying fallback matching...")
    # We will search and replace based on line markers.

# We can find the block between:
# "is_hindi = "
# and
# "donors_str = "
# and replace it.

# Let's replace the response logic block.
# We will target from "if any(k in msg_lower for k in ["ramesh", "suresh", "contact", "phone", "number", "email", "नंबर", "फ़ोन", "ఫోన్", "నెంబర్"]):"
# down to the end of "return {"response": reply, ..."

old_response_block = """            # Generate response based on language, history, and keywords
            if any(k in msg_lower for k in ["ramesh", "suresh", "contact", "phone", "number", "email", "नंबर", "फ़ोन", "ఫోన్", "నెంబర్"]):
                if is_telugu:
                    reply = (
                        "రమేష్ ఆర్. గారి ఫోన్ నెంబర్ +919999999999 మరియు ఈమెయిల్ ramesh.r@email.com. "
                        "మరియు సురేష్ కే. ఫోన్ నెంబர் +918888888888. సమన్வయకర్త ద్వారా సంప్రదించవచ్చు."
                    )
                elif is_hindi:
                    reply = (
                        "रमेश आर. का फोन नंबर +919999999999 और ईमेल ramesh.r@email.com है। "
                        "सुरेश के. का फोन नंबर +918888888888 है। आप उन्हें हमारे केयर कोऑर्डिनेটর के माध्यम से संपर्क कर सकते हैं।"
                    )
                else:
                    reply = (
                        "Ramesh R.'s contact is +919999999999 (email: ramesh.r@email.com). "
                        "Suresh K.'s contact is +918888888888. Please route any communication through the care coordinator for safety."
                    )
            elif is_telugu:
                if any(k in msg_lower for k in ["donor", "datha", "దాత", "సహాయం", "రక్తం", "blood", "match"]):
                    reply = (
                        f"నమస్తే! మీ ప్రొఫైల్ ఆధారంగా, హైదరాబాద్‌లో లభించిన {bg} దాతలు: {donors_str}. "
                        f"గతంలో నేను చెప్పినట్లుగా రమేష్ ఆర్. (97% విశ్వసనీయత) మీ ప్రధాన దాత."
                    )
                elif any(k in msg_lower for k in ["transfusion", "schedule", "eppudu", "ఎప్పుడు", "time", "date", "hospital"]):
                    reply = (
                        f"అర్जुన్ గారి తదుపరి బ్లడ్ ట్రాన్స్‌ఫ్యూషన్ 15 జూన్ 2026 న ఉదయం 9:00 గంటలకు రైన్‌బో థాలసీమియా సెంటర్‌లో జరగనుంది. "
                        f"డాక్టర్ {hematologist} పర్యవేక్షణలో ఇది ఉంటుంది."
                    )
                elif any(k in msg_lower for k in ["hb", "hemoglobin", "health", "రిపోర్ట్", "రిపోర్టు"]):
                    reply = (
                        f"అర్జున్ గారి చివరి హిమోగ్లోబిన్ (Hb) స్థాయి {last_hb} g/dL గా నమోదైంది. మీ తదుపరి అపాయింట్‌మెంట్ కన్ఫర్మ్ అయింది."
                    )
                else:
                    reply = (
                        f"నమస్తే, నేను రక్షను. అర్జున్ శర్మ గారి రక్త సమన్వయకర్తను. "
                        f"నేను మీకు దాతల సమాచారం లేదా చికిత్స సమయపట్టిక గురించి సహాయపడగలను. మీకు ఏమి సమాచారం కావాలి?"
                    )
            elif is_hindi:
                if any(k in msg_lower for k in ["donor", "दाता", "मदদ", "रक्त", "blood", "match", "khoon"]):
                    reply = (
                        f"नमस्ते! अर्जुन के प्रोफाइल के अनुसार, हैदराबाद में प्रमुख {bg} दाता हैं: {donors_str}। "
                        f"जैसा कि मैंने पहले बताया था, रमेश आर. (97% विश्वसनीयता) प्राथमिक दाता हैं।"
                    )
                elif any(k in msg_lower for k in ["transfusion", "schedule", "kab", "कब", "time", "date", "hospital", "अस्पताल"]):
                    reply = (
                        f"अर्जुन का अगला ब्लड ट्रांसफ्यूजन 15 जून 2026 को सुबह 9:00 बजे रेनबो थैलेसीमिया सेंटर में निर्धारित है। "
                        f"डॉ. {hematologist} इस प्रक्रिया की निगरानी कर रही हैं।"
                    )
                elif any(k in msg_lower for k in ["hb", "hemoglobin", "health", "रिपोर्ट", "तबीयत"]):
                    reply = (
                        f"अर्जुन का अंतिम हीमोग्लोबिन स्तर {last_hb} g/dL है। वह स्थिर सीमा में हैं। दवाइयाँ समय पर लेते रहें।"
                    )
                else:
                    reply = (
                        f"नमस्ते, मैं रक्षा हूँ, अर्जुन शर्मा की रक्त समन्वयक। "
                        f"मैं दाताओं की खोज, आगामी ट्रांसफ्यूজন या अर्जुन के स्वास्थ्य रिपोर्ट से संबंधित किसी भी प्रश्न में आपकी मदद कर सकती हूँ। बताइए, मैं आपकी क्या सहायता करूँ?"
                    )
            else: # English
                if any(k in msg_lower for k in ["donor", "match", "backup", "blood", "need"]):
                    reply = (
                        f"Hello! For Arjun's blood group ({bg}), we have active matching donors in Hyderabad: {donors_str}. "
                        f"As mentioned earlier, Ramesh R. is his Primary Donor, and Suresh K. is on Standby."
                    )
                elif any(k in msg_lower for k in ["transfusion", "schedule", "when", "date", "time", "hospital", "appointment"]):
                    reply = (
                        f"Arjun's next transfusion is scheduled for June 15, 2026, at 9:00 AM at the {hosp}. "
                        f"Dr. {hematologist} is supervising, and backup donors are fully aligned."
                    )
                elif any(k in msg_lower for k in ["hb", "hemoglobin", "health", "report", "medication"]):
                    reply = (
                        f"Arjun's last recorded Hemoglobin (Hb) was {last_hb} g/dL, which is within his safe threshold."
                    )
                else:
                    reply = (
                        f"Hello! I am Raksha, the blood coordinator for Arjun Sharma ({bg}). "
                        f"How can I assist the Sharma family today?"
                    )
            
            # Append reply to history and save
            history.append({"role": "assistant", "content": reply})
            save_chat_history_to_db(req.patient_id, history)
            
            return {
                "response": reply,
                "source": "Raksha Simulation Engine (Offline Fallback)",
                "patient_id": req.patient_id,
                "debug_info": {
                    "detected_lang": "Hindi" if is_hindi else ("Telugu" if is_telugu else "English"),
                    "matched_donors": compatible_donors,
                    "context_length": len(context_messages)
                }
            }"""

new_response_block = """            # Generate response based on language, history, and keywords
            if any(k in msg_lower for k in ["ramesh", "suresh", "contact", "phone", "number", "email", "नंबर", "फ़ोन", "ఫోన్", "నెంబర్", "எண்", "தொலைபேசி", "நம্বর", "ফোন"]):
                if is_telugu:
                    reply = (
                        "రమేష్ ఆర్. గారి ఫోన్ నెంబర్ +919999999999 మరియు ఈమెయిల్ ramesh.r@email.com. "
                        "மరియు సురేష్ కే. ఫోన్ నెంబర్ +918888888888. సమన్వయకర్త ద్వారా సంప్రదించవచ్చు."
                    )
                elif is_hindi:
                    reply = (
                        "रमेश आर. का फोन नंबर +919999999999 और ईमेल ramesh.r@email.com है। "
                        "सुरेश के. का फोन नंबर +918888888888 है। आप उन्हें हमारे केयर कोऑर्डिनेটর के माध्यम से संपर्क कर सकते हैं।"
                    )
                elif is_tamil:
                    reply = (
                        "ரமேஷ் ஆர்.-ன் தொடர்பு எண் +919999999999 (மின்னஞ்சல்: ramesh.r@email.com). "
                        "சுரேஷ் கே.-ன் தொடர்பு எண் +918888888888. பாதுகாப்புக்காக எங்களை கேர் ஒருங்கிணைப்பாளர் மூலம் தொடர்பு கொள்ளவும்."
                    )
                elif is_bengali:
                    reply = (
                        "রমেশ আর.-এর ফোন নম্বর +919999999999 (ইমেল: ramesh.r@email.com)। "
                        "সুরেশ কে.-এর ফোন নম্বর +918888888888। সুরক্ষার জন্য অনুগ্রহ করে কেয়ার কো-অর্ডিনেটরের মাধ্যমে যোগাযোগ করুন।"
                    )
                else:
                    reply = (
                        "Ramesh R.'s contact is +919999999999 (email: ramesh.r@email.com). "
                        "Suresh K.'s contact is +918888888888. Please route any communication through the care coordinator for safety."
                    )
            elif is_telugu:
                if any(k in msg_lower for k in ["donor", "datha", "దాత", "సహాయం", "రక్తం", "blood", "match"]):
                    reply = (
                        f"నమస్తే! మీ ప్రొఫైల్ ఆధారంగా, హైదరాబాద్‌లో లభించిన {bg} దాతలు: {donors_str}. "
                        f"గతంలో నేను చెప్పినట్లుగా రమేష్ ఆర్. (97% విశ్వసనీయత) మీ ప్రధాన దాత."
                    )
                elif any(k in msg_lower for k in ["transfusion", "schedule", "eppudu", "ఎప్పుడు", "time", "date", "hospital"]):
                    reply = (
                        f"అర్జున్ గారి తదుపరి బ్లడ్ ట్రాన్స్‌ఫ్యూషన్ 15 జూన్ 2026 న ఉదయం 9:00 గంటలకు రైన్‌బో థాలసీమియా సెంటర్‌లో జరగనుంది. "
                        f"డాక్టర్ {hematologist} పర్యవేక్షణలో ఇది ఉంటుంది."
                    )
                elif any(k in msg_lower for k in ["hb", "hemoglobin", "health", "రిపోర్ట్", "రిపోర్టు"]):
                    reply = (
                        f"అర్జున్ గారి చివరి హిమోగ్লোবিন (Hb) స్థాయి {last_hb} g/dL గా నమోదైంది. మీ తదుపరి అపాయింట్‌మెంట్ కన్ఫర్ம் అయింది."
                    )
                else:
                    reply = (
                        f"నమస్తే, నేను రక్షను. అర్జున్ శర్మ గారి రక్త సమన్వయకర్తను. "
                        f"నేను మీకు దాతల సమాచారం లేదా చికిత్స సమయపట్టిక గురించి సహాయపడగలను. మీకు ఏమి సమాచారం కావాలి?"
                    )
            elif is_hindi:
                if any(k in msg_lower for k in ["donor", "दाता", "मদद", "रक्त", "blood", "match", "khoon"]):
                    reply = (
                        f"नमस्ते! अर्जुन के प्रोफाइल के अनुसार, हैदराबाद में प्रमुख {bg} दाता हैं: {donors_str}। "
                        f"जैसा कि मैंने पहले बताया था, रमेश आर. (97% विश्वसनीयता) प्राथमिक दाता हैं।"
                    )
                elif any(k in msg_lower for k in ["transfusion", "schedule", "kab", "कब", "time", "date", "hospital", "अस्पताल"]):
                    reply = (
                        f"अर्जुन का अगला ब्लड ट्रांसफ्यूजन 15 जून 2026 को सुबह 9:00 बजे रेनबो थैलेसीमिया सेंटर में निर्धारित है। "
                        f"डॉ. {hematologist} इस प्रक्रिया की निगरानी कर रही हैं।"
                    )
                elif any(k in msg_lower for k in ["hb", "hemoglobin", "health", "रिपोर्ट", "तबीयत"]):
                    reply = (
                        f"अर्जुन का अंतिम हीमोग्लोबिन स्तर {last_hb} g/dL है। वह स्थिर सीमा में हैं। दवाइयाँ समय पर लेते रहें।"
                    )
                else:
                    reply = (
                        f"नमस्ते, मैं रक्षा हूँ, अर्जुन शर्मा की रक्त समन्वयक। "
                        f"मैं दाताओं की खोज, आगामी ट्रांसफ्यूजन या अर्जुन के स्वास्थ्य रिपोर्ट से संबंधित किसी भी प्रश्न में आपकी मदद कर सकती हूँ। बताइए, मैं आपकी क्या सहायता करूँ?"
                    )
            elif is_tamil:
                if any(k in msg_lower for k in ["donor", "match", "dhaadha", "தானம்", "இரத்தம்", "blood", "raththam"]):
                    reply = (
                        f"வணக்கம்! அர்ஜுனின் சுயவிவரத்தின்படி, ஹைதராபாத்தில் உள்ள பொருத்தமான {bg} தானம் வழங்குபவர்கள்: {donors_str}. "
                        f"நான் முன்பு குறிப்பிட்டது போல, ரமேஷ் ஆர். முதன்மை தானம் வழங்குபவர்."
                    )
                elif any(k in msg_lower for k in ["transfusion", "schedule", "eppodhu", "எப்போது", "time", "date", "hospital", "மருத்துவமனை"]):
                    reply = (
                        f"அர்ஜுனின் அடுத்த இரத்தமாற்றம் ஜூன் 15, 2026 அன்று காலை 9:00 மணிக்கு {hosp} மருத்துவமனையில் திட்டமிடப்பட்டுள்ளது. "
                        f"டாக்டர். {hematologist} மேற்பார்வையில் இது நடைபெறும்."
                    )
                elif any(k in msg_lower for k in ["hb", "hemoglobin", "health", "அளவு", "ஹீமோகுளோபின்"]):
                    reply = (
                        f"அர்ஜுனின் கடைசியாக பதிவு செய்யப்பட்ட ஹீமோகுளோபின் (Hb) அளவு {last_hb} g/dL ஆகும், இது பாதுகாப்பான வரம்பில் உள்ளது."
                    )
                else:
                    reply = (
                        f"வணக்கம்! நான் ரக்ஷா, அர்ஜுன் சர்மாவின் ({bg}) இரத்த ஒருங்கிணைப்பாளர். "
                        f"உங்களுக்கு தானம் வழங்குபவர்கள் அல்லது இரத்தமாற்ற திட்டங்கள் பற்றிய ஏதேனும் தகவல் வேண்டுமா?"
                    )
            elif is_bengali:
                if any(k in msg_lower for k in ["donor", "match", "data", "দাতা", "রক্ত", "blood", "match", "rokto"]):
                    reply = (
                        f"নমস্কার! অর্জুনের প্রোফাইল অনুযায়ী, হায়দ্রাবাদে উপযুক্ত {bg} রক্তদাতা হলেন: {donors_str}। "
                        f"আমি আগে যেমন বলেছি, রমেশ আর. হলেন প্রাথমিক রক্তদাতা।"
                    )
                elif any(k in msg_lower for k in ["transfusion", "schedule", "kobe", "কবে", "time", "date", "hospital", "হাসপাতাল"]):
                    reply = (
                        f"অর্জুনের পরবর্তী রক্ত সঞ্চালন ১৫ই জুন, ২০২৬ সকাল ৯:০০ টায় {hosp} এ নির্ধারিত হয়েছে। "
                        f"ডাঃ {hematologist} এটি তত্ত্বাবধান করছেন।"
                    )
                elif any(k in msg_lower for k in ["hb", "hemoglobin", "health", "হিমোগ্লোবিন", "রিপোর্ট"]):
                    reply = (
                        f"অর্জুনের শেষ রেকর্ড করা হিমোগ্লোবিন (Hb) ছিল {last_hb} g/dL, যা নিরাপদ সীমার মধ্যে রয়েছে।"
                    )
                else:
                    reply = (
                        f"নমস্কার! আমি রক্ষা, অর্জুন শর্মার ({bg}) রক্ত সমন্বয়কারী। "
                        f"রক্তদাতা বা রক্ত সঞ্চালনের সময়সূচী সম্পর্কিত যেকোনো তথ্যে আমি আপনাকে সাহায্য করতে পারি। বলুন, কীভাবে সাহায্য করব?"
                    )
            else: # English
                if any(k in msg_lower for k in ["donor", "match", "backup", "blood", "need"]):
                    reply = (
                        f"Hello! For Arjun's blood group ({bg}), we have active matching donors in Hyderabad: {donors_str}. "
                        f"As mentioned earlier, Ramesh R. is his Primary Donor, and Suresh K. is on Standby."
                    )
                elif any(k in msg_lower for k in ["transfusion", "schedule", "when", "date", "time", "hospital", "appointment"]):
                    reply = (
                        f"Arjun's next transfusion is scheduled for June 15, 2026, at 9:00 AM at the {hosp}. "
                        f"Dr. {hematologist} is supervising, and backup donors are fully aligned."
                    )
                elif any(k in msg_lower for k in ["hb", "hemoglobin", "health", "report", "medication"]):
                    reply = (
                        f"Arjun's last recorded Hemoglobin (Hb) was {last_hb} g/dL, which is within his safe threshold."
                    )
                else:
                    reply = (
                        f"Hello! I am Raksha, the blood coordinator for Arjun Sharma ({bg}). "
                        f"How can I assist the Sharma family today?"
                    )
            
            # Append reply to history and save
            history.append({"role": "assistant", "content": reply})
            save_chat_history_to_db(req.patient_id, history)
            
            return {
                "response": reply,
                "source": "Raksha Simulation Engine (Offline Fallback)",
                "patient_id": req.patient_id,
                "debug_info": {
                    "detected_lang": "Hindi" if is_hindi else ("Telugu" if is_telugu else ("Tamil" if is_tamil else ("Bengali" if is_bengali else "English"))),
                    "matched_donors": compatible_donors,
                    "context_length": len(context_messages)
                }
            }"""

# Try to find and replace
if old_detect in content:
    content = content.replace(old_detect, new_detect)
    print("Replaced detection block successfully.")
else:
    # Use fallback string matching
    # Find start and end indices of old detection block
    start_str = '            # Determine language based on scripts/keys'
    end_str = '            # Extract names & keys'
    
    start_idx = content.find(start_str)
    end_idx = content.find(end_str)
    
    if start_idx != -1 and end_idx != -1:
        content = content[:start_idx] + start_str + "\n" + new_detect.strip() + "\n\n" + content[end_idx:]
        print("Replaced detection block successfully via line markers.")

# Replace response logic block
if old_response_block in content:
    content = content.replace(old_response_block, new_response_block)
    print("Replaced response block successfully.")
else:
    # Use fallback string matching based on start and end marker
    start_str = '            # Generate response based on language, history, and keywords'
    end_str = '            return {\n                "response": reply,'
    
    start_idx = content.find(start_str)
    end_idx = content.find(end_str)
    
    if start_idx != -1 and end_idx != -1:
        # Find the closing bracket of return
        end_return_idx = content.find('}', end_idx)
        if end_return_idx != -1:
            content = content[:start_idx] + new_response_block + content[end_return_idx+1:]
            print("Replaced response block successfully via line markers.")

print(f"Writing changes back to {main_path}...")
with open(main_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patch successfully applied!")
