/**
 * WHATSAPP WEBHOOK ADAPTER
 * 
 * Parses inbound WhatsApp messages from Meta WhatsApp Business Cloud API or Twilio for WhatsApp.
 * Normalizes parameters to standard InboundMessage interface.
 */

import type { InboundWebhookAdapter, InboundMessage, WebhookVerificationResult } from "../types.ts";
import { normalizePhoneNumber } from "../normalizer.ts";
import { WhatsAppSignatureVerifier, MockSignatureVerifier } from "../security.ts";

export class WhatsAppWebhookAdapter implements InboundWebhookAdapter {
  public readonly providerName = "whatsapp_gateway";
  public readonly channel = "WHATSAPP" as const;

  private whatsappVerifier: WhatsAppSignatureVerifier;
  private mockVerifier: MockSignatureVerifier;

  constructor() {
    this.whatsappVerifier = new WhatsAppSignatureVerifier();
    this.mockVerifier = new MockSignatureVerifier();
  }

  async parsePayload(req: Request, rawBody: string | Record<string, any>): Promise<InboundMessage> {
    let payload: Record<string, any> = {};

    if (typeof rawBody === "string") {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        const params = new URLSearchParams(rawBody);
        for (const [k, v] of params.entries()) {
          payload[k] = v;
        }
      }
    } else {
      payload = rawBody;
    }

    let fromPhone = "";
    let toPhone = "";
    let body = "";
    let providerMessageId = "";
    let timestamp = new Date().toISOString();

    // 1. Meta WhatsApp Cloud API Format
    if (payload.entry && Array.isArray(payload.entry) && payload.entry[0]?.changes) {
      const change = payload.entry[0].changes[0]?.value;
      if (change?.messages && Array.isArray(change.messages) && change.messages[0]) {
        const msg = change.messages[0];
        fromPhone = normalizePhoneNumber(msg.from);
        body = (msg.text?.body || msg.button?.text || "").trim();
        providerMessageId = msg.id || `WA-${Date.now()}`;
        if (msg.timestamp) {
          const epoch = parseInt(msg.timestamp, 10);
          timestamp = new Date(epoch > 1e11 ? epoch : epoch * 1000).toISOString();
        }
      }
    }

    // 2. Twilio WhatsApp Format (e.g. From: "whatsapp:+919876543210")
    if (!fromPhone && (payload.From || payload.from)) {
      fromPhone = normalizePhoneNumber(payload.From || payload.from);
      toPhone = normalizePhoneNumber(payload.To || payload.to);
      body = (payload.Body || payload.body || payload.text || "").trim();
      providerMessageId = payload.MessageSid || payload.messageId || payload.id || `WA-${Date.now()}`;
      if (payload.timestamp) timestamp = payload.timestamp;
    }

    // Fallback timestamp from header if not in payload
    if (req.headers.has("x-webhook-timestamp")) {
      timestamp = req.headers.get("x-webhook-timestamp")!;
    }

    const signature =
      req.headers.get("x-hub-signature-256") ||
      req.headers.get("x-mock-signature") ||
      req.headers.get("x-webhook-signature") ||
      undefined;

    return {
      provider: "meta_whatsapp",
      channel: "WHATSAPP",
      providerMessageId,
      fromPhone,
      toPhone,
      body,
      timestamp,
      signature,
      rawPayload: payload
    };
  }

  async verifySignature(req: Request, rawBody: string, secret?: string): Promise<WebhookVerificationResult> {
    const rawString = typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody);

    // If mock signature is provided, verify via mock verifier
    if (
      req.headers.has("x-mock-signature") ||
      req.headers.has("x-webhook-signature") ||
      process.env.NODE_ENV === "test"
    ) {
      const mockResult = await this.mockVerifier.verify(req, rawString, secret);
      if (mockResult.valid || req.headers.has("x-mock-signature")) {
        return mockResult;
      }
    }

    // Otherwise check WhatsApp signature
    return this.whatsappVerifier.verify(req, rawString, secret);
  }
}
