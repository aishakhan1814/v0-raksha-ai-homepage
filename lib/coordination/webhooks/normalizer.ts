/**
 * RAKSHAI INBOUND RESPONSE NORMALIZER
 * 
 * Normalizes free-form donor text messages (SMS / WhatsApp) into deterministic
 * clinical intents: ACCEPTED, DECLINED, HELP, or UNKNOWN.
 * 
 * Also extracts embedded Request IDs and normalizes donor telephone numbers.
 */

import type { NormalizedIntent, NormalizedResponse } from "./types.ts";

// Regex for extracting Blood Request IDs (e.g., REQ-1732283912-A1B2 or REQ-9872)
const REQUEST_ID_REGEX = /\b(REQ-[A-Z0-9_\-]+)\b/i;

// Token dictionaries for intent matching
const ACCEPT_TOKENS = new Set([
  "yes",
  "y",
  "accept",
  "accepted",
  "agree",
  "agreed",
  "confirm",
  "confirmed",
  "sure",
  "ok",
  "okay",
  "available",
  "ready",
  "in",
  "1",
  "haan",
  "ha",
  "yes please",
  "i can",
  "count me in",
  "willing"
]);

const DECLINE_TOKENS = new Set([
  "no",
  "n",
  "decline",
  "declined",
  "reject",
  "rejected",
  "cannot",
  "cant",
  "can't",
  "unavailable",
  "sorry",
  "pass",
  "2",
  "nahi",
  "na",
  "not possible",
  "unable"
]);

const HELP_TOKENS = new Set([
  "help",
  "info",
  "information",
  "support",
  "contact",
  "coordinator",
  "details",
  "faq",
  "what",
  "?"
]);

const OPT_OUT_TOKENS = new Set([
  "stop",
  "unsubscribe",
  "cancel",
  "end",
  "quit",
  "optout",
  "opt out",
  "opt-out"
]);

/**
 * Normalizes phone numbers to standard E.164 format.
 * Strips 'whatsapp:' prefix, hyphens, parentheses, and spaces.
 * Example: "whatsapp:+919876543210" -> "+919876543210"
 * Example: "09876543210" -> "+919876543210" (assuming standard 10-digit Indian mobile)
 */
export function normalizePhoneNumber(rawPhone?: string): string {
  if (!rawPhone) return "";
  let cleaned = rawPhone.trim().toLowerCase();

  // Strip WhatsApp prefix
  if (cleaned.startsWith("whatsapp:")) {
    cleaned = cleaned.replace("whatsapp:", "").trim();
  }

  // Remove spaces, dashes, dots, brackets
  cleaned = cleaned.replace(/[\s\-\(\)\.]/g, "");

  // If already starts with +, return
  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  // 10-digit Indian number fallback -> prepend +91
  if (/^\d{10}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }

  // 11-digit starting with 0 -> replace 0 with +91
  if (/^0\d{10}$/.test(cleaned)) {
    return `+91${cleaned.substring(1)}`;
  }

  // 12-digit starting with 91 -> prepend +
  if (/^91\d{10}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  return cleaned;
}

/**
 * Normalizes an inbound message body into a structured intent with confidence.
 */
export function normalizeInboundResponse(rawMessage?: string): NormalizedResponse {
  const originalText = rawMessage || "";
  
  // 1. Clean text: lowercase, trim, collapse whitespace, strip peripheral punctuation
  let cleaned = originalText
    .toLowerCase()
    .replace(/[^\w\s\-\?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 2. Extract potential Request ID if included by the donor
  let extractedRequestId: string | undefined;
  const reqMatch = originalText.match(REQUEST_ID_REGEX);
  if (reqMatch) {
    extractedRequestId = reqMatch[1].toUpperCase();
    // Remove request ID from words being evaluated for intent
    cleaned = cleaned.replace(new RegExp(extractedRequestId, "gi"), "").trim();
  }

  if (!cleaned) {
    return {
      intent: "UNKNOWN",
      confidence: 0,
      originalText,
      cleanedText: "",
      extractedRequestId
    };
  }

  // 3. Exact full-match check
  if (ACCEPT_TOKENS.has(cleaned)) {
    return {
      intent: "ACCEPTED",
      confidence: 1.0,
      originalText,
      cleanedText: cleaned,
      extractedRequestId
    };
  }

  if (DECLINE_TOKENS.has(cleaned)) {
    return {
      intent: "DECLINED",
      confidence: 1.0,
      originalText,
      cleanedText: cleaned,
      extractedRequestId
    };
  }

  if (HELP_TOKENS.has(cleaned)) {
    return {
      intent: "HELP",
      confidence: 1.0,
      originalText,
      cleanedText: cleaned,
      extractedRequestId
    };
  }

  if (OPT_OUT_TOKENS.has(cleaned)) {
    return {
      intent: "OPT_OUT",
      confidence: 1.0,
      originalText,
      cleanedText: cleaned,
      extractedRequestId
    };
  }

  // 4. Tokenized word-level matching
  const words = cleaned.split(" ").filter((w) => w.length > 0);

  // Check if first word is an explicit accept, decline, help, or opt-out
  if (words.length > 0) {
    const first = words[0];
    if (OPT_OUT_TOKENS.has(first)) {
      return {
        intent: "OPT_OUT",
        confidence: 0.95,
        originalText,
        cleanedText: cleaned,
        extractedRequestId
      };
    }
    if (ACCEPT_TOKENS.has(first)) {
      return {
        intent: "ACCEPTED",
        confidence: 0.9,
        originalText,
        cleanedText: cleaned,
        extractedRequestId
      };
    }
    if (DECLINE_TOKENS.has(first)) {
      return {
        intent: "DECLINED",
        confidence: 0.9,
        originalText,
        cleanedText: cleaned,
        extractedRequestId
      };
    }
    if (HELP_TOKENS.has(first)) {
      return {
        intent: "HELP",
        confidence: 0.9,
        originalText,
        cleanedText: cleaned,
        extractedRequestId
      };
    }
  }

  // Scan all words for any accept, decline, help, or opt-out signal
  const hasOptOut = words.some((w) => OPT_OUT_TOKENS.has(w));
  if (hasOptOut) {
    return {
      intent: "OPT_OUT",
      confidence: 0.9,
      originalText,
      cleanedText: cleaned,
      extractedRequestId
    };
  }

  const hasAccept = words.some((w) => ACCEPT_TOKENS.has(w));
  const hasDecline = words.some((w) => DECLINE_TOKENS.has(w));
  const hasHelp = words.some((w) => HELP_TOKENS.has(w));

  if (hasAccept && !hasDecline) {
    return {
      intent: "ACCEPTED",
      confidence: 0.8,
      originalText,
      cleanedText: cleaned,
      extractedRequestId
    };
  }

  if (hasDecline && !hasAccept) {
    return {
      intent: "DECLINED",
      confidence: 0.8,
      originalText,
      cleanedText: cleaned,
      extractedRequestId
    };
  }

  if (hasHelp) {
    return {
      intent: "HELP",
      confidence: 0.85,
      originalText,
      cleanedText: cleaned,
      extractedRequestId
    };
  }

  // Fallback: UNKNOWN (requires clarification response)
  return {
    intent: "UNKNOWN",
    confidence: 0.1,
    originalText,
    cleanedText: cleaned,
    extractedRequestId
  };
}
