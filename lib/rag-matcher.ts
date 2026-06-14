import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const HEMATOLOGY_GUIDELINES = `
TRANSFUSION COMPATIBILITY & CLINICAL GUIDELINES FOR THALASSEMIA:
1. Major Compatibility (ABO and RhD):
   - Patient blood group determines compatible donor ABO types (standard blood banking rules).
2. Minor Antigen Matching (Prevention of Alloimmunization):
   - Thalassemia patients receive recurrent lifelong transfusions, making them highly susceptible to antibody formation (alloimmunization).
   - Kell Antigen (K/k): Essential to match. If the patient is Kell-negative, they must receive Kell-negative blood to prevent anti-K development. If the patient has Anti-K history, Kell-positive blood is strictly prohibited.
   - Rh Antigens (C, c, E, e): Patients with Anti-E, Anti-C, etc., must be transfused with antigen-negative blood.
   - Duffy (Fya, Fyb) and Kidd (Jka, Jkb): Phenotype matching prevents delayed hemolytic transfusion reactions in patients with active or historical antibodies.
   - Clinical Action: If a patient has an antibody history (e.g., "Kell" or "Anti-E"), verify that the donor does not carry the corresponding antigen. Flag matches with active conflicts as "High" alloimmunization risk and reduce their score by 30-40 points. Flag matches with minor risks as "Moderate" risk. Matches with zero conflicts and good compatibility are "Low" risk.
`;

