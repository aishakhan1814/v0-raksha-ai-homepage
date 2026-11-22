/**
 * RAKSHAI INBOUND WEBHOOK PROCESSOR
 * 
 * Central coordinator for processing inbound donor messages from SMS & WhatsApp webhooks.
 * Enforces:
 * - Provider signature verification
 * - Replay protection & timestamp freshness validation
 * - Message deduplication by providerMessageId
 * - Sliding-window rate limiting
 * - Semantic intent normalization (ACCEPTED, DECLINED, HELP, UNKNOWN)
 * - Deterministic outreach record validation (never trusts unverified IDs)
 * - Integration with CoordinationEngine state machine and audit trail
 * - Zero PII logging
 */

import crypto from "crypto";
import type {
  InboundWebhookAdapter,
  InboundMessage,
  WebhookProcessResult,
  NormalizedResponse
} from "./types.ts";
import { normalizeInboundResponse, normalizePhoneNumber } from "./normalizer.ts";
import {
  validateWebhookTimestamp,
  globalDeduplicator,
  globalRateLimiter,
  sanitizeLogText
} from "./security.ts";
import { maskPhoneNumber } from "../notifications/interface.ts";
import { getCoordinationEngine, CoordinationEngine } from "../engine.ts";
import type { BloodRequestRecord, InboundWebhookRecord } from "../types.ts";

export class WebhookProcessor {
  private engine: CoordinationEngine;

  constructor(engine?: CoordinationEngine) {
    this.engine = engine || getCoordinationEngine();
  }

