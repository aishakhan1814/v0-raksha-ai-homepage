/**
 * SMS WEBHOOK ADAPTER
 * 
 * Parses inbound SMS payloads from Twilio, AWS Pinpoint / SNS, or generic SMS gateways.
 * Normalizes parameters to standard InboundMessage interface.
 */

import type { InboundWebhookAdapter, InboundMessage, WebhookVerificationResult } from "../types.ts";
import { normalizePhoneNumber } from "../normalizer.ts";
import { TwilioSignatureVerifier, MockSignatureVerifier } from "../security.ts";

export class SmsWebhookAdapter implements InboundWebhookAdapter {
  public readonly providerName = "sms_gateway";
  public readonly channel = "SMS" as const;

  private twilioVerifier: TwilioSignatureVerifier;
  private mockVerifier: MockSignatureVerifier;

  constructor() {
    this.twilioVerifier = new TwilioSignatureVerifier();
    this.mockVerifier = new MockSignatureVerifier();
  }

  async parsePayload(req: Request, rawBody: string | Record<string, any>): Promise<InboundMessage> {
    let payload: Record<string, any> = {};

    if (typeof rawBody === "string") {
      try {
        // Try parsing JSON first
        payload = JSON.parse(rawBody);
      } catch {
        // Try parsing URL-encoded form data (standard Twilio format)
        const params = new URLSearchParams(rawBody);
        for (const [k, v] of params.entries()) {
          payload[k] = v;
        }
      }
    } else {
      payload = rawBody;
    }

    // Extract fields (supporting Twilio, Pinpoint, and generic contracts)
    const fromPhone = normalizePhoneNumber(
      payload.From || payload.from || payload.sender || payload.originationNumber || ""
    );
    const toPhone = normalizePhoneNumber(
      payload.To || payload.to || payload.destination || payload.destinationNumber || ""
    );
    const body = (payload.Body || payload.body || payload.message || payload.text || "").trim();
    const providerMessageId =
      payload.MessageSid ||
      payload.SmsMessageSid ||
      payload.messageId ||
      payload.id ||
      `SMS-MSG-${Date.now()}`;

    // Extract timestamp
    const timestamp =
      payload.timestamp ||
      req.headers.get("x-webhook-timestamp") ||
      req.headers.get("x-twilio-timestamp") ||
      new Date().toISOString();

    const signature =
      req.headers.get("x-twilio-signature") ||
      req.headers.get("x-mock-signature") ||
      req.headers.get("x-webhook-signature") ||
      undefined;

    return {
      provider: "twilio_sms",
      channel: "SMS",
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

    // Otherwise check Twilio signature
    return this.twilioVerifier.verify(req, rawString, secret);
  }
}
