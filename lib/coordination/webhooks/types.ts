/**
 * RAKSHAI INBOUND WEBHOOKS - TYPES & CONTRACTS
 * 
 * Provider-agnostic interfaces for receiving and processing inbound SMS and WhatsApp
 * donor responses, signature verification, and deduplication.
 */

export type WebhookChannel = "SMS" | "WHATSAPP";
export type NormalizedIntent = "ACCEPTED" | "DECLINED" | "HELP" | "OPT_OUT" | "UNKNOWN";

export interface InboundMessage {
  provider: string; // e.g. "twilio_sms", "meta_whatsapp", "mock"
  channel: WebhookChannel;
  providerMessageId: string;
  fromPhone: string;
  toPhone?: string;
  body: string;
  timestamp: string; // ISO 8601
  signature?: string;
  rawPayload: Record<string, any>;
}

export interface NormalizedResponse {
  intent: NormalizedIntent;
  confidence: number;
  originalText: string;
  cleanedText: string;
  extractedRequestId?: string;
}

export interface WebhookVerificationResult {
  valid: boolean;
  reason?: string;
  statusCode?: number;
}

export interface InboundWebhookAdapter {
  providerName: string;
  channel: WebhookChannel;
  parsePayload(req: Request, rawBody: string | Record<string, any>): Promise<InboundMessage>;
  verifySignature(req: Request, rawBody: string, secret?: string): Promise<WebhookVerificationResult>;
}

export interface WebhookProcessResult {
  success: boolean;
  message: string;
  requestId?: string;
  donorId?: string;
  intent: NormalizedIntent;
  duplicate: boolean;
  statusCode: number;
  replyMessage?: string;
  error?: string;
}

export const WebhookChannel = {};
export const NormalizedIntent = {};
export const InboundMessage = {};
export const NormalizedResponse = {};
export const WebhookVerificationResult = {};
export const InboundWebhookAdapter = {};
export const WebhookProcessResult = {};