export async function rerankMatchesWithRAG(patient: any, matches: any[]): Promise<any[]> {
  if (!matches || matches.length === 0) return [];

  // Rerank only the top 5 candidates to keep LLM overhead minimal and cost-efficient
  const topCandidates = matches.slice(0, 5);
  const remainingCandidates = matches.slice(5);

  const patientBlood = patient.bloodGroup || patient.blood_group || "B+";
  const patientCity = patient.city || "";
  const antibodyHistory = patient.antibody_history || patient.complication || [];

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  const systemPrompt = `You are a Clinical Hematologist AI Agent. Your task is to review the top 5 blood donor candidates matched for a Thalassemia patient, apply medical guidelines, and output a JSON list of updated donor matches.

Guidelines to apply:
${HEMATOLOGY_GUIDELINES}

Patient Info:
- Blood Group: ${patientBlood}
- Antibody History: ${JSON.stringify(antibodyHistory)}
- City: ${patientCity}

Donor Candidates (Top 5):
${JSON.stringify(
  topCandidates.map((c) => ({
    donor_id: c.donor_id || c.id,
    donor_name: c.donor_name || c.name,
    blood_group: c.blood_group || c.blood,
    city: c.city || "",
    distance_km: c.distance_km || c.distance || 0,
    composite_score: c.composite_score || c.matchScore || 80,
    extended_antigens: c.extended_antigens || c.scoreBreakdown?.explanation ? [c.scoreBreakdown?.explanation] : [],
  })),
  null,
  2
)}

You must evaluate minor antigen compatibility and alloimmunization risk for each donor.
Adjust the "composite_score" (up or down by up to 20-30 points) based on antigen safety, proximity, and donation recency.
Assign "alloimmunization_risk": "Low" | "Moderate" | "High".
Provide a concise 2-sentence "rag_explanation" describing the clinical safety of the match.

Response format: You MUST respond ONLY with a valid JSON array of objects, each containing:
- "donor_id": (string, must match the input candidate's donor_id)
- "composite_score": (number, the updated score, range 0-100)
- "alloimmunization_risk": ("Low" | "Moderate" | "High")
- "rag_explanation": (string, 2 sentences explaining safety details)

Do not include any introductory or concluding text, only the raw JSON array.`;

  let jsonResult: any[] = [];

  // 1. Try Anthropic Claude
  if (anthropicKey && !anthropicKey.startsWith("your_")) {
    try {
      const anthropic = new Anthropic({ apiKey: anthropicKey });
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 1000,
        system: "You are a clinical hematologist agent. You must only output a valid JSON array of objects, with no markdown tags.",
        messages: [{ role: "user", content: systemPrompt }],
      });
      const text = (response.content.find((c: any) => c.type === "text") as any)?.text || "";
      jsonResult = parseLLMJsonArray(text);
    } catch (err) {
      console.error("RAG Reranker: Claude call failed:", err);
    }
  }

  // 2. Try Gemini Fallback
  if (jsonResult.length === 0 && geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
      const result = await model.generateContent(systemPrompt);
      const text = result.response.text();
      jsonResult = parseLLMJsonArray(text);
    } catch (err) {
      console.error("RAG Reranker: Gemini fallback failed:", err);
    }
  }

  // 3. Heuristic Rule-Based Fallback (if LLMs fail or are unconfigured)
  if (jsonResult.length === 0) {
    console.log("RAG Reranker: Running rule-based local backup");
    jsonResult = topCandidates.map((c) => {
      const donorId = c.donor_id || c.id;
      const donorName = c.donor_name || c.name || "Donor";
      const extendedAntigens = c.extended_antigens || [];
      const dist = c.distance_km || c.distance || 0;
      
      let risk: "Low" | "Moderate" | "High" = "Low";
      let conflicts: string[] = [];
      let scoreAdj = 0;

      for (const ab of antibodyHistory) {
        if (extendedAntigens.includes(ab)) {
          conflicts.push(ab);
        }
      }

      if (conflicts.length > 0) {
        risk = "High";
        scoreAdj = -35;
      } else if (antibodyHistory.length > 0) {
        risk = "Moderate";
        scoreAdj = -10;
      }

      const updatedScore = Math.max(0, Math.min(100, (c.composite_score || c.matchScore || 80) + scoreAdj));
      const explanation = conflicts.length > 0
        ? `Clinical alert: Donor has active antigen conflicts for ${conflicts.join(", ")}. Elevated risk of alloimmunization.`
        : `ABO/Rh compatible match. No antibody conflicts found based on patient history. Safe for clinical dispatch.`;

      return {
        donor_id: donorId,
        composite_score: updatedScore,
        alloimmunization_risk: risk,
        rag_explanation: explanation
      };
    });
  }

  // Merge the RAG reranking metrics back into the top candidates list
  const enrichedTopCandidates = topCandidates.map((c) => {
    const id = c.donor_id || c.id;
    const ragData = jsonResult.find((r) => r.donor_id === id) || {};
    
    const originalScore = c.composite_score || c.matchScore || 80;
    const finalScore = typeof ragData.composite_score === "number" ? ragData.composite_score : originalScore;
    const finalRisk = ragData.alloimmunization_risk || c.alloimmunization_risk || "Low";
    
    // Create detailed explanation for screen cards
    const originalExplanation = c.scoreBreakdown?.explanation || "";
    const finalExplanation = ragData.rag_explanation 
      ? `${ragData.rag_explanation} (${c.donor_name || c.name} is located ${c.distance_km || c.distance || 0} km away).`
      : originalExplanation;

    return {
      ...c,
      composite_score: finalScore,
      matchScore: finalScore,
      alloimmunization_risk: finalRisk,
      scoreBreakdown: {
        ...(c.scoreBreakdown || {}),
        explanation: finalExplanation
      }
    };
  });

  // Re-sort the top 5 candidates based on their updated clinical RAG scores
  enrichedTopCandidates.sort((a, b) => b.composite_score - a.composite_score);

  // Return the merged array of reranked candidates followed by the remaining matches
  return [...enrichedTopCandidates, ...remainingCandidates];
}

// Helper to safely strip formatting and parse JSON arrays from LLM responses
function parseLLMJsonArray(text: string): any[] {
  try {
    let clean = text.trim();
    // Strip markdown code block wrappers
    if (clean.includes("```")) {
      const parts = clean.split("```");
      for (const part of parts) {
        const sub = part.trim();
        if (sub.startsWith("json")) {
          clean = sub.substring(4).trim();
          break;
        } else if (sub.startsWith("[")) {
          clean = sub;
          break;
        }
      }
    }
    const parsed = JSON.parse(clean);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("Failed to parse JSON array from LLM response:", e, text);
    return [];
  }
}
