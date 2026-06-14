import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import Anthropic from "@anthropic-ai/sdk";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_rakshaai_jwt_key";

// Helper to safely parse MongoDB ObjectId
function safeObjectId(id: string): ObjectId | undefined {
  try {
    if (id && ObjectId.isValid(id)) {
      return new ObjectId(id);
    }
  } catch (e) {
    // Ignore and return undefined
  }
  return undefined;
}

// MongoDB Helper functions for the Claude tools

async function getUserEligibility(userId: string) {
  try {
    const db = await getDb();
    const queryId = safeObjectId(userId);
    
    // Search in donors first
    let user = await db.collection("donors").findOne({
      $or: [
        { donorId: userId },
        { donor_id: userId },
        ...(queryId ? [{ _id: queryId }] : [])
      ]
    });
    
    // If not found in donors, search in patients
    if (!user) {
      user = await db.collection("patients").findOne({
        $or: [
          { patientId: userId },
          { patient_id: userId },
          ...(queryId ? [{ _id: queryId }] : [])
        ]
      });
    }
    
    if (!user) {
      return { success: false, error: `User with ID ${userId} not found.` };
    }
    
    // Eligibility calculation (males every 90 days, females every 120 days)
    const lastDonatedStr = user.lastDonated || user.last_donation_date;
    if (!lastDonatedStr) {
      return {
        success: true,
        eligible: true,
        message: "User is eligible to donate now (no previous donation recorded)."
      };
    }
    
    const lastDonatedDate = new Date(lastDonatedStr);
    const daysDiff = (Date.now() - lastDonatedDate.getTime()) / (1000 * 60 * 60 * 24);
    const gender = (user.gender || "male").toLowerCase();
    const requiredInterval = gender === "female" ? 120 : 90;
    
    if (daysDiff >= requiredInterval) {
      return {
        success: true,
        eligible: true,
        lastDonationDate: lastDonatedStr,
        message: "User is eligible to donate now."
      };
    } else {
      const nextEligibleDate = new Date(lastDonatedDate.getTime() + requiredInterval * 24 * 60 * 60 * 1000);
      return {
        success: true,
        eligible: false,
        lastDonationDate: lastDonatedStr,
        nextEligibleDate: nextEligibleDate.toISOString().split("T")[0],
        daysRemaining: Math.ceil(requiredInterval - daysDiff),
        message: `Ineligible until ${nextEligibleDate.toISOString().split("T")[0]}. Required interval is ${requiredInterval} days.`
      };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function getUserDonationHistory(userId: string) {
  try {
    const db = await getDb();
    const queryId = safeObjectId(userId);
    
    const orQuery: any[] = [
      { donorId: userId },
      { donor_id: userId },
      { patientId: userId },
      { patient_id: userId }
    ];
    
    if (queryId) {
      orQuery.push(
        { donorId: queryId },
        { donor_id: queryId },
        { patientId: queryId },
        { patient_id: queryId }
      );
    }
    
    const transfusions = await db.collection("transfusions").find({
      $or: orQuery
    }).toArray();
    
    return {
      success: true,
      history: transfusions.map((t: any) => ({
        transfusionId: t.transfusionId,
        date: t.date,
        hemoglobinBefore: t.hemoglobinBefore,
        hemoglobinAfter: t.hemoglobinAfter,
        units: t.units,
        outcome: t.outcome
      }))
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function getAIMatchScore(userId: string) {
  try {
    const db = await getDb();
    const queryId = safeObjectId(userId);
    
    const donor = await db.collection("donors").findOne({
      $or: [
        { donorId: userId },
        { donor_id: userId },
        ...(queryId ? [{ _id: queryId }] : [])
      ]
    });
    
    if (!donor) {
      return { success: false, error: `Donor with ID ${userId} not found.` };
    }
    
    return {
      success: true,
      aiStatus: donor.aiStatus || "Active",
      aiConfidence: donor.aiConfidence || donor.ai_confidence || 90,
      feedbackScore: donor.feedbackScore || 5.0,
      donationCount: donor.donationCount || 0,
      message: `Donor Match details: status is ${donor.aiStatus || "Active"}, with a feedback score of ${donor.feedbackScore || 5.0}/5.0.`
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function updateAvailability(userId: string, status: string, dates?: string) {
  try {
    const db = await getDb();
    const queryId = safeObjectId(userId);
    const statusArray = status.split(",").map((s: string) => s.trim().toLowerCase());
    
    const result = await db.collection("donors").updateOne(
      {
        $or: [
          { donorId: userId },
          { donor_id: userId },
          ...(queryId ? [{ _id: queryId }] : [])
        ]
      },
      {
        $set: {
          availability: statusArray,
          availability_notes: dates || "",
          updatedAt: new Date().toISOString()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return { success: false, error: `Donor with ID ${userId} not found to update availability.` };
    }
    
    return {
      success: true,
      availability: statusArray,
      message: `Availability settings updated successfully to: ${statusArray.join(", ")}.`
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


// Context builders
async function getUserProfile(email: string) {
  const db = await getDb();
  let user = await db.collection("donors").findOne({ email });
  if (user) return { ...user, role: "donor" };
  user = await db.collection("patients").findOne({ email });
  if (user) return { ...user, role: "patient" };
  return null;
}

async function getUserContextString(profile: any) {
  if (!profile) return "User is not logged in (guest session).";
  
  const db = await getDb();
  const userId = profile.donorId || profile.patientId || profile._id.toString();
  const role = profile.role;
  
  let context = `Logged-in User Details:
- Name: ${profile.firstName} ${profile.lastName}
- Role: ${role}
- User ID: ${userId}
- Email: ${profile.email}
- Blood Group: ${profile.bloodGroup || profile.bloodType || "O+"}
`;

  if (role === "donor") {
    context += `- Last Donation Date: ${profile.lastDonated || "Never"}
- Total Donations: ${profile.donationCount || 0}
- Availability Settings: ${JSON.stringify(profile.availability || ["weekdays", "weekends"])}
- AI/Feedback Score: ${profile.feedbackScore || 5.0} / 5.0
`;
    // Check eligibility dynamically
    const lastDonatedStr = profile.lastDonated;
    if (lastDonatedStr) {
      const lastDonatedDate = new Date(lastDonatedStr);
      const daysDiff = (Date.now() - lastDonatedDate.getTime()) / (1000 * 60 * 60 * 24);
      const gender = (profile.gender || "male").toLowerCase();
      const requiredInterval = gender === "female" ? 120 : 90;
      if (daysDiff >= requiredInterval) {
        context += `- Eligibility Status: Eligible to donate now.\n`;
      } else {
        const nextEligibleDate = new Date(lastDonatedDate.getTime() + requiredInterval * 24 * 60 * 60 * 1000);
        context += `- Eligibility Status: Ineligible until ${nextEligibleDate.toISOString().split("T")[0]} (required interval: ${requiredInterval} days, last donated ${Math.floor(daysDiff)} days ago).\n`;
      }
    } else {
      context += `- Eligibility Status: Eligible to donate now (no previous donation recorded).\n`;
    }
  } else if (role === "patient") {
    context += `- Diagnosis: ${profile.diagnosis || "Thalassemia Major"}
- Transfusion Frequency: ${profile.transfusionFreq || "Every 21 days"}
`;
  }
  
  // Fetch recent appointments/history
  try {
    const query = role === "donor" ? { donorId: userId } : { patientId: userId };
    const appointments = await db.collection("appointments").find(query).limit(3).toArray();
    if (appointments.length > 0) {
      context += `- Recent Appointments:\n`;
      appointments.forEach((apt: any) => {
        context += `  * Hospital: ${apt.hospitalName}, Date: ${apt.scheduledAt}, Status: ${apt.status}\n`;
      });
    }
  } catch (e) {
    console.error("Error fetching appointments for chat context:", e);
  }
  
  return context;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, userId: bodyUserId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: "Messages history is required" },
        { status: 400 }
      );
    }

    // Determine user email and ID from token
    const cookieStore = await cookies();
    const token = cookieStore.get("raksha_token")?.value;
    let userEmail = "guest";
    let tokenUserId = "";
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userEmail = decoded.email || "guest";
        tokenUserId = decoded.userId || "";
      } catch (e) {
        // ignore invalid token
      }
    }

    // Load user profile and construct context
    let profile: any = null;
    const searchId = bodyUserId || tokenUserId;
    const db = await getDb();
    
    if (searchId) {
      const queryId = safeObjectId(searchId);
      profile = await db.collection("donors").findOne({
        $or: [
          { donorId: searchId },
          { donor_id: searchId },
          ...(queryId ? [{ _id: queryId }] : [])
        ]
      });
      
      if (profile) {
        profile.role = "donor";
      } else {
        profile = await db.collection("patients").findOne({
          $or: [
            { patientId: searchId },
            { patient_id: searchId },
            ...(queryId ? [{ _id: queryId }] : [])
          ]
        });
        if (profile) {
          profile.role = "patient";
        }
      }
    }

    if (!profile && userEmail !== "guest") {
      profile = await getUserProfile(userEmail);
    }
    
    const userContext = await getUserContextString(profile);

    const systemPrompt = `You are the "Raksha AI Assistant," a knowledgeable, warm, and respectful medical support assistant for a blood donation and Thalassemia care platform.
 
SAFETY DISCLAIMER:
Provide general guidance only. Clarify that the assistant is not a substitute for professional medical advice.
EMERGENCY PROTOCOL:
For any message indicating a medical emergency, severe transfusion reaction (e.g., high fever, rash, chest pain), or urgent bleeding, immediately recommend contacting emergency services (like calling 108 in India), contacting their hematologist, or visiting the nearest hospital emergency room. Do not attempt diagnosis.
 
SCOPE & BEHAVIOR:
- Answer ANY medical question accurately and concisely (e.g., about Thalassemia symptoms, genetics, iron chelation like Deferasirox, transfusion schedules, blood types, general anemia, first aid, etc.).
- Respond with empathy, respect, and in plain language.
- Keep responses concise (3-6 sentences unless the user asks for details), avoiding excessive medical jargon.
- If a question is outside medical or platform scope (completely unrelated to health, blood donation, or Raksha AI), politely redirect the user back to health, blood coordination, or platform-related topics.
- For platform-specific questions (donation eligibility, AI matching score, availability updates, donation history), you must use the provided tools to query MongoDB for the active user's details, rather than providing generic/placeholder replies.
- If the user is not logged in (guest session) and asks about their personal data, eligibility, availability, or AI match score, politely explain that they need to log in or sign up to view or modify their personal profile.
 
User Context:
${userContext}`;

    // Format history for Anthropic Claude (ensure roles alternate and roles are user/assistant)
    const cleanMessages: any[] = [];
    for (const m of messages) {
      const role = m.role === "assistant" ? "assistant" : "user";
      const content = m.content;
      
      if (cleanMessages.length > 0 && cleanMessages[cleanMessages.length - 1].role === role) {
        cleanMessages[cleanMessages.length - 1].content += "\n" + content;
      } else {
        cleanMessages.push({ role, content });
      }
    }

    // Ensure the first message is from the user
    if (cleanMessages.length > 0 && cleanMessages[0].role === "assistant") {
      cleanMessages.shift();
    }

    if (cleanMessages.length === 0) {
      return NextResponse.json({ success: true, response: "How can I help you support Thalassemia patients today?" });
    }

    let reply = "";

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    
    // Tools schema for Claude
    const tools = [
      {
        name: "getUserEligibility",
        description: "Gets the blood donation eligibility status and date for a donor or patient.",
        input_schema: {
          type: "object" as const,
          properties: {
            userId: { type: "string" as const, description: "The unique ID of the user (donorId or patientId)." }
          },
          required: ["userId"]
        }
      },
      {
        name: "getUserDonationHistory",
        description: "Gets the history of donations/transfusions for a donor or patient.",
        input_schema: {
          type: "object" as const,
          properties: {
            userId: { type: "string" as const, description: "The unique ID of the user." }
          },
          required: ["userId"]
        }
      },
      {
        name: "getAIMatchScore",
        description: "Gets the AI matching/feedback score and confidence level for the donor.",
        input_schema: {
          type: "object" as const,
          properties: {
            userId: { type: "string" as const, description: "The unique ID of the donor." }
          },
          required: ["userId"]
        }
      },
      {
        name: "updateAvailability",
        description: "Updates the donor's availability settings (e.g. weekdays, weekends, emergencies, or unavailable).",
        input_schema: {
          type: "object" as const,
          properties: {
            userId: { type: "string" as const, description: "The unique ID of the donor." },
            status: { type: "string" as const, description: "The new availability status / options (comma-separated or single, e.g. 'weekdays, weekends' or 'unavailable')." },
            dates: { type: "string" as const, description: "Optional specific date range or duration (e.g., '2 weeks')." }
          },
          required: ["userId", "status"]
        }
      }
    ];

    if (anthropicKey && !anthropicKey.startsWith("your_")) {
      try {
        const anthropic = new Anthropic({ apiKey: anthropicKey });
        
        let response = await anthropic.messages.create({
          model: "claude-3-5-sonnet-latest",
          max_tokens: 1024,
          system: systemPrompt,
          messages: cleanMessages,
          tools: tools as any
        });
        
        // Loop to execute tools if Claude demands it
        while (response.stop_reason === "tool_use") {
          const toolCalls = response.content.filter((c: any) => c.type === "tool_use") as any[];
          
          // Add assistant message with tool calls to conversation history
          cleanMessages.push({
            role: "assistant",
            content: response.content
          });
          
          const toolResults: any[] = [];
          for (const tc of toolCalls) {
            let result = {};
            if (tc.name === "getUserEligibility") {
              result = await getUserEligibility(tc.input.userId);
            } else if (tc.name === "getUserDonationHistory") {
              result = await getUserDonationHistory(tc.input.userId);
            } else if (tc.name === "getAIMatchScore") {
              result = await getAIMatchScore(tc.input.userId);
            } else if (tc.name === "updateAvailability") {
              result = await updateAvailability(tc.input.userId, tc.input.status, tc.input.dates);
            }
            
            toolResults.push({
              type: "tool_result",
              tool_use_id: tc.id,
              content: JSON.stringify(result)
            });
          }
          
          // Add tool results message from user to conversation history
          cleanMessages.push({
            role: "user",
            content: toolResults
          });
          
          // Query Claude again
          response = await anthropic.messages.create({
            model: "claude-3-5-sonnet-latest",
            max_tokens: 1024,
            system: systemPrompt,
            messages: cleanMessages,
            tools: tools as any
          });
        }
        
        reply = (response.content.find((c: any) => c.type === "text") as any)?.text || "";
      } catch (anthropicErr) {
        console.error("Anthropic Claude API call failed:", anthropicErr);
      }
    }

    // Fallback: If Anthropic key is missing or failed, use Gemini fallback with local mocking
    if (!reply) {
      const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (geminiKey) {
        try {
          const { GoogleGenerativeAI } = require("@google/generative-ai");
          const genAI = new GoogleGenerativeAI(geminiKey);
          const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite",
            systemInstruction: systemPrompt
          });

          // Standard conversational call for Gemini
          const lastUserMessage = cleanMessages[cleanMessages.length - 1]?.content || "";
          
          // Map history to Gemini parts structure
          const formattedHistory = cleanMessages.slice(0, -1).map((m: any) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }]
          }));

          const chat = model.startChat({ history: formattedHistory });
          const result = await chat.sendMessage(
            typeof lastUserMessage === "string" ? lastUserMessage : JSON.stringify(lastUserMessage)
          );
          reply = result.response.text();
        } catch (geminiErr) {
          console.error("Gemini fallback in chat API failed:", geminiErr);
        }
      }
    }

    // If both failed, use rule-based fallback
    if (!reply) {
      const lastUserMessage = cleanMessages[cleanMessages.length - 1]?.content || "";
      const lastMsgText = typeof lastUserMessage === "string" ? lastUserMessage : JSON.stringify(lastUserMessage);
      
      // Inject some mock database replies to suggestions if user is logged in
      const q = lastMsgText.toLowerCase().trim();
      const userId = profile?.donorId || profile?.patientId || "RKD-O-POS-DEMO";
      
      if (q.includes("eligible")) {
        const elig = await getUserEligibility(userId);
        reply = `${elig.message} ${profile ? `As a ${profile.role}, we calculate your eligibility based on your last donation date of ${profile.lastDonated || "Never"}.` : ""}`;
      } else if (q.includes("availability")) {
        if (q.includes("update") || q.includes("change") || q.includes("set")) {
          const res = await updateAvailability(userId, "weekends", "2 weeks");
          reply = `I have updated your availability status to "weekends" for the next 2 weeks. ${res.message}`;
        } else {
          reply = `Your current availability settings are: ${profile?.availability ? JSON.stringify(profile.availability) : "['weekdays', 'weekends']"}. You can ask me to update it anytime.`;
        }
      } else if (q.includes("score") || q.includes("ai")) {
        const score = await getAIMatchScore(userId);
        reply = `${score.message} The AI score ranks you higher in voluntary matching pools based on donation history and reliability.`;
      } else if (q.includes("matching") || q.includes("how does donor matching work")) {
        reply = "Our donor matching uses a machine learning model to score compatibility. It pairs donors and patients based on blood types, minor antigen profiles (like Kell), distance, and donor reliability to reduce alloimmunization risks.";
      } else {
        reply = "Hello! I am your RakshaAI assistant. How can I help you today?";
      }
    }

    // Integrate with MongoDB: Save conversation log
    try {
      const lastUserMessage = cleanMessages[cleanMessages.length - 1]?.content || "";
      const lastMsgText = typeof lastUserMessage === "string" ? lastUserMessage : JSON.stringify(lastUserMessage);
      
      await db.collection("chat_history").insertOne({
        email: userEmail,
        role: "user",
        content: lastMsgText,
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
