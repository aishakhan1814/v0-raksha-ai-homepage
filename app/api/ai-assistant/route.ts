import { type NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

export const maxDuration = 30

const SYSTEM_PROMPT = `You are the Raksha Assistant — an AI assistant for Raksha AI, a blood donation and care coordination platform built specifically for Thalassemia patients across India, powered by Blood Warriors Foundation.

Your role:
- Answer questions about blood donation eligibility, process, and safety
- Explain Thalassemia (Major, Minor, Intermedia) in plain, accessible language
- Explain how Raksha AI works: donor matching, scheduling, compatibility (ABO, Rh, Kell antigen)
- Guide families on transfusion scheduling, iron overload, chelation therapy
- Explain blood compatibility beyond ABO types (extended Rh phenotype, Kell antigen)
- Help donors understand commitment tiers (Raksha Friend, Guardian, Warrior)
- Provide general information about blood banks and the donation process in India

Your tone:
- Warm, clear, and human — not clinical or robotic
- Reassuring for scared families
- Motivating for potential donors
- Always honest about the limits of your knowledge

Critical rules:
- NEVER give specific medical advice or diagnoses
- Always recommend consulting a treating physician for medical decisions
- Keep responses concise (under 200 words unless the question genuinely needs more)
- Use simple language — many users may not be medical professionals
- When relevant, mention that Raksha AI can help coordinate care
- Respond in the same language the user writes in (Telugu, Hindi, Marathi, etc.)
- For emergencies, always direct to: 1800-XXX-XXXX (Blood Warriors emergency line)

Key facts about Thalassemia:
- 1,00,000+ patients in India
- Transfusion frequency: every 21-28 days for Thalassemia Major
- 500-700 transfusions in a lifetime
- Extended blood typing reduces alloimmunization risk
- Raksha AI is free for patients and families`

type ChatMessage = { role: "user" | "assistant"; content: string }

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "The assistant is not configured yet. Please add an ANTHROPIC_API_KEY to enable responses." },
        { status: 500 },
      )
    }

    const { message, conversationHistory = [] } = (await req.json()) as {
      message?: string
      conversationHistory?: ChatMessage[]
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 })
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: "Message is too long." }, { status: 400 })
    }

    const history = conversationHistory
      .filter(
        (m): m is ChatMessage =>
          !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && !!m.content.trim(),
      )
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }))

    const anthropic = new Anthropic({ apiKey })

    const completion = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 700,
      system: SYSTEM_PROMPT,
      messages: [...history, { role: "user", content: message.trim() }],
    })

    const reply =
      completion.content
        .filter((block) => block.type === "text")
        .map((block) => (block.type === "text" ? block.text : ""))
        .join("\n")
        .trim() || "I could not generate a response. Please try again."

    return NextResponse.json({ reply, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error("[v0] AI Assistant Error:", error)
    return NextResponse.json({ error: "Failed to get response. Please try again." }, { status: 500 })
  }
}