  /**
   * Processes an incoming webhook request through the given adapter.
   */
  async processWebhook(
    adapter: InboundWebhookAdapter,
    req: Request,
    rawBody: string
  ): Promise<WebhookProcessResult> {
    const rawLength = rawBody ? rawBody.length : 0;

    // ─── STEP 1: Provider Signature Verification ──────────────────────────────
    const sigResult = await adapter.verifySignature(req, rawBody);
    if (!sigResult.valid) {
      return {
        success: false,
        statusCode: sigResult.statusCode || 403,
        intent: "UNKNOWN",
        duplicate: false,
        message: sigResult.reason || "Unauthorized: Provider signature verification failed",
        error: "invalid_signature"
      };
    }

    // ─── STEP 2: Parse Payload via Adapter ────────────────────────────────────
    let inbound: InboundMessage;
    try {
      inbound = await adapter.parsePayload(req, rawBody);
    } catch (err: any) {
      return {
        success: false,
        statusCode: 400,
        intent: "UNKNOWN",
        duplicate: false,
        message: "Failed to parse webhook payload",
        error: err.message
      };
    }

    const maskedPhone = maskPhoneNumber(inbound.fromPhone);

    // ─── STEP 3: Timestamp & Replay Validation ────────────────────────────────
    const timeCheck = validateWebhookTimestamp(inbound.timestamp);
    if (!timeCheck.valid) {
      return {
        success: false,
        statusCode: 401,
        intent: "UNKNOWN",
        duplicate: false,
        message: `Security rejection: ${timeCheck.reason}`,
        error: "expired_timestamp"
      };
    }

    // ─── STEP 4: Deduplication Check (providerMessageId) ───────────────────────
    if (globalDeduplicator.isDuplicate(inbound.providerMessageId)) {
      return {
        success: true,
        statusCode: 200,
        intent: "UNKNOWN",
        duplicate: true,
        message: `Duplicate webhook delivery ignored for message ${inbound.providerMessageId}`
      };
    }

    // ─── STEP 5: Sliding-Window Rate Limiting ──────────────────────────────────
    const rateKey = inbound.fromPhone || "anonymous_sender";
    const rateCheck = globalRateLimiter.checkRateLimit(rateKey);
    if (!rateCheck.allowed) {
      return {
        success: false,
        statusCode: 429,
        intent: "UNKNOWN",
        duplicate: false,
        message: `Rate limit exceeded. Try again in ${rateCheck.retryAfterSeconds}s`,
        error: "rate_limit_exceeded"
      };
    }

    // ─── STEP 6: Normalize Response Intent ────────────────────────────────────
    const normalized: NormalizedResponse = normalizeInboundResponse(inbound.body);

    // ─── STEP 7: Handle HELP Intent ───────────────────────────────────────────
    if (normalized.intent === "HELP") {
      const helpReply = (
        "RakshAI Blood Coordination: Reply YES to confirm blood donation, " +
        "or NO if unavailable. For urgent clinical queries, contact your care coordinator."
      );
      return {
        success: true,
        statusCode: 200,
        intent: "HELP",
        duplicate: false,
        message: "Help instructions provided to donor",
        replyMessage: helpReply
      };
    }

    // ─── STEP 7B: Handle OPT_OUT Intent (STOP / Unsubscribe) ──────────────────
    if (normalized.intent === "OPT_OUT") {
      const store = this.engine.getStore();
      const donors = await store.getDonors();
      const normalizedFromPhone = normalizePhoneNumber(inbound.fromPhone);

      const matchedDonor = donors.find((d: any) => {
        const dPhone = normalizePhoneNumber(d.phone || d.phoneNumber || d.rawPhone);
        return dPhone && dPhone === normalizedFromPhone;
      });
      const donorId = matchedDonor ? (matchedDonor.donorId || matchedDonor.donor_id) : undefined;

      // Persist donor opt-out record
      await store.saveDonorOptOut({
        donorId,
        phoneNormalized: normalizedFromPhone,
        phoneMasked: maskedPhone,
        optedOutAt: new Date().toISOString(),
        channel: inbound.channel,
        reason: `Donor opted out via ${inbound.channel} message: "${inbound.body}"`
      });

      // Update pending candidate status on any active requests
      const allRequests = await store.listRequests();
      const activeRequests = allRequests.filter((r) =>
        ["AWAITING_RESPONSES", "PARTIALLY_ACCEPTED", "ESCALATED"].includes(r.status)
      );

      let updatedReqId: string | undefined;
      for (const r of activeRequests) {
        const candidate = r.candidates.find((c) => {
          if (donorId && c.donorId === donorId) return true;
          const cPhone = normalizePhoneNumber(c.rawPhone);
          return cPhone && cPhone === normalizedFromPhone;
        });

        if (candidate && candidate.responseStatus === "PENDING") {
          updatedReqId = r.requestId;
          await this.engine.recordDonorResponse(
            r.requestId,
            candidate.donorId,
            "OPTED_OUT",
            { userId: candidate.donorId, role: "donor" },
            `Donor opted out via ${inbound.channel} message`
          );
        }
      }

      const optOutReply = (
        "RakshAI: You have successfully opted out of blood donation requests. " +
        "You will no longer receive emergency outreach messages. Reply START to re-subscribe."
      );

      return {
        success: true,
        statusCode: 200,
        requestId: updatedReqId,
        donorId,
        intent: "OPT_OUT",
        duplicate: false,
        message: `Donor ${maskedPhone} successfully opted out of future blood outreach`,
        replyMessage: optOutReply
      };
    }

    // ─── STEP 8: Resolve Donor and Active Blood Request ───────────────────────
    const store = this.engine.getStore();
    const donors = await store.getDonors();
    const normalizedFromPhone = normalizePhoneNumber(inbound.fromPhone);

    // Find donor matching from-phone
    const matchedDonor = donors.find((d: any) => {
      const dPhone = normalizePhoneNumber(d.phone || d.phoneNumber || d.rawPhone);
      return dPhone && dPhone === normalizedFromPhone;
    });

    const donorId = matchedDonor ? (matchedDonor.donorId || matchedDonor.donor_id) : undefined;

    // Scan for active requests in AWAITING_RESPONSES, PARTIALLY_ACCEPTED, ESCALATED, or ACCEPTED_FULFILLED
    const allRequests = await store.listRequests();
    const activeRequests = allRequests.filter((r) =>
      ["AWAITING_RESPONSES", "PARTIALLY_ACCEPTED", "ESCALATED", "ACCEPTED_FULFILLED"].includes(r.status)
    );

    let targetRequest: BloodRequestRecord | null = null;
    let targetDonorId: string | undefined = donorId;

    // Case A: Specific Request ID was extracted from message
    if (normalized.extractedRequestId) {
      const reqId = normalized.extractedRequestId;
      const found = await store.getRequest(reqId);
      if (!found) {
        return {
          success: false,
          statusCode: 404,
          intent: normalized.intent,
          duplicate: false,
          message: `Blood request '${reqId}' not found`,
          error: "request_not_found"
        };
      }

      // STRICT SAFETY VALIDATION: Validate that donor phone actually has an outreach record on this request!
      // Never trust request IDs without validating the associated notification.
      const hasValidNotification = found.notifications.some((n) => {
        if (targetDonorId && n.donorId === targetDonorId) return true;
        // Check destination phone match if donor ID not pre-resolved
        return n.destinationMasked === maskedPhone;
      });

      const matchingCandidate = found.candidates.find((c) => {
        if (targetDonorId && c.donorId === targetDonorId) return true;
        const cPhone = normalizePhoneNumber(c.rawPhone);
        return cPhone && cPhone === normalizedFromPhone;
      });

      if (!hasValidNotification || !matchingCandidate) {
        return {
          success: false,
          statusCode: 403,
          intent: normalized.intent,
          duplicate: false,
          message: `Safety violation: Sender does not have a verified outreach record for request '${reqId}'`,
          error: "unverified_outreach"
        };
      }

      targetRequest = found;
      targetDonorId = matchingCandidate.donorId;
    } else {
      // Case B: No Request ID in text — find active request where donor has a pending outreach record
      for (const r of activeRequests) {
        const matchingCandidate = r.candidates.find((c) => {
          if (targetDonorId && c.donorId === targetDonorId) return true;
          const cPhone = normalizePhoneNumber(c.rawPhone);
          return cPhone && cPhone === normalizedFromPhone;
        });

        if (matchingCandidate) {
          const hasNotif = r.notifications.some((n) => n.donorId === matchingCandidate.donorId);
          if (hasNotif) {
            targetRequest = r;
            targetDonorId = matchingCandidate.donorId;
            break;
          }
        }
      }
    }

    if (!targetRequest || !targetDonorId) {
      return {
        success: false,
        statusCode: 404,
        intent: normalized.intent,
        duplicate: false,
        message: `No active blood request with valid outreach found for sender ${maskedPhone}`,
        error: "no_matching_outreach"
      };
    }

    // ─── STEP 9: Handle UNKNOWN Intent for Matched Donor ───────────────────────
    if (normalized.intent === "UNKNOWN") {
      targetRequest.invalidResponsesCount = (targetRequest.invalidResponsesCount || 0) + 1;
      
      const logRecord: InboundWebhookRecord = {
        id: `INB-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
        timestamp: new Date().toISOString(),
        channel: inbound.channel,
        provider: inbound.provider,
        providerMessageId: inbound.providerMessageId,
        fromPhoneMasked: maskedPhone,
        rawMessage: inbound.body,
        normalizedResponse: "UNKNOWN",
        donorId: targetDonorId,
        status: "INVALID",
        error: "Unrecognized message content",
        isSimulated: false
      };

      if (!targetRequest.inboundResponses) targetRequest.inboundResponses = [];
      targetRequest.inboundResponses.push(logRecord);
      await store.saveRequest(targetRequest);

      const clarifyReply = (
        "RakshAI: We could not understand your response. " +
        `Please reply YES to accept or NO to decline blood request ${targetRequest.requestId}.`
      );

      return {
        success: false,
        statusCode: 400,
        requestId: targetRequest.requestId,
        donorId: targetDonorId,
        intent: "UNKNOWN",
        duplicate: false,
        message: "Unrecognized donor response. Clarification requested.",
        replyMessage: clarifyReply,
        error: "invalid_message_content"
      };
    }

    // ─── STEP 10: Check Duplicate Response on Candidate ───────────────────────
    const candidate = targetRequest.candidates.find((c) => c.donorId === targetDonorId);
    if (!candidate || candidate.responseStatus !== "PENDING") {
      targetRequest.duplicateWebhookCount = (targetRequest.duplicateWebhookCount || 0) + 1;
      await store.saveRequest(targetRequest);

      return {
        success: true,
        statusCode: 200,
        requestId: targetRequest.requestId,
        donorId: targetDonorId,
        intent: normalized.intent,
        duplicate: true,
        message: `Response '${candidate?.responseStatus || "RECORDED"}' already recorded for donor ${targetDonorId}`
      };
    }

    // ─── STEP 11: Execute State Transition via Coordination Engine ─────────────
    const nowIso = new Date().toISOString();
    const webhookLogRecord: InboundWebhookRecord = {
      id: `INB-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
      timestamp: nowIso,
      channel: inbound.channel,
      provider: inbound.provider,
      providerMessageId: inbound.providerMessageId,
      fromPhoneMasked: maskedPhone,
      rawMessage: inbound.body,
      normalizedResponse: normalized.intent,
      donorId: targetDonorId,
      status: "PROCESSED",
      isSimulated: false
    };

    if (!targetRequest.inboundResponses) targetRequest.inboundResponses = [];
    targetRequest.inboundResponses.push(webhookLogRecord);
    targetRequest.lastResponseAt = nowIso;

    // Record response through engine (enforcing state transition rules and audit event)
    const updated = await this.engine.recordDonorResponse(
      targetRequest.requestId,
      targetDonorId,
      normalized.intent,
      {
        userId: targetDonorId,
        role: "donor"
      },
      `Inbound ${inbound.channel} webhook from ${maskedPhone}: "${inbound.body}"`
    );

    // Update candidate channel and metadata on persisted record
    const updatedCandidate = updated.candidates.find((c) => c.donorId === targetDonorId);
    if (updatedCandidate) {
      updatedCandidate.responseChannel = inbound.channel;
      updatedCandidate.isSimulated = false;
    }
    updated.inboundResponses = targetRequest.inboundResponses;
    updated.lastResponseAt = nowIso;
    await store.saveRequest(updated);

    const replyText = (
      `Raksha AI: Thank you! Your response (${normalized.intent}) for Blood Request ` +
      `${updated.requestId} at ${updated.input.hospital} has been confirmed. ` +
      `Our care coordinator will contact you with scheduling instructions.`
    );

    return {
      success: true,
      statusCode: 200,
      requestId: updated.requestId,
      donorId: targetDonorId,
      intent: normalized.intent,
      duplicate: false,
      message: `Donor response '${normalized.intent}' processed and recorded successfully`,
      replyMessage: replyText
    };
  }
}

// Global Singleton
let _processorInstance: WebhookProcessor | null = null;
export function getWebhookProcessor(): WebhookProcessor {
  if (!_processorInstance) {
    _processorInstance = new WebhookProcessor();
  }
  return _processorInstance;
}
