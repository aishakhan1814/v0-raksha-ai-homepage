import re
import random

def detect_language(message: str) -> str:
    msg_lower = message.lower()
    
    # Check for script characters
    # Telugu: \u0c00-\u0c7f
    if any(u'\u0c00' <= c <= u'\u0c7f' for c in message):
        return "telugu"
    # Tamil: \u0b80-\u0bff
    if any(u'\u0b80' <= c <= u'\u0bff' for c in message):
        return "tamil"
    # Bengali: \u0980-\u09ff
    if any(u'\u0980' <= c <= u'\u09ff' for c in message):
        return "bengali"
    # Hindi/Devanagari: \u0900-\u097f
    if any(u'\u0900' <= c <= u'\u097f' for c in message):
        return "hindi"
        
    # Check for transliterated keywords
    telugu_words = ["raktham", "datha", "sahayam", "eppudu", "telugu", "ela unnavu", "ela unnaru", "dhanyavaadalu", "namaste", "velli vastha"]
    hindi_words = ["namaste", "aapka", "sharma", "khoon", "kab", "madad", "hindi", "kese ho", "kaise ho", "shukriya", "dhanyavad", "alvida"]
    tamil_words = ["vanakkam", "raththam", "dhaadha", "udhavi", "eppodhu", "tamil", "nandri", "poi varugiren"]
    bengali_words = ["namaskar", "rokto", "data", "sahajjo", "kobe", "bengali", "bangla", "dhanyabad", "biday"]
    
    if any(w in msg_lower for w in telugu_words):
        return "telugu"
    if any(w in msg_lower for w in tamil_words):
        return "tamil"
    if any(w in msg_lower for w in bengali_words):
        return "bengali"
    if any(w in msg_lower for w in hindi_words):
        return "hindi"
        
    return "english"

def extract_key_terms(message: str, lang: str) -> str:
    cleaned = re.sub(r'[^\w\s]', '', message).lower()
    words = cleaned.split()
    stopwords = {
        "what", "is", "the", "a", "an", "of", "in", "on", "at", "to", "for", "with", "about", "how", "why",
        "who", "where", "can", "you", "i", "do", "does", "did", "are", "am", "was", "were", "be", "been",
        "have", "has", "had", "this", "that", "these", "those", "please", "tell", "me", "know", "write",
        "code", "program", "capital", "weather", "translate", "and", "or", "but", "so", "if", "then", "else"
    }
    key_words = [w for w in words if w not in stopwords and len(w) > 2]
    
    if not key_words:
        if lang == "hindi":
            return "आपके प्रश्न"
        elif lang == "telugu":
            return "మీ ప్రశ్న"
        elif lang == "tamil":
            return "உங்கள் கேள்வி"
        elif lang == "bengali":
            return "আপনার প্রশ্ন"
        return "your request"
        
    return '"' + " ".join(key_words[:3]) + '"'

