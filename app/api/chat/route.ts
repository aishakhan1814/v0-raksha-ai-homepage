import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { GoogleGenerativeAI } from "@google/generative-ai";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_rakshaai_jwt_key";

function getLocalFallbackResponse(query: string): string {
  const q = query.toLowerCase().trim();

  // 1. GREETINGS & CASUAL
  if (q === "hi" || q === "hello" || q === "hey" || q === "greetings") {
    return "Hello! How can I help you today? Ask me any questions regarding blood compatibility, donor eligibility, Thalassemia major, or platform operations.";
  } else if (q.includes("how are you")) {
    return "I'm doing great, thank you for asking! I'm here and ready to help coordinate care and blood matches for Thalassemia patients. How can assist you?";
  } else if (q.includes("who are you") || q.includes("what is your name")) {
    return "I am the RakshaAI Care Assistant. My goal is to support voluntary blood donors, patients, and care coordinators, ensuring that compatible blood is available whenever it is needed.";
  }

  // 2. MEDICAL - THALASSEMIA GENERAL
  else if (q.includes("what is thalassemia")) {
    return "Thalassemia is an inherited genetic blood disorder characterized by the body producing less functional hemoglobin or fewer red blood cells than normal. This leads to chronic anemia, fatigue, and other developmental issues. It is classified into Alpha and Beta Thalassemia, with Beta Thalassemia Major requiring lifelong blood transfusions.";
  } else if (q.includes("symptoms") && (q.includes("thalassemia") || q.includes("anemia"))) {
    return "Symptoms of Thalassemia Major (Transfusion-Dependent Thalassemia) usually appear in the first two years of life and include severe fatigue, paleness, slow growth, abdominal swelling (due to enlarged spleen or liver), and skeletal deformities in facial bones.";
  }

  // 3. MEDICAL - TRANSFUSIONS & SCHEDULES
  else if (q.includes("transfusion dependent") || q.includes("tdt")) {
    return "Transfusion-Dependent Thalassemia (TDT) refers to patients who require regular red blood cell transfusions (typically every 2 to 5 weeks) to survive. This chronic therapy suppresses ineffective native erythropoiesis and maintains tissue oxygenation, but leads to secondary complications like iron overload.";
  } else if (q.includes("transfusion frequency") || (q.includes("how often") && q.includes("transfusion"))) {
    return "Most Thalassemia Major patients receive transfusions every 14 to 28 days (2 to 4 weeks). The frequency depends on their pre-transfusion hemoglobin levels, growth rate, and clinical signs of anemia. The target is usually to keep pre-transfusion Hb above 9.0–9.5 g/dL.";
  }

  // 4. MEDICAL - IRON OVERLOAD & CHELATION
  else if (q.includes("iron overload") || q.includes("ferritin")) {
    return "Because red blood cells contain iron, chronic transfusions cause iron to build up in vital organs like the heart, liver, and pancreas. Since the human body has no way to excrete iron naturally, this causes iron overload, measured by serum ferritin. Normal targets are keeping ferritin under 1,000 ng/mL.";
  } else if (q.includes("chelation") || q.includes("chelator") || q.includes("deferasirox")) {
    return "Chelation therapy uses medications like Deferasirox, Deferiprone, or Desferrioxamine to bind to excess iron and excrete it from the body. It is a mandatory life-saving daily treatment for transfusion-dependent patients to protect their organs from iron toxicity.";
  }

  // 5. MEDICAL - BONE MARROW TRANSPLANT / CURE
  else if (q.includes("bone marrow transplant") || q.includes("bmt") || q.includes("cure")) {
    return "A Bone Marrow Transplant (BMT) is currently the only permanent cure for Thalassemia Major. It involves destroying the patient's defective stem cells with chemotherapy and replacing them with healthy stem cells from a matched sibling or registry donor. Success rates are over 90% if performed early in life with a fully HLA-matched sibling.";
  }

  // 6. DONOR ELIGIBILITY
  else if (q.includes("criteria") || q.includes("can i donate") || q.includes("eligibility") || q.includes("weight")) {
    return "In India, to donate blood you must be between 18 and 65 years old, weigh at least 45 kg, have a hemoglobin level of 12.5 g/dL or higher, and have no active infections, chronic diseases, or recent surgeries. You must also satisfy the safe donation interval.";
  } else if (q.includes("how often can i donate") || q.includes("donation interval") || q.includes("90 days")) {
    return "Male donors can safely donate whole blood every 90 days (3 months), and female donors can donate every 120 days (4 months). This interval allows the body's iron stores and red blood cell count to return to completely normal levels.";
  }

  // 7. BLOOD COMPATIBILITY & PHENOTYPING
  else if (q.includes("compatibility") || q.includes("blood group") || q.includes("matching")) {
    return "While basic compatibility checks ABO and RhD groups, patients receiving chronic transfusions need phenotypically matched blood. This involves matching minor antigens in systems like Rh subgroups (C, c, E, e) and the Kell system. Matching these antigens between the donor and recipient reduces the probability of the patient developing antibodies (alloimmunization) by more than 80%.";
  } else if (q.includes("phenotype") || q.includes("kell") || q.includes("antigen")) {
    return "Minor antigens (like Kell, Duffy, Kidd, and Rh sub-antigens C/c/E/e) are proteins on red blood cells. In chronic transfusions, matching these antigens prevents alloimmunization (antibody build-up), which is a common reason why finding compatible blood becomes extremely difficult for patients over time.";
  }

  // 8. PLATFORM USAGE & REGISTRATION
  else if (q.includes("how to register") || q.includes("sign up") || q.includes("register")) {
    return "You can register on Raksha AI as a donor at `/register/donor` or request care support as a patient at `/register/patient`. Once registered, donors can track schedules on their dashboard, and patients are matched with a dedicated compatible donor pool.";
  } else if (q.includes("coordinator") || q.includes("console") || q.includes("admin")) {
    return "The Coordinator Console is located at `/console` and is accessible only to administrators. It provides a real-time dashboard of clinical alerts, donor search and filters, re-engagement SMS Outreach triggers, and clinical escalations.";
  }

  // 9. EMERGENCY
  else if (q.includes("emergency") || q.includes("urgent") || q.includes("critical") || q.includes("need blood")) {
    return "If a patient needs blood immediately for a medical emergency, please call 108 or contact your hospital's emergency blood bank directly. You can also alert our care team at 1800-RAKSHA-1.";
  }

  // 10. CHATBOT HELP
  else if (q.includes("help") || q.includes("what can you do")) {
    return "I can answer questions about: 1. Thalassemia Major & Minor, 2. Blood compatibility & minor antigens, 3. Iron overload & chelation therapy, 4. Donor eligibility and schedules, 5. How to use Raksha AI, 6. Emergency contacts. Ask me anything!";
  }

  return "Hello! I am your RakshaAI Assistant. How can I help you support Thalassemia patients today?";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: "Messages history is required" },
        { status: 400 }
      );
    }

    // Determine user email from token
    const cookieStore = await cookies();
    const token = cookieStore.get("raksha_token")?.value;
    let userEmail = "guest";
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userEmail = decoded.email || "guest";
      } catch (e) {
        // ignore invalid token, treat as guest
      }
    }

    const lastUserMessage = messages[messages.length - 1]?.content || "";
    let reply = "";

    // 1. Try to use Gemini LLM if API Key is configured
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          systemInstruction: "You are Raksha, a premium universal medical assistant and blood donor coordinator. Answer accurately, caring, and professional. Keep answers clear and concise. If the user asks a non-medical question, answer it helpfully and accurately as a general conversational assistant, but maintain your helpful Raksha assistant persona."
        });

        // Map messages history to Gemini format (roles 'user' and 'model')
        const formattedHistory = messages.slice(0, -1).map((m: any) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }));

        const chat = model.startChat({
          history: formattedHistory
        });

        const result = await chat.sendMessage(lastUserMessage);
        reply = result.response.text();
      } catch (geminiError) {
        console.error("Gemini API call failed:", geminiError);
      }
    }

    // 2. Fall back to local rule-based response engine if Gemini is not available or fails
    if (!reply) {
      reply = getLocalFallbackResponse(lastUserMessage);
    }

    // Integrate with MongoDB: Save conversation log
    const db = await getDb();
    try {
      await db.collection("chat_history").insertOne({
        email: userEmail,
        role: "user",
        content: lastUserMessage,
        createdAt: new Date().toISOString()
      });
      await db.collection("chat_history").insertOne({
        email: userEmail,
        role: "assistant",
        content: reply,
        createdAt: new Date().toISOString()
      });
    } catch (dbErr) {
      console.warn("Could not save conversation log to MongoDB:", dbErr);
    }

    return NextResponse.json({ success: true, response: reply });

  } catch (err: any) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process chat" },
      { status: 500 }
    );
  }
}