def get_fallback_response(message: str, patient: dict, compatible_donors: list) -> dict:
    msg_lower = message.lower()
    lang = detect_language(message)
    
    # Extract names & keys
    bg = patient.get('bloodGroup', 'B+')
    hosp = patient.get('hospital', 'Rainbow Thalassemia Centre')
    last_hb = patient.get('lastHb', '7.6')
    hematologist = patient.get('hematologist', 'Dr. Meera Iyer')
    donors_str = ", ".join(compatible_donors) if compatible_donors else "Ramesh R., Suresh K."
    
    # Check contacts first
    is_contacts = any(k in msg_lower for k in ["ramesh", "suresh", "contact", "phone", "number", "email", "call", "नंबर", "फ़ोन", "ఫోన్", "నెంబర్", "எண்", "தொலைபேசி", "நம্বর", "ফোন"])
    is_doctor = any(k in msg_lower for k in ["doctor", "meera", "iyer", "hematologist", "physician", "डॉ", "డాక్టర్", "மருத்துவர்", "ডাক্তার"])
    is_hospital = any(k in msg_lower for k in ["hospital", "rainbow", "treatment center", "centre", "अस्पताल", "ఆసుపత్రి", "ஆஸ்பத்திரி", "হাসপাতাল"])
    is_arjun = any(k in msg_lower for k in ["arjun", "sharma", "patient", "profile", "age", "address", "gachibowli", "अर्जुन", "అర్జున్", "అర్జున్ శర్మ", "அர்ஜுன்", "அர்ஜுன் சர்மா", "অর্জুন", "অর্জুন শর্মা"])
    is_hb = any(k in msg_lower for k in ["hb", "hemoglobin", "count", "blood level", "test", "report", "हीमोग्लोबिन", "హిమోగ్లోబిన్", "ஹீமோகுளோபின்", "ஹிமோகுளோபின்", "হিমোগ্লোবিন", "तबीयत", "రిపోర్ట్", "రిపోర్టు", "அளவு", "ரிப்போர்ட்", "রিপোর্ট"])
    is_chelation = any(k in msg_lower for k in ["chelation", "deferasirox", "folic acid", "kelation", "iron overload", "ferritin", "दवा", "औषधि", "మందులు", "ఔషధాలు", "மருந்துகள்", "ওষুধ", "दवाइयाँ"])
    is_compatibility = any(k in msg_lower for k in ["compatibility", "compatible", "blood group", "blood type", "antigen", "match group", "universal donor", "o negative", "o-", "b+", "o positive", "b positive", "match", "matching", "సరిపోలిక", "రక్త గ్రూపు", "பொருத்தம்", "ரெக்டக் குரூப்", "রক্তের গ্রুপ", "রক্তের গ্রুপ মেল", "रक्त समूह", "रक्त मेल"])
    is_thalassemia = any(k in msg_lower for k in ["thalassemia", "thalasemia", "major", "minor", "carrier", "genetic", "blood disorder", "थैलेसीमिया", "థాలసీమియా", "தலாசீமியா", "থ্যালাসেমিয়া"])
    is_eligibility = any(k in msg_lower for k in ["eligible", "eligibility", "how often", "frequency", "interval", "weight", "age limit", "criteria", "how many days", "कौन दे सकता है", "అర్హత", "ఎవరు ఇవ్వవచ్చు", "తகுதி", "योग्य", "যোগ্যতা", "उम्र", "वजन", "வயது", "எடை"])
    is_safety = any(k in msg_lower for k in ["safe", "safety", "hurt", "pain", "clean needle", "side effect", "clean", "sterile", "surakshit", "सुरक्षित", "సురక్షిత", "సురక్షితమేనా", "பாதுகாப்", "பாதுகாப்பானது", "নিরাপদ", "নিরাপত্তা", "নొప్పి", "வலி", "ব্যথা", "सुरक्षा", "भय"])
    is_food = any(k in msg_lower for k in ["food", "diet", "eat", "drink", "nutrition", "vitamin", "calcium", "spinach", "pomegranate", "भोजन", "खाना", "ఆహారం", "உணவு", "খাবার", "ফল", "ডায়েট", "डाइट"])
    is_help = any(k in msg_lower for k in ["help", "what can you do", "features", "capabilities", "madad", "sahayam", "udhavi", "sahajjo", "সাহায্য", "உதவி", "సహాయం", "मदद"])
    is_greeting = any(k in msg_lower for k in ["hello", "hi", "hey", "greet", "namaste", "namaskar", "vanakkam", "नमस्ते", "नमस्कार", "నమస్తే", "வணக்கம்", "நமஸ்கார்", "নমস্কার"])
    is_how_are_you = any(k in msg_lower for k in ["how are you", "how's it going", "how do you do", "aap kaise", "kese ho", "ela unnavu", "ela unnaru", "எப்படி இருக்கிறீர்கள்", "কেমন আছেন"])
    is_thank_you = any(k in msg_lower for k in ["thank", "thanks", "dhanyavad", "shukriya", "dhanyavaadalu", "nandri", "dhanyabad", "ধন্যবাদ", "நன்றி", "ధన్యవాదాలు", "ధన్యవాదములు", "शुक्रिया", "धन्यवाद"])
    is_who_are_you = any(k in msg_lower for k in ["who are you", "what is your name", "identify yourself", "aap kaun", "kaun ho", "evaru nuvvu", "evaru meeru", "யார் நீங்கள்", "কে আপনি", "তোমার নাম কি", "आप कौन", "कौन हो", "कौन हैं", "ఎవరు నువ్వు", "ఎవరు మీరు", "ఎవరునువ్వు", "ఎవరుమీరు"])
    is_bye = any(k in msg_lower for k in ["bye", "goodbye", "see you", "alvida", "velli vastha", "poi varugiren", "biday", "বিদায়", "விடைபெறுகிறேன்", "వెళ్ళి వస్తాను", "వెళ్లి వస్తాను", "अलविदा"])

    # General medical query keywords
    medical_keywords = [
        "cancer", "diabetes", "fever", "heart", "pain", "headache", "symptom", "disease", 
        "treatment", "medicine", "covid", "diet", "flu", "cough", "infection", "vaccine", 
        "kidney", "liver", "lung", "brain", "stomach", "blood pressure", "hypertension",
        "cholesterol", "thyroid", "asthma", "allergy", "pregnancy", "sore throat", "wound",
        "बीमारी", "कैंसर", "मधुमेह", "बुखार", "दर्द", "दवाई", "लक्षण", "इलाज",
        "వ్యాధి", "క్యాన్సర్", "మధుమేహం", "జ్వరం", "నొప్పి", "మందు", "చికిత్స", "లక్షణాలు",
        "நோய்", "புற்றுநோய்", "நீரிழிவு", "காய்ச்சல்", "வலி", "மருந்து", "சிகிச்சை", "அறிகுறிகள்",
        "রোগ", "ক্যান্সার", "ডায়াবেটিস", "জ্বর", "ব্যথা", "ওষুধ", "চিকিৎসা", "উপসর্গ"
    ]
    is_general_medical = any(k in msg_lower for k in medical_keywords)

    # Define response databases
    responses = {}
    
    # ------------------ English Responses ------------------
    responses["english"] = {
        "contacts": [
            "Ramesh R.'s contact is +919999999999 (email: ramesh.r@email.com). Suresh K.'s contact is +918888888888. Please route any communication through the care coordinator for safety.",
            "You can contact our primary donor Ramesh R. at +919999999999 or email ramesh.r@email.com. Our backup donor Suresh K. is available at +918888888888."
        ],
        "doctor": [
            f"Arjun's supervising hematologist is Dr. Meera Iyer. She is an expert in pediatric hematology and monitors Arjun's transfusion cycles and iron chelation levels at {hosp}.",
            f"Dr. Meera Iyer is Arjun's primary hematologist. She coordinates his care and reviews his Hb reports at {hosp} regularly."
        ],
        "hospital": [
            f"Arjun is receiving care at {hosp}. It is a specialized thalassemia treatment center fully equipped for pediatric blood transfusions.",
            f"All of Arjun's transfusions are scheduled at {hosp}. The hospital coordinates directly with us to ensure compatible blood units are ready."
        ],
        "arjun": [
            f"Arjun Sharma is a 12-year-old patient diagnosed with Thalassemia Major. He lives in Gachibowli, Hyderabad, and has B+ blood group.",
            f"Arjun is a young champion fighting Thalassemia Major. He has B+ blood group and is undergoing regular transfusion therapy under our supervision."
        ],
        "hb": [
            f"Arjun's last recorded Hemoglobin (Hb) was {last_hb} g/dL, which is within his safe threshold. We monitor this before each transfusion to adjust the blood quantity.",
            f"His Hemoglobin level was recently measured at {last_hb} g/dL. This pre-transfusion level is normal for a Thalassemia Major patient on a 21-day cycle."
        ],
        "chelation": [
            f"Since regular transfusions lead to iron buildup, Arjun is prescribed iron chelation medications (Deferasirox and Folic Acid) to protect his organs and maintain health.",
            f"Arjun takes Deferasirox and Folic Acid daily for iron chelation. This therapy is critical to prevent iron overload from his recurring blood transfusions."
        ],
        "compatibility": [
            f"For Arjun's blood group ({bg}), B+, B-, O+, and O- donors are compatible. O- is the universal donor, while O+ is highly compatible and commonly available.",
            f"Arjun has B+ blood group. He can receive blood from compatible O+, O-, B+, and B- donors. Ramesh R. (O+) and Suresh K. (B+) are his active matches."
        ],
        "thalassemia": [
            "Thalassemia is a genetic blood disorder where the body produces insufficient hemoglobin. Arjun has Thalassemia Major, which requires lifelong regular blood transfusions.",
            "Thalassemia Major is a genetic condition affecting red blood cell production. Regular transfusions and iron chelation are essential treatment protocols."
        ],
        "eligibility": [
            "To donate blood, one must be between 18-65 years old, weigh at least 45 kg, and have good health. Men can donate every 90 days, and women every 120 days.",
            "A healthy individual can donate blood if they are 18-65 years of age and weigh above 45kg. The safety interval is 3 months for males and 4 months for females."
        ],
        "safety": [
            "Yes, blood donation is extremely safe. Only single-use sterile disposable needles are used. Your body replenishes the blood volume within 24-48 hours.",
            "Blood donation is 100% safe. Every donor gets a new, sterile needle. You might feel minor dizziness for a few minutes, but it passes quickly with fluids."
        ],
        "food": [
            "Thalassemia patients should eat low-iron, high-calcium foods. Donors, however, should eat iron-rich foods (pomegranate, spinach, beetroot) to replenish their iron.",
            "A donor should stay hydrated and eat a good meal before donation. Post-donation, having iron-rich foods and resting for a few minutes is highly recommended."
        ],
        "help": [
            f"I can help you with:\n1. Checking Arjun's transfusion schedule\n2. Finding active compatible donors (group {bg})\n3. Retrieving donor contact details\n4. Reviewing Hb levels and medications.",
            f"You can ask me about Arjun's health status, Dr. Meera Iyer's contact, the next transfusion date at {hosp}, or how to register a donor!"
        ],
        "greeting": [
            "Hello! Welcome to Raksha AI. I am the care assistant for Arjun Sharma. How can I help you today?",
            "Greetings! I am Raksha, here to coordinate Arjun's blood transfusions and donor matches. How may I assist you?"
        ],
        "how_are_you": [
            "I am doing great, thank you! Ready to support Arjun and coordinate his blood requirements. How can I help you today?",
            "I am functional and doing well! I'm currently monitoring Arjun's donor readiness. How are you doing?"
        ],
        "thank_you": [
            "You're very welcome! It is my pleasure to help coordinate Arjun's care. Let me know if you need anything else.",
            "Thank you! Ensuring Arjun has a smooth treatment journey is our top priority. Let me know if I can help further."
        ],
        "who_are_you": [
            "I am Raksha AI, a dedicated care coordinator for Thalassemia patients. I assist Arjun Sharma's family in finding matching donors and scheduling transfusions.",
            "I am Raksha, an AI-powered blood coordination assistant. My job is to ensure Arjun Sharma has access to compatible blood donors on time."
        ],
        "bye": [
            "Goodbye! Thank you for reaching out. Please take care, and let me know whenever you need assistance. Have a nice day!",
            "Goodbye! I'll be here whenever you need help with Arjun's blood coordination. Stay safe!"
        ],
        "medical": [
            "As a universal medical assistant and care guide, I can provide general medical information about {extracted_term}. This is a condition or topic that requires careful clinical management. Always consult a certified healthcare professional or physician for diagnostic testing and personalized treatment. Let me know if you need to coordinate blood support or view patient records.",
            "Regarding {extracted_term}, from a medical aspect, this involves specific physiological pathways and treatments. It is important to discuss these clinical details with your doctor. If this affects your blood parameters or care schedule, I can help coordinate donor matches or review health reports."
        ],
        "offtopic": [
            "I understand you are asking about {extracted_term}. As a universal medical assistant and care guide, I can coordinate health needs, blood matching, and treatment schedules. While I can assist with general medical concepts, please consult a certified doctor for specific clinical guidance on {extracted_term}.",
            "Regarding your query on {extracted_term}, my primary capability is medical assistance, blood donation tracking, and care coordination. Let me know if you need to view patient records, match blood groups ({bg}), or check donor parameters."
        ]
    }
    
    # ------------------ Hindi Responses ------------------
    responses["hindi"] = {
        "contacts": [
            "रमेश आर. का फोन नंबर +919999999999 और ईमेल ramesh.r@email.com है। सुरेश के. का फोन नंबर +918888888888 है। सुरक्षा कारणों से कृपया केयर कोऑर्डिनेटर के माध्यम से संपर्क करें।",
            "आप हमारे प्राथमिक दाता रमेश आर. से +919999999999 पर संपर्क कर सकते हैं। बैकअप दाता सुरेश के. +918888888888 पर उपलब्ध हैं।"
        ],
        "doctor": [
            f"अर्जुन की देखरेख डॉ. मीरा अय्यर (Hematologist) कर रही हैं। वे {hosp} में अर्जुन के रक्त चढ़ाने और आयरन के स्तर की निगरानी करती हैं।",
            f"डॉ. मीरा अय्यर अर्जुन की मुख्य रुधिर रोग विशेषज्ञ हैं। वे अर्जुन के ट्रांसफ्यूजन चक्र और हीमोग्लोबिन रिपोर्ट्स की समीक्षा करती हैं।"
        ],
        "hospital": [
            f"अर्जुन का इलाज {hosp} में चल रहा है। यह थैलेसीमिया रोगियों के लिए एक विशेष उपचार केंद्र है।",
            f"अर्जुन के सभी ब्लड ट्रांसफ्यूजन {hosp} में होते हैं। अस्पताल हमारे साथ मिलकर रक्त की उपलब्धता सुनिश्चित करता है।"
        ],
        "arjun": [
            "अर्जुन शर्मा थैलेसीमिया मेजर से पीड़ित एक १२ वर्षीय रोगी हैं। वह गाचीबोवली, हैदराबाद में रहते हैं और उनका रक्त समूह B+ है।",
            "अर्जुन थैलेसीमिया मेजर के खिलाफ लड़ रहे एक बहादुर बच्चे हैं। उन्हें हर २१ दिन में रक्त चढ़ाने की आवश्यकता होती है।"
        ],
        "hb": [
            f"अर्जुन का अंतिम हीमोग्लोबिन स्तर {last_hb} g/dL दर्ज किया गया था, जो स्थिर सीमा में है।",
            f"उनका हीमोग्लोबिन स्तर {last_hb} g/dL है। थैलेसीमिया मेजर रोगियों के लिए ट्रांसफ्यूजन से पहले यह स्तर सामान्य माना जाता है।"
        ],
        "chelation": [
            "बार-बार रक्त चढ़ाने से शरीर में आयरन की मात्रा बढ़ जाती है। इसे नियंत्रित करने के लिए अर्जुन को डिफेरासिरॉक्स और फोलिक एसिड दवाइयां दी जाती हैं।",
            "आयरन ओवरलोड से बचने के लिए अर्जुन को डिफेरासिरॉक्स दी जाती है। थैलेसीमिया रोगियों के लिए आयरन चिलेशन थेरेपी बेहद जरूरी है।"
        ],
        "compatibility": [
            f"अर्जुन के रक्त समूह ({bg}) के लिए B+, B-, O+, और O- दाता उपयुक्त हैं। O- सार्वभौमिक दाता (universal donor) है।",
            f"अर्जुन का ब्लड ग्रुप B+ है। वे O+, O-, B+, और B- रक्त दाताओं से रक्त ले सकते हैं। रमेश आर. और सुरेश के. हमारे सक्रिय दाता हैं।"
        ],
        "thalassemia": [
            "थैलेसीमिया एक आनुवंशिक रक्त विकार है जिसमें शरीर में हीमोग्लोबिन सामान्य से कम बनता है। अर्जुन को थैलेसीमिया मेजर है, जिसके लिए नियमित रक्त चढ़ाना पड़ता है।",
            "थैलेसीमिया मेजर एक आनुवंशिक स्थिति है जो लाल रक्त कोशिकाओं के निर्माण को प्रभावित करती है। इसके इलाज में नियमित ट्रांसफ्यूजन और आयरन चिलेशन शामिल हैं।"
        ],
        "eligibility": [
            "रक्तदान करने के लिए उम्र १८-६५ वर्ष और वजन कम से कम ४५ किलो होना चाहिए। पुरुष हर ३ महीने में और महिलाएं हर ४ महीने में रक्तदान कर सकती हैं।",
            "स्वस्थ व्यक्ति जिसकी आयु १८-६५ वर्ष और वजन ४५ किलो से अधिक हो, रक्तदान कर सकता है। पुरुषों के लिए अंतराल ९० दिन और महिलाओं के लिए १२० दिन है।"
        ],
        "safety": [
            "हाँ, रक्तदान पूरी तरह सुरक्षित है। हर बार नई रोगाणुरहित सुई का उपयोग किया जाता है। दान किया गया रक्त २४-४८ घंटों में फिर से बन जाता है।",
            "रक्तदान १००% सुरक्षित है। प्रत्येक दाता के लिए डिस्पोजेबल सुइयों का उपयोग किया जाता है। इससे शरीर में कोई कमजोरी नहीं आती।"
        ],
        "food": [
            "थैलेसीमिया रोगियों को कम आयरन और अधिक कैल्शियम वाला भोजन लेना चाहिए। दाताओं को रक्तदान के बाद आयरन से भरपूर भोजन (जैसे पालक, अनार) लेना चाहिए।",
            "रक्तदाता को दान करने से पहले पर्याप्त पानी पीना चाहिए और भोजन करना चाहिए। दान के बाद आयरन से भरपूर चीजें खाना अच्छा रहता है।"
        ],
        "help": [
            f"मैं आपकी इन विषयों में मदद कर सकती हूँ:\n1. अर्जुन के लिए उपयुक्त दाताओं की खोज करना\n2. अगले ब्लड ट्रांसफ्यूजन का समय जानना\n3. दाताओं के संपर्क नंबर प्रदान करना\n4. हीमोग्लोबिन रिपोर्ट्स की जांच करना।",
            f"आप मुझसे अर्जुन के स्वास्थ्य, डॉ. मीरा अय्यर के संपर्क, या {hosp} में होने वाले अगले ट्रांसफ्यूजन के बारे में पूछ सकते हैं।"
        ],
        "greeting": [
            "नमस्ते! रक्षा एआई रक्त समन्वय सहायक में आपका स्वागत है। मैं अर्जुन शर्मा के स्वास्थ्य समन्वय में आपकी क्या सहायता कर सकती हूँ?",
            "नमस्कार! मैं रक्षा हूँ, अर्जुन के रक्त समन्वय और दाताओं की निगरानी के लिए यहाँ हूँ। आज मैं आपकी क्या मदद करूँ?"
        ],
        "how_are_you": [
            "मैं ठीक हूँ, पूछने के लिए धन्यवाद! मैं अर्जुन के रक्त दाताओं की व्यवस्था करने के लिए पूरी तरह तैयार हूँ। आप कैसे हैं?",
            "मैं अच्छी हूँ! उम्मीद है शर्मा परिवार में सब कुशल-मंगल है। आज मैं आपकी क्या सहायता करूँ?"
        ],
        "thank_you": [
            "आपका बहुत-बहुत धन्यवाद! अर्जुन की सहायता करना मेरे लिए अत्यंत सौभाग्य की बात है। यदि कोई और प्रश्न हो, तो बेझिझक पूछें।",
            "शुक्रिया! हमारा मुख्य उद्देश्य अर्जुन के इलाज को सुगम बनाना है। किसी भी अन्य मदद के लिए मुझे बताएं।"
        ],
        "who_are_you": [
            "मैं रक्षा एआई हूँ, अर्जुन शर्मा की व्यक्तिगत रक्त समन्वय सहायक। मेरा कार्य उपयुक्त दाताओं की व्यवस्था करना और ट्रांसफ्यूजन संभालना है।",
            "मैं रक्षा हूँ, एक एआई सहायक जो थैलेसीमिया रोगियों के लिए रक्त दाताओं के समन्वय का काम करती हूँ।"
        ],
        "bye": [
            "धन्यवाद! अपना ख्याल रखें। अर्जुन के स्वास्थ्य समन्वय के लिए मैं हमेशा यहाँ हूँ। आपका दिन मंगलमय हो!",
            "अलविदा! जब भी अर्जुन के ब्लड ट्रांसफ्यूजन या दाताओं के संबंध में मदद चाहिए हो, मुझे याद करें। सुरक्षित रहें!"
        ],
        "medical": [
            "एक सार्वभौमिक चिकित्सा सहायक और स्वास्थ्य गाइड के रूप में, मैं {extracted_term} के बारे में सामान्य चिकित्सा जानकारी प्रदान कर सकती हूँ। यह एक ऐसा विषय है जिसके लिए डॉक्टर से परामर्श लेना अत्यंत आवश्यक है। उचित जांच और व्यक्तिगत उपचार के लिए कृपया प्रमाणित चिकित्सक से संपर्क करें।",
            "{extracted_term} के संबंध में, चिकित्सीय दृष्टिकोण से, इसमें विशिष्ट शारीरिक प्रक्रियाएं और उपचार शामिल हैं। इन नैदानिक विवरणों पर अपने डॉक्टर से चर्चा करना महत्वपूर्ण है। यदि आपको उपचार या रक्त समन्वय में सहायता चाहिए, तो मुझे बताएं।"
        ],
        "offtopic": [
            "मैं समझ सकती हूँ कि आप {extracted_term} के बारे में पूछ रहे हैं। एक सार्वभौमिक चिकित्सा सहायक और देखभाल गाइड के रूप में, मैं स्वास्थ्य संबंधी आवश्यकताओं और रक्त मिलान का समन्वय कर सकती हूँ। {extracted_term} पर विशिष्ट नैदानिक सलाह के लिए कृपया डॉक्टर से परामर्श लें।",
            "यद्यपि मैंने {extracted_term} के बारे में आपका प्रश्न नोट कर लिया है, एक चिकित्सा सहायक के रूप में मेरा मुख्य कार्य उपचार और रक्तदान का समन्वय करना है। यदि आपको रोगी रिकॉर्ड या रक्त समूह ({bg}) के बारे में सहायता चाहिए, तो मुझे बताएं।"
        ]
    }
    
    # ------------------ Telugu Responses ------------------
    responses["telugu"] = {
        "contacts": [
            "రమేష్ ఆర్. గారి ఫోన్ నెంబర్ +919999999999 మరియు ఈమెయిల్ ramesh.r@email.com. సురేష్ కే. ఫోన్ నెంబర్ +918888888888. భద్రత కోసం కేర్ కో-ఆర్డినేటర్ ద్వారా సంప్రదించవచ్చు.",
            "మా ప్రాథమిక దాత రమేష్ ఆర్. ను +919999999999 లో సంప్రదించవచ్చు. అలాగే బ్యాకప్ దాత సురేష్ కే. +918888888888 నెంబర్ లో అందుబాటులో ఉన్నారు."
        ],
        "doctor": [
            f"అర్జున్ గారి చికిత్సను డాక్టర్ మీరా అయ్యర్ పర్యవేక్షిస్తున్నారు. ఆమె పిడియాట్రిక్ హెమటాలజిస్ట్ మరియు {hosp} లో చికిత్సను అందిస్తున్నారు.",
            f"డాక్టర్ మీరా అయ్యర్ అర్జున్ గారి ముఖ్య హెమటాలజిస్ట్. ఆమె అర్జున్ గారి రక్తమార్పిడి చక్రం మరియు హిమోగ్లోబిన్ నివేదికలను క్రమం తప్పకుండా సమీక్షిస్తారు."
        ],
        "hospital": [
            f"అర్జున్ గారు {hosp} లో చికిత్స పొందుతున్నారు. ఇది థాలసీమియా రోగుల కోసం ప్రత్యేకంగా ఏర్పాటు చేయబడిన చికిత్సా కేంద్రం.",
            f"అర్జున్ గారి రక్తమార్పిడి చికిత్సలన్నీ {hosp} లోనే జరుగుతాయి. ఆసుపత్రి సిబ్బంది సరిపోయే రక్తాన్ని సిద్ధంగా ఉంచడంలో మాకు సహాయం చేస్తారు."
        ],
        "arjun": [
            "అర్జున్ శర్మ 12 సంవత్సరాల వయస్సు గల థాలసీమియా మేజర్ రోగి. ఆయన హైదరాబాద్ గచ్చిబౌలిలో నివసిస్తున్నారు, రక్త గ్రూప్ B+.",
            "అర్జున్ థాలసీమియా మేజర్ తో పోరాడుతున్న ఒక ధైర్యవంతుడైన బాలుడు. ప్రతి 21 రోజులకు ఆయనకు రక్తమార్పిడి అవసరమవుతుంది."
        ],
        "hb": [
            f"అర్జున్ గారి చివరి హిమోగ్లోబిన్ (Hb) స్థాయి {last_hb} g/dL గా నమోదైంది. ఇది సురక్షితమైన పరిమితిలోనే ఉంది.",
            f"ఆయన హిమోగ్లోబిన్ స్థాయి {last_hb} g/dL గా ఉంది. థాలసీమియా మేజర్ రోగులలో రక్తమార్పిడికి ముందు ఈ స్థాయి సాధారణమైనది."
        ],
        "chelation": [
            "తరచుగా రక్తమార్పిడి చేయడం వల్ల శరీరంలో ఐరన్ పరిమాణం పెరుగుతుంది. దీనిని నియంత్రించడానికి అర్జున్ గారు డిఫెరాసిరాక్స్ మరియు ఫోలిక్ యాసిడ్ మందులను వాడుతున్నారు.",
            "శరీరంలో పేరుకుపోయే అదనపు ఐరన్ ను తొలగించడానికి అర్జున్ గారికి ఐరన్ కీలేషన్ థెరపీ (డిఫెరాసిరాక్స్) ఇవ్వబడుతోంది."
        ],
        "compatibility": [
            f"అర్జున్ గారి రక్త గ్రూపు ({bg}) కి B+, B-, O+, మరియు O- రక్త దాతలు సరిపోతారు. O- గ్రూప్ సార్వత్రిక దాత.",
            f"అర్జున్ గారి బ్లడ్ గ్రూప్ B+. ఆయనకు O+, O-, B+, B- దాతల రక్తం సరిపోతుంది. రమేష్ ఆర్. మరియు సురేష్ కే. అనుకూల దాతలుగా ఉన్నారు."
        ],
        "thalassemia": [
            "థాలసీమియా అనేది ఒక వంశపారంపర్య రక్త లోపం. దీనివల్ల శరీరంలో హిమోగ్లోబిన్ తక్కువగా తయారవుతుంది. అర్జున్ గారికి థాలసీమియా మేజర్ ఉంది, దీనివల్ల రెగ్యులర్ రక్తమార్పిడి అవసరం.",
            "థాలసీమియా మేజర్ అనేది ఎర్ర రక్త కణాల ఉత్పత్తిని దెబ్బతీసే ఒక జన్యుపరమైన సమస్య. దీనికి నిరంతర రక్తమార్పిడి మరియు ఐరన్ కీలేషన్ అవసరం."
        ],
        "eligibility": [
            "రక్తదానం చేయడానికి వయస్సు 18-65 సంవత్సరాలు, బరువు కనీసం 45 కిలోలు ఉండాలి. పురుషులు ప్రతి 3 నెలలకు ఒకసారి, మహిళలు ప్రతి 4 నెలలకు ఒకసారి రక్తదానం చేయవచ్చు.",
            "18-65 ఏళ్ల వయస్సు మరియు కనీసం 45 కిలోల బరువున్న ఆరోగ్యకరమైన ఎవరైనా రక్తదానం చేయవచ్చు. పురుషులకు 90 రోజులు, మహిళలకు 120 రోజులు కనీస విరామం ఉండాలి."
        ],
        "safety": [
            "అవును, రక్తదానం చాలా సురక్షితమైనది. ప్రతి దాతకు కొత్త మరియు శుభ్రమైన సింగిల్-యూజ్ సూదిని మాత్రమే ఉపయోగిస్తారు. దానం చేసిన రక్తం 24-48 గంటల్లో మళ్లీ తయారవుతుంది.",
            "రక్తదానం 100% సురక్షితం. దానం చేసిన కొద్ది సమయంలోనే మీ శరీరం కొత్త రక్తాన్ని తయారు చేసుకుంటుంది. దీనివల్ల ఎలాంటి హాని జరగదు."
        ],
        "food": [
            "థాలసీమియా రోగులు తక్కువ ఐరన్ ఉన్న ఆహారాన్ని తీసుకోవాలి. కానీ దాతలు రక్తదానం చేసిన తర్వాత ఐరన్ అధికంగా ఉన్న ఆహారాన్ని (పాలకూర, దానిమ్మ, బీట్‌రూట్) తీసుకోవాలి.",
            "రక్తదానానికి ముందు దాతలు బాగా నీరు తాగాలి మరియు ఆహారం తీసుకోవాలి. దానం చేసిన తర్వాత ఐరన్ లభించే పండ్లు తినడం మంచిది."
        ],
        "help": [
            f"నేను మీకు ఈ విషయాలలో సహాయపడగలను:\n1. అర్జున్ గారి రక్తమార్పిడి సమయపట్టిక తెలుసుకోవడం\n2. సరిపోయే దాతలను ({bg}) కనుగొనడం\n3. దాతల సంప్రదింపు వివరాలు పొందడం\n4. హిమోగ్లోబిన్ రిపోర్టులను పరిశీలించడం.",
            f"మీరు నన్ను అర్జున్ ఆరోగ్యం, డాక్టర్ మీరా అయ్యర్ కాంటాక్ట్, లేదా {hosp} లో తదుపరి రక్తమార్పిడి తేదీల గురించి అడగవచ్చు."
        ],
        "greeting": [
            "నమస్తే! రక్షా ఐఐ రక్త సమన్వయ సహాయకారికి స్వాగతం. నేను అర్జున్ శర్మ గారి రక్త సమన్వయ అవసరాలలో మీకు ఎలా సహాయపడగలను?",
            "నమస్కారం! నేను రక్షా, అర్జున్ శర్మ గారి చికిత్స మరియు దాతల వివరాలను సమన్వయం చేయడానికి ఇక్కడ ఉన్నాను. చెప్పండి, మీకు ఎలా సహాయపడగలను?"
        ],
        "how_are_you": [
            "నేను చాలా బాగున్నాను, ధన్యవాదాలు! అర్జున్ గారి రక్త సమన్వయ అవసరాలను పర్యవేక్షించడంలో సహాయం చేయడానికి నేను సిద్ధంగా ఉన్నాను. మీ ఆరోగ్య పరిస్థితి ఎలా ఉంది?",
            "నేను బాగున్నాను! అర్జున్ గారి దాతల సంసిద్ధతను పర్యవేక్షిస్తున్నాను. మీరు ఎలా ఉన్నారు?"
        ],
        "thank_you": [
            "మీకు చాలా ధన్యవాదాలు! సహాయం చేయడం నా బాధ్యత. అర్జున్ గారి చికిత్స సజావుగా సాగడమే మా లక్ష్యం. మీకు మరేదైనా సమాచారం కావాలా?",
            "ధన్యవాదాలు! అర్జున్ గారికి సమయానికి రక్తం అందేలా చూడటమే మా మొదటి ప్రాధాన్యత. ఇంకేదైనా సహాయం కావాలా?"
        ],
        "who_are_you": [
            "నేను రక్షా ఐఐ, అర్జున్ శర్మ గారి రక్త సమన్వయకర్తను. దాతలను కనుగొనడం మరియు సమయపట్టికలను పర్యవేక్షించడంలో నేను సహాయపడతాను.",
            "నేను రక్షా, థాలసీమియా రోగులకు రక్త దాతలను సమన్వయం చేసే ఒక కృత్రిమ మేధస్సు (AI) సహాయకారిని."
        ],
        "bye": [
            "ధన్యవాదాలు! అర్జున్ శర్మ గారి చికిత్సకు ఎల్లప్పుడూ నా సహాయం ఉంటుంది. మీ రోజు బాగుండాలని ఆశిస్తున్నాను. సెలవు!",
            "వెళ్ళి వస్తాను! అర్జున్ రక్త అవసరాల గురించి ఏ సమాచారం కావాలన్నా నేను ఇక్కడే ఉంటాను. జాగ్రత్తగా ఉండండి!"
        ],
        "medical": [
            "యూనివర్సల్ మెడికల్ అసిస్టెంట్‌గా, నేను {extracted_term} గురించి సాధారణ వైద్య సమాచారాన్ని అందించగలను. ఈ అంశం లేదా పరిస్థితికి సరైన వైద్య పర్యవేక్షణ అవసరం. రోగ నిర్ధారణ మరియు వ్యక్తిగత చికిత్స కోసం దయచేసి ఎల్లప్పుడూ వైద్యుడిని సంప్రదించండి.",
            "{extracted_term} కి సంబంధించి, వైద్య పరంగా చూస్తే, దీనికి నిర్దిష్ట చికిత్సలు మరియు పద్ధతులు ఉంటాయి. ఈ క్లినికల్ వివరాలను మీ డాక్టర్‌తో చర్చించడం చాలా ముఖ్యం. మీకు రక్త సమన్వయం లేదా రోగి రికార్డులపై సహాయం కావాలంటే నాకు చెప్పండి."
        ],
        "offtopic": [
            "మీరు {extracted_term} గురించి అడుగుతున్నారని నేను గ్రహించాను. యూనివర్సల్ మెడికల్ అసిస్టెంట్‌గా, నేను ఆరోగ్య అవసరాలు మరియు రక్త దాతల సమన్వయాన్ని చేయగలను. {extracted_term} గురించి నిర్దిష్ట వైద్య సలహా కోసం దయచేసి డాక్టర్‌ను సంప్రదించండి.",
            "వైద్య సహాయకురాలిగా {extracted_term} గురించిన మీ ప్రశ్నను గమనించాను. రక్తం దానం, రోగి రికార్డులు లేదా సరిపోయే బ్లడ్ గ్రూపు ({bg}) వంటి వాటిపై మీకు ఏవైనా ప్రశ్నలు ఉంటే దయచేసి అడగండి."
        ]
    }
    
    # ------------------ Tamil Responses ------------------
    responses["tamil"] = {
        "contacts": [
            "ரமேஷ் ஆர்.-ன் தொடர்பு எண் +919999999999 (மின்னஞ்சல்: ramesh.r@email.com). சுரேஷ் கே.-ன் தொடர்பு எண் +918888888888. பாதுகாப்புக்காக எங்களை கேர் ஒருங்கிணைப்பாளர் மூலம் தொடர்பு கொள்ளவும்.",
            "முதன்மை தானம் வழங்குபவர் ரமேஷ் ஆர். அவர்களின் எண் +919999999999. மாற்று தானம் வழங்குபவர் சுரேஷ் கே. அவர்களின் எண் +918888888888."
        ],
        "doctor": [
            f"அர்ஜுனை டாக்டர் மீரா ஐயர் கண்காணித்து வருகிறார். அவர் ஒரு குழந்தை மருத்துவ இரத்த நிபுணர் ஆவார், {hosp} மருத்துவமனையில் சிகிச்சை அளிக்கிறார்.",
            f"டாக்டர் மீரா ஐயர் அர்ஜுனின் முதன்மை இரத்த நோய் நிபுணர் ஆவார். அவர் அர்ஜுனின் சிகிச்சைகளை மற்றும் ஹீமோகுளோபின் அறிக்கைகளை தொடர்ந்து சரிபார்க்கிறார்."
        ],
        "hospital": [
            f"அர்ஜுன் {hosp} மருத்துவமனையில் சிகிச்சை பெற்று வருகிறார். இது தலாசீமியா நோயாளிகளுக்கான சிறப்பு சிகிச்சை மையமாகும்.",
            f"அர்ஜுனின் அனைத்து இரத்தமாற்றங்களும் {hosp} இல் திட்டமிடப்பட்டுள்ளன. மருத்துவமனை அர்ஜுனுக்கு தேவையான இரத்தத்தை தயார் செய்ய எங்களுக்கு உதவுகிறது."
        ],
        "arjun": [
            "அர்ஜுன் சர்மா தலாசீமியா மேஜர் நோயால் பாதிக்கப்பட்ட 12 வயது நோயாளி ஆவார். அவர் ஹைதராபாத் காச்சிபௌலியில் வசித்து வருகிறார், இரத்தப் பிரிவு B+.",
            "அர்ஜுன் தலாசீமியா நோயை எதிர்த்துப் போராடும் ஒரு தைரியமான சிறுவன். அவனுக்கு 21 நாட்களுக்கு ஒருமுறை இரத்தம் மாற்றப்பட வேண்டும்."
        ],
        "hb": [
            f"அர்ஜுனின் கடைசியாக பதிவு செய்யப்பட்ட ஹீமோகுளோபின் (Hb) அளவு {last_hb} g/dL ஆகும், இது பாதுகாப்பான வரம்பில் உள்ளது.",
            f"அவனது ஹீமோகுளோபின் அளவு {last_hb} g/dL ஆகும். தலாசீமியா மேஜர் நோயாளிகளுக்கு இரத்தமாற்றத்திற்கு முன்பு இந்த அளவு சாதாரணமானது."
        ],
        "chelation": [
            "வழக்கமான இரத்தமாற்றங்கள் உடலில் இரும்புச்சத்தை அதிகரிக்கச் செய்கின்றன. இதனை அகற்ற அர்ஜுனுக்கு டெஃபெராசிராக்ஸ் மற்றும் ஃபோலிக் அமிலம் பரிந்துரைக்கப்பட்டுள்ளன.",
            "இரும்புச்சத்து அதிகரிப்பை தடுக்க அர்ஜுன் தினமும் டெஃபெராசிராக்ஸ் மாத்திரைகளை எடுத்துக்கொள்கிறான். தலாசீமியா சிகிச்சையில் இது மிக முக்கியமானது."
        ],
        "compatibility": [
            f"அர்ஜுனின் இரத்தப் பிரிவு ({bg}) என்பதால், அவர் B+, B-, O+, O- ஆகிய பிரிவினரிடமிருந்து இரத்தம் பெறலாம். O- பிரிவு அனைவருக்கும் பொருந்தக்கூடியது.",
            f"அர்ஜுனுக்கு B+ இரத்தப் பிரிவு உள்ளது. அவனுக்கு O+, O-, B+, B- தானமளிப்பவர்களின் இரத்தம் பொருந்தும். ரமேஷ் மற்றும் சுரேஷ் பொருத்தமான தானமளிப்பவர்கள்."
        ],
        "thalassemia": [
            "தலாசீமியா என்பது ஒரு மரபணு இரத்தக் கோளாறு ஆகும், இதில் உடல் தேவையான ஹீமோகுளோபினை உருவாக்குவதில்லை. அர்ஜுனுக்கு தலாசீமியா மேஜர் உள்ளது.",
            "தலாசீமியா மேஜர் என்பது இரத்த சிவப்பு அணுக்கள் தயாரிப்பை பாதிக்கும் ஒரு மரபணு குறைபாடு. இதற்கு வழக்கமான இரத்தமாற்றம் தேவை."
        ],
        "eligibility": [
            "இரத்த தானம் செய்ய 18-65 வயது இருக்க வேண்டும், எடை குறைந்தபட்சம் 45 கிலோ இருக்க வேண்டும். ஆண்கள் 3 மாதங்களுக்கு ஒருமுறையும், பெண்கள் 4 மாதங்களுக்கு ஒருமுறையும் தானம் செய்யலாம்.",
            "ஆரோக்கியமான 18-65 வயதுடைய, 45 கிலோவுக்கு மேல் எடையுள்ள எவரும் இரத்தம் வழங்கலாம். ஆண்கள் 90 நாட்களுக்கு ஒருமுறையும் பெண்கள் 120 நாட்களுக்கு ஒருமுறையும் தானம் செய்யலாம்."
        ],
        "safety": [
            "ஆம், இரத்த தானம் முற்றிலும் பாதுகாப்பானது. ஒவ்வொரு முறையும் புதிய ஊசி மட்டுமே பயன்படுத்தப்படும். தானம் செய்த இரத்தம் 24-48 மணி நேரத்தில் மீண்டும் உற்பத்தியாகிவிடும்.",
            "இரத்த தானம் 100% பாதுகாப்பானது. ஒருமுறை பயன்படுத்தப்படும் ஊசிகள் மட்டுமே உபயோகிக்கப்படும் என்பதால் தொற்றுக்களுக்கு வாய்ப்பில்லை."
        ],
        "food": [
            "தலாசீமியா நோயாளிகள் இரும்புச்சத்து குறைந்த உணவுகளை உட்கொள்ள வேண்டும். ஆனால் இரத்த தானம் செய்பவர்கள் இரும்புச்சத்து நிறைந்த உணவுகளை (கீரை, மாதுளை, பீட்ரூட்) உண்ண வேண்டும்.",
            "இரத்த தானத்திற்கு முன் தானமளிப்பவர்கள் நிறைய தண்ணீர் குடிக்க வேண்டும். தானத்திற்கு பின் சத்தான இரும்புச்சத்து உணவுகளை எடுத்துக்கொள்வது நல்லது."
        ],
        "help": [
            f"நான் உங்களுக்கு பின்வரும் வழிகளில் உதவ முடியும்:\n1. அர்ஜுனின் இரத்தமாற்ற அட்டவணையை சரிபார்த்தல்\n2. பொருத்தமான இரத்த தானம் வழங்குபவர்களைத் தேடுதல் ({bg} பிரிவு)\n3. தானம் வழங்குபவர்களின் தொடர்பு விவரங்களைப் பெறுதல்\n4. ஹீமோகுளோபின் அளவை சரிபார்த்தல்.",
            f"அர்ஜுனின் உடல்நிலை, டாக்டர் மீரா ஐயரின் தொடர்பு எண், அல்லது {hosp} இல் அடுத்த இரத்தமாற்ற தேதி பற்றி நீங்கள் என்னிடம் கேட்கலாம்."
        ],
        "greeting": [
            "வணக்கம்! ரக்ஷா ஏஐ இரத்த ஒருங்கிணைப்பு உதவிக்கு வரவேற்கிறோம். அர்ஜுன் சர்மாவின் இரத்த தேவைகள் குறித்து உங்களுக்கு நான் எவ்வாறு உதவ முடியும்?",
            "வணக்கம்! அர்ஜுனின் இரத்த ஒருங்கிணைப்பு பணிகளை மேற்கொள்ளும் ரக்ஷா ஏஐ நான். உங்களுக்கு எவ்வாறு உதவ வேண்டும்?"
        ],
        "how_are_you": [
            "நான் நன்றாக இருக்கிறேன், நன்றி! அர்ஜுன் சர்மாவின் இரத்த ஒருங்கிணைப்பு தேவைகளுக்கு உதவ நான் எப்போதும் தயாராக உள்ளேன். நீங்கள் எப்படி இருக்கிறீர்கள்?",
            "நான் நலம்! அர்ஜுனின் தானமளிப்பவர்களை ஒருங்கிணைக்கும் பணியில் இருக்கிறேன். நீங்கள் எப்படி இருக்கிறீர்கள்?"
        ],
        "thank_you": [
            "மிக்க நன்றி! அர்ஜுன் சர்மாவின் குடும்பத்திற்கு உதவுவது எனது கடமை. உங்களுக்கு வேறு ஏதேனும் உதவி தேவைப்பட்டால் தயங்காமல் கேளுங்கள்.",
            "நன்றி! அர்ஜுனுக்கு சரியான நேரத்தில் இரத்தம் கிடைப்பதை உறுதி செய்வதே எங்களது முக்கிய நோக்கம்."
        ],
        "who_are_you": [
            "நான் ரக்ஷா ஏஐ, அர்ஜுன் சர்மாவின் இரத்த ஒருங்கிணைப்பாளர். பொருத்தமான இரத்த தானம் வழங்குபவர்களைக் கண்டறிவதே எனது பணி.",
            "நான் ரக்ஷா, தலாசீமியா நோயாளிகளுக்கு தானமளிப்பவர்களை ஒருங்கிணைக்கும் ஒரு செயற்கை நுண்ணறிவு (AI) உதவியாளர்."
        ],
        "bye": [
            "நன்றி! எப்போதும் அர்ஜுனின் சிகிச்சை தேவைகளுக்கு உதவ நான் இங்கே தயாராக இருப்பேன். நல்ல நாளாக அமையட்டும்! விடைபெறுகிறேன்.",
            "விடைபெறுகிறேன்! அர்ஜுனின் இரத்த தேவைகள் குறித்து எப்போது வேண்டுமானாலும் என்னை தொடர்பு கொள்ளவும். கவனமாக இருங்கள்!"
        ],
        "medical": [
            "ஒரு உலகளாவிய மருத்துவ உதவியாளராக, நான் {extracted_term} பற்றிய பொதுவான மருத்துவ தகவல்களை வழங்க முடியும். இது முறையான மருத்துவ கண்காணிப்பு தேவைப்படும் ஒரு தலைப்பு ஆகும். துல்லியமான பரிசோதனை மற்றும் சிகிச்சைக்கு எப்போதும் மருத்துவரை அணுகவும்.",
            "{extracted_term} குறித்து மருத்துவ ரீதியாக பார்க்கும்போது, இதற்கு குறிப்பிட்ட சிகிச்சை முறைகள் உள்ளன. இந்த விவரங்களை உங்கள் மருத்துவருடன் கலந்தாலோசிப்பது முக்கியம். சிகிச்சை ஒருங்கிணைப்பு அல்லது இரத்த தானம் பற்றி ஏதேனும் உதவிகள் தேவையா?"
        ],
        "offtopic": [
            "நீங்கள் {extracted_term} குறித்து கேட்கிறீர்கள் என புரிகிறது. ஒரு உலகளாவிய மருத்துவ உதவியாளராக, நான் சிகிச்சை தேவைகள் மற்றும் இரத்த தானத்தை ஒருங்கிணைக்க முடியும். {extracted_term} குறித்த விரிவான மருத்துவ ஆலோசனைக்கு மருத்துவரை அணுகவும்.",
            "உங்களது {extracted_term} குறித்த கேள்வியைப் பதிந்து கொண்டேன். ஒரு மருத்துவ உதவியாளராக, எனது பணி சிகிச்சை மற்றும் இரத்த தானத்தை ஒருங்கிணைப்பதாகும். நோயாளி விவரங்கள் அல்லது இரத்தப் பிரிவு ({bg}) குறித்து உதவ வேண்டுமா?"
        ]
    }
    
    # ------------------ Bengali Responses ------------------
    responses["bengali"] = {
        "contacts": [
            "রমেশ আর.-এর ফোন নম্বর +919999999999 (ইমেল: ramesh.r@email.com)। সুরেশ কে.-এর ফোন নম্বর +918888888888। সুরক্ষার জন্য অনুগ্রহ করে কেয়ার কো-অর্ডিনেটরের মাধ্যমে যোগাযোগ করুন।",
            "আমাদের প্রাথমিক রক্তদাতা রমেশ আর.-এর নম্বর হলো +919999999999। ব্যাকআপ রক্তদাতা সুরেশ কে.-এর সাথে +918888888888 নম্বরে যোগাযোগ করা যাবে।"
        ],
        "doctor": [
            f"অর্জুনের ডাক্তার হলেন ডাঃ মীরা আইয়ার। তিনি একজন পেডিয়াট্রিক হেমাটোলজিস্ট এবং {hosp} এ অর্জুনের চিকিৎসা পরিচালনা করছেন।",
            f"ডাঃ মীরা আইয়ার হলেন অর্জুনের প্রধান হেমাটোলজিস্ট। তিনি অর্জুনের রক্ত সঞ্চালনের চক্র এবং হিমোগ্লোবিন রিপোর্ট নিয়মিত পর্যবেক্ষণ করেন।"
        ],
        "hospital": [
            f"অর্জুন {hosp} এ চিকিৎসাধীন রয়েছেন। এটি থ্যালাসেমিয়া রোগীদের জন্য একটি বিশেষায়িত চিকিৎসা কেন্দ্র।",
            f"অর্জুনের সমস্ত রক্ত সঞ্চালন {hosp} এ হয়ে থাকে। সঠিক গ্রুপের রক্ত প্রস্তুত রাখতে হাসপাতাল আমাদের সহায়তা করে।"
        ],
        "arjun": [
            "অর্জুন শর্মা ১২ বছর বয়সী একজন থ্যালাসেমিয়া মেজর রোগী। তিনি হায়দ্রাবাদের গাচিবোলিতে থাকেন এবং তাঁর রক্তের গ্রুপ B+।",
            "অর্জুন থ্যালাসেমিয়া মেজরের বিরুদ্ধে লড়াই করা এক সাহসী ছেলে। প্রতি ২১ দিন অন্তর তাঁর রক্ত সঞ্চালনের প্রয়োজন হয়।"
        ],
        "hb": [
            f"অর্জুনের শেষ রেকর্ড করা হিমোগ্লোবিন (Hb) ছিল {last_hb} g/dL, যা নিরাপদ সীমার মধ্যে রয়েছে।",
            f"অর্জুনের হিমোগ্লোবিন স্তর বর্তমানে {last_hb} g/dL। থ্যালাসেমিয়া মেজর রোগীদের ক্ষেত্রে রক্ত সঞ্চালনের পূর্বে এটি স্বাভাবিক।"
        ],
        "chelation": [
            "নিয়মিত রক্ত সঞ্চালনের ফলে শরীরে আয়রন জমে যায়। এটি দূর করতে অর্জুনকে ডেফ্যারাসিরক্স এবং ফলিক অ্যাসিড ওষুধ দেওয়া হয়।",
            "আয়রন ওভারলোড প্রতিরোধ করতে অর্জুনকে ডেফ্যারাসিরক্স ট্যাবলেট দেওয়া হয়। থ্যালাসেমিয়া রোগীদের জন্য আয়রন চিলেশন থেরাপি অত্যন্ত জরুরি।"
        ],
        "compatibility": [
            f"অর্জুনের রক্তের গ্রুপ ({bg}) এর জন্য B+, B-, O+, এবং O- রক্তদাতা উপযুক্ত। O- গ্রুপ হলো সর্বজনীন রক্তদাতা।",
            f"অর্জুনের রক্তের গ্রুপ B+। তিনি O+, O-, B+ এবং B- রক্তদাতার থেকে রক্ত নিতে পারেন। রমেশ আর. ও সুরেশ কে. আমাদের তালিকাভুক্ত দাতা।"
        ],
        "thalassemia": [
            "থ্যালাসেমিয়া একটি বংশগত রক্তের ব্যাধি যেখানে শরীর পর্যাপ্ত হিমোগ্লোবিন তৈরি করতে পারে না। অর্জুনের থ্যালাসেমিয়া মেজর রয়েছে যার জন্য আজীবন রক্ত সঞ্চালন প্রয়োজন।",
            "থ্যালাসেমিয়া মেজর একটি জিনগত সমস্যা যা লোহিত রক্তকণিকা তৈরিতে বাধা দেয়। এর প্রধান চিকিৎসা নিয়মিত রক্ত সঞ্চালন ও আয়রন নিয়ন্ত্রণ।"
        ],
        "eligibility": [
            "রক্তদানের জন্য বয়স ১৮-৬৫ বছর এবং ওজন অন্তত ৪৫ কেজি হতে হবে। পুরুষরা প্রতি ৩ মাস অন্তর এবং নারীরা প্রতি ৪ মাস অন্তর রক্তদান করতে পারেন।",
            "১৮ থেকে ৬৫ বছর বয়সী যেকোনো সুস্থ ব্যক্তি যার ওজন ৪৫ কেজির বেশি, তিনি রক্তদান করতে পারেন। পুরুষদের জন্য ব্যবধান ৯০ দিন এবং নারীদের জন্য ১২০ দিন।"
        ],
        "safety": [
            "হ্যাঁ, রক্তদান সম্পূর্ণ নিরাপদ। প্রতিটি দাতার জন্য নতুন ও জীবাণুমুক্ত সূঁচ ব্যবহার করা হয়। দান করা রক্ত ২৪-৪৮ ঘণ্টার মধ্যে শরীরে আবার তৈরি হয়ে যায়।",
            "রক্তদান ১০০% নিরাপদ। প্রতিটি দাতার জন্য একবার ব্যবহারযোগ্য সূঁচ ব্যবহার করা হয়, তাই সংক্রমণের কোনো ভয় থাকে না।"
        ],
        "food": [
            "থ্যালাসেমিয়া রোগীদের কম আয়রনযুক্ত কিন্তু ক্যালসিয়াম সমৃদ্ধ খাবার খাওয়া উচিত। তবে রক্তদাতাদের দান করার পর আয়রন সমৃদ্ধ খাবার (যেমন শাক, বেদানা) খাওয়া উচিত।",
            "রক্তদানের পূর্বে দাতার প্রচুর জল পান করা এবং পর্যাপ্ত খাওয়া উচিত। রক্তদানের পর আয়রন সমৃদ্ধ খাবার খাওয়া শরীরে রক্ত বাড়াতে সাহায্য করে।"
        ],
        "help": [
            f"আমি আপনাকে নিম্নলিখিত বিষয়ে সাহায্য করতে পারি:\n1. অর্জুনের রক্তের গ্রুপ মিলিয়ে রক্তদাতা খোঁজা ({bg})\n2. পরবর্তী রক্ত সঞ্চালনের সময় ও হাসপাতালের বিবরণ দেওয়া\n3. রক্তদাতার যোগাযোগের নম্বর দেওয়া\n4. হিমোগ্লোবিন রিপোর্টের বিবরণ জানানো।",
            f"আপনি অর্জুনের স্বাস্থ্য, ডাঃ মীরা আইয়ারের নম্বর, অথবা {hosp} এ পরবর্তী রক্ত সঞ্চালনের তারিখ সম্পর্কে আমাকে জিজ্ঞাসা করতে পারেন।"
        ],
        "greeting": [
            "নমস্কার! রক্ষা এআই রক্ত সমন্বয়কারী সহায়ক হিসেবে আপনাকে স্বাগত জানায়। আমি অর্জুনের চিকিৎসায় কীভাবে সাহায্য করতে পারি?",
            "নমস্কার! আমি রক্ষা, অর্জুনের রক্ত সমন্বয় ও রক্তদাতার খোঁজ করার জন্য এখানে আছি। আজ আপনাকে কীভাবে সাহায্য করতে পারি?"
        ],
        "how_are_you": [
            "আমি ভালো আছি, ধন্যবাদ! অর্জুনের রক্ত সমন্বয়ের কাজে সাহায্য করতে আমি সর্বদা প্রস্তুত। আপনারা সবাই কেমন আছেন?",
            "আমি ভালো আছি! অর্জুনের রক্তদাতার খোঁজখবর রাখছি। আপনারা কেমন আছেন?"
        ],
        "thank_you": [
            "আপনাকে অনেক ধন্যবাদ! অর্জুনের পরিবারকে সাহায্য করতে পেরে আমি আনন্দিত। আপনার আর কোনো তথ্যের প্রয়োজন হলে অবশ্যই জানাবেন।",
            "ধন্যবাদ! অর্জুনের চিকিৎসা যাতে নির্বিঘ্নে সম্পন্ন হয় তা নিশ্চিত করাই আমাদের প্রধান উদ্দেশ্য।"
        ],
        "who_are_you": [
            "আমি রক্ষা এআই, অর্জুন শর্মার রক্ত সমন্বয়কারী। রক্তদাতার খোঁজ করা এবং রক্ত সঞ্চালনের সময়সূচী দেখা আমার কাজ।",
            "আমি রক্ষা, একটি এআই সহকারী যা থ্যালাসেমিয়া রোগীদের জন্য রক্তদাতাদের সমন্বয় করে থাকে।"
        ],
        "bye": [
            "ধন্যবাদ! ভালো থাকবেন। অর্জুনের রক্ত সমন্বয়ের প্রয়োজনে আমি সবসময় এখানেই আছি। আপনার দিনটি শুভ হোক! বিদায়।",
            "বিদায়! অর্জুনের রক্তের প্রয়োজন সংক্রান্ত যেকোনো তথ্যের জন্য আমি এখানেই থাকবো। সাবধানে থাকবেন।"
        ],
        "medical": [
            "একজন ইউনিভার্সাল মেডিকেল অ্যাসিস্ট্যান্ট হিসেবে আমি {extracted_term} সম্পর্কে সাধারণ চিকিৎসা তথ্য প্রদান করতে পারি। এই রোগ বা বিষয়টি সঠিক চিকিৎসকের তত্ত্বাবধানে পরিচালনা করা প্রয়োজন। সঠিক নির্ণয় এবং চিকিৎসার জন্য সর্বদা একজন ডাক্তারের পরামর্শ নিন।",
            "{extracted_term}-এর চিকিৎসার ক্ষেত্রে নির্দিষ্ট শারীরিক প্রক্রিয়া ও ওষুধ জড়িত থাকে। এই বিষয়ে আপনার ডাক্তারের সাথে বিস্তারিত আলোচনা করা অত্যন্ত গুরুত্বপূর্ণ। আপনার যদি রক্তদাতাদের সমন্বয় বা রোগীর রিপোর্ট সংক্রান্ত কোনো সাহায্য লাগে, আমাকে জানান।"
        ],
        "offtopic": [
            "আমি বুঝতে পারছি যে আপনি {extracted_term} সম্পর্কে জিজ্ঞাসা করছেন। একজন ইউনিভার্সাল মেডিকেল অ্যাসিস্ট্যান্ট এবং কেয়ার গাইড হিসেবে আমি চিকিৎসা সংক্রান্ত সমন্বয় এবং রক্তদাতা ম্যানেজ করতে পারি। {extracted_term} সম্পর্কে সুনির্দিষ্ট পরামর্শের জন্য ডাক্তারের সাথে যোগাযোগ করুন।",
            "আমি {extracted_term} সম্পর্কে আপনার প্রশ্নটি দেখেছি। একজন মেডিকেল অ্যাসিস্ট্যান্ট হিসেবে আমার কাজ চিকিৎসা ও রক্তদাতার সমন্বয় করা। রোগীর রেকর্ড বা রক্তের গ্রুপ ({bg}) সম্পর্কে কোনো প্রশ্ন থাকলে জানান।"
        ]
    }

    # Determine matched key
    match_key = None
    if is_general_medical:
        match_key = "medical"
    elif is_contacts:
        match_key = "contacts"
    elif is_doctor:
        match_key = "doctor"
    elif is_hospital:
        match_key = "hospital"
    elif is_hb:
        match_key = "hb"
    elif is_chelation:
        match_key = "chelation"
    elif is_compatibility:
        match_key = "compatibility"
    elif is_thalassemia:
        match_key = "thalassemia"
    elif is_eligibility:
        match_key = "eligibility"
    elif is_safety:
        match_key = "safety"
    elif is_food:
        match_key = "food"
    elif is_arjun:
        match_key = "arjun"
    elif is_help:
        match_key = "help"
    elif is_how_are_you:
        match_key = "how_are_you"
    elif is_who_are_you:
        match_key = "who_are_you"
    elif is_greeting:
        match_key = "greeting"
    elif is_thank_you:
        match_key = "thank_you"
    elif is_bye:
        match_key = "bye"

    # Extract key term for off-topic query formatting
    term = extract_key_terms(message, lang)

    if match_key:
        # Choose a template randomly to avoid repetitive answers
        templates = responses[lang][match_key]
    else:
        # Generate off-topic response by extracting keywords from the query
        templates = responses[lang]["offtopic"]
        
    reply_template = random.choice(templates)
    reply = reply_template.format(
        extracted_term=term,
        bg=bg,
        hosp=hosp,
        last_hb=last_hb,
        hematologist=hematologist,
        donors_str=donors_str
    )
        
    return {
        "response": reply,
        "source": "Raksha Simulation Engine (Offline Fallback)",
        "patient_id": patient.get("requestId"),
        "debug_info": {
            "detected_lang": lang.capitalize(),
            "matched_key": match_key if match_key else "offtopic",
            "matched_donors": compatible_donors
        }
    }
