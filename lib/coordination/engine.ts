/**
 * RAKSHAI DONOR COORDINATION WORKFLOW ENGINE
 * 
 * Implements the 11-stage blood request lifecycle with:
 * - Deterministic ABO & antigen clinical compatibility rules
 * - Explicit coordinator-in-the-loop review guardrails (no automated outreach without approval)
 * - Notification dispatch through pluggable provider adapter
 * - Idempotency key protection and retry policies
 * - Real-time timeout checking and automatic escalation
 * - Complete audit trail and zero PII logging
 */

import crypto from "crypto";
import type {
  RequestStatus,
  BloodRequestInput,
  DonorCandidate,
  BloodRequestRecord,
  AuditEvent,
  UrgencyLevel
} from "./types.ts";
import {
  VALID_TRANSITIONS,
  ABO_COMPATIBILITY_TABLE
} from "./types.ts";
import { CoordinationStore, getCoordinationStore } from "./store.ts";
import { NotificationDispatcher } from "./notifications/dispatcher.ts";
import { MockNotificationProvider } from "./notifications/mock-provider.ts";
import { maskPhoneNumber } from "./notifications/interface.ts";

export interface ActorContext {
  userId: string;
  role: "coordinator" | "patient" | "system" | "donor";
  email?: string;
}

// City coordinate map for distance calculation
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  hyderabad: { lat: 17.385, lon: 78.4867 },
  secunderabad: { lat: 17.4399, lon: 78.4983 },
  warangal: { lat: 17.9784, lon: 79.5941 },
  mumbai: { lat: 19.076, lon: 72.8777 },
  pune: { lat: 18.5204, lon: 73.8567 },
  bangalore: { lat: 12.9716, lon: 77.5946 },
  chennai: { lat: 13.0827, lon: 80.2707 },
  delhi: { lat: 28.7041, lon: 77.1025 },
  kolkata: { lat: 22.5726, lon: 88.3639 },
  ahmedabad: { lat: 23.0225, lon: 72.5714 },
  jaipur: { lat: 26.9124, lon: 75.7873 },
  lucknow: { lat: 26.8467, lon: 80.9462 },
  nagpur: { lat: 21.1458, lon: 79.0882 },
  visakhapatnam: { lat: 17.6868, lon: 83.2185 },
  vijayawada: { lat: 16.5062, lon: 80.648 }
};

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

export class CoordinationEngine {
  private store: CoordinationStore;
  private dispatcher: NotificationDispatcher;

  constructor(store?: CoordinationStore, dispatcher?: NotificationDispatcher) {
    this.store = store || getCoordinationStore();
    this.dispatcher =
      dispatcher ||
      new NotificationDispatcher({
        provider: new MockNotificationProvider(),
        maxRetries: 3
      });
  }

  public getDispatcher(): NotificationDispatcher {
    return this.dispatcher;
  }

  public getStore(): CoordinationStore {
    return this.store;
  }

  /**
   * Helper to validate state transitions according to the state machine
   */
  private validateTransition(from: RequestStatus, to: RequestStatus): void {
    const allowed = VALID_TRANSITIONS[from] || [];
    if (!allowed.includes(to)) {
      throw new Error(`Invalid lifecycle state transition from '${from}' to '${to}'. Allowed: [${allowed.join(", ")}]`);
    }
  }

  /**
   * Helper to create and record an audit event
   */
  private async recordAuditEvent(
    request: BloodRequestRecord,
    toStatus: RequestStatus,
    action: string,
    actor: ActorContext,
    reason?: string,
    metadata?: Record<string, any>
  ): Promise<AuditEvent> {
    const event: AuditEvent = {
      eventId: `EVT-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
      timestamp: new Date().toISOString(),
      fromStatus: request.status,
      toStatus,
      action,
      actorRole: actor.role,
      actorId: actor.userId,
      reason,
      metadata: {
        requestId: request.requestId,
        ...metadata
      }
    };

    request.status = toStatus;
    request.updatedAt = event.timestamp;
    request.auditTrail.push(event);

    await this.store.saveAuditEvent(event);
    await this.store.saveRequest(request);
    return event;
  }

  /**
   * STAGE 1 & 2: Blood Request Creation & Validation
   */
  async createRequest(input: BloodRequestInput, actor: ActorContext): Promise<BloodRequestRecord> {
    // 1. Input Validation
    if (!input.patientId || !input.patientId.trim()) {
      throw new Error("Missing required field: patientId");
    }
    if (!input.patientName || !input.patientName.trim()) {
      throw new Error("Missing required field: patientName");
    }
    if (!input.bloodGroup || !input.bloodGroup.trim()) {
      throw new Error("Missing required field: bloodGroup");
    }

    const standardBg = input.bloodGroup.trim().toUpperCase();
    if (!ABO_COMPATIBILITY_TABLE[standardBg]) {
      throw new Error(`Invalid blood group '${input.bloodGroup}'. Must be one of: ${Object.keys(ABO_COMPATIBILITY_TABLE).join(", ")}`);
    }

    if (!input.city || !input.city.trim()) {
      throw new Error("Missing required field: city");
    }
    if (!input.hospital || !input.hospital.trim()) {
      throw new Error("Missing required field: hospital");
    }

    const units = input.unitsRequired && input.unitsRequired > 0 ? input.unitsRequired : 1;
    const urgency = input.urgency || "ROUTINE";
    const now = new Date().toISOString();
    const requestId = `REQ-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    const record: BloodRequestRecord = {
      requestId,
      status: "CREATED",
      input: {
        ...input,
        bloodGroup: standardBg,
        unitsRequired: units,
        urgency
      },
      candidates: [],
      approvedCandidateIds: [],
      requiredDonors: units,
      acceptedDonorsCount: 0,
      declinedDonorsCount: 0,
      isEscalated: false,
      auditTrail: [],
      notifications: [],
      createdAt: now,
      updatedAt: now
    };

    const auditEvent: AuditEvent = {
      eventId: `EVT-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
      timestamp: now,
      fromStatus: "CREATED",
      toStatus: "CREATED",
      action: "REQUEST_CREATED",
      actorRole: actor.role,
      actorId: actor.userId,
      reason: "Blood request submitted for thalassemia care coordination",
      metadata: {
        requestId,
        urgency,
        unitsRequired: units
      }
    };
    record.auditTrail.push(auditEvent);

    await this.store.saveAuditEvent(auditEvent);
    await this.store.saveRequest(record);
    return record;
  }

  /**
   * STAGE 3 & 4: Matching Engine Invocation & Candidate Generation
   * Applies deterministic ABO compatibility, 90-day activity, antibody conflict detection, and proximity ranking.
   */
  async generateMatches(
    requestId: string,
    actor: ActorContext,
    options: { maxCandidates?: number; maxDistanceKm?: number } = {}
  ): Promise<BloodRequestRecord> {
    const request = await this.store.getRequest(requestId);
    if (!request) {
      throw new Error(`Blood request '${requestId}' not found`);
    }

    this.validateTransition(request.status, "MATCHING");
    await this.recordAuditEvent(request, "MATCHING", "MATCHING_STARTED", actor);

    const donors = await this.store.getDonors();
    const patientBlood = request.input.bloodGroup;
    const patientCity = (request.input.city || "hyderabad").toLowerCase().trim();
    const pCoords = CITY_COORDS[patientCity] || { lat: 17.385, lon: 78.4867 };
    const antibodyHistory = request.input.antibodyHistory || [];
    const maxCandidates = options.maxCandidates || 5;
    const maxDistanceKm = options.maxDistanceKm || 100;
    const refDate = new Date();

    const candidates: DonorCandidate[] = [];

    for (const d of donors) {
      const donorId = d.donorId || d.donor_id || `DNR-${Math.random().toString(36).substring(2, 7)}`;
      const donorBlood = (d.bloodType || d.bloodGroup || d.blood_group || "").trim().toUpperCase();
      const donorCity = (d.city || "").toLowerCase().trim();
      const donorCoords = CITY_COORDS[donorCity] || {
        lat: d.latitude || d.lat || 17.385,
        lon: d.longitude || d.lon || 78.4867
      };

      // 0. Hard Filter: Donor Opt-Out Status (Respect donor communication preferences)
      const donorPhone = d.phone || d.mobile || d.phoneNumber || "+919876543210";
      const isOptedOut = await this.store.isDonorOptedOut(donorId, donorPhone);
      if (isOptedOut) continue;

      // 1. Hard Filter: Major ABO Compatibility
      const compatibleBloods = ABO_COMPATIBILITY_TABLE[donorBlood] || [];
      const isAboCompatible = compatibleBloods.includes(patientBlood);
      if (!isAboCompatible) continue;

      // 2. Hard Filter: Medical Eligibility (self-reported conditions)
      const hasConditions = d.hasConditions === "yes" || d.has_conditions === true || d.hasConditions === true;
      if (hasConditions) continue;

      // 3. Proximity Distance
      const dist = haversineDistance(pCoords.lat, pCoords.lon, donorCoords.lat, donorCoords.lon);
      if (dist > maxDistanceKm) continue;

      // 4. Activity Interval (90-day minimum for whole blood)
      let daysSinceLast = 999;
      if (d.lastDonated || d.last_donation_date || d.last_donated) {
        try {
          const lastDate = new Date(d.lastDonated || d.last_donation_date || d.last_donated);
          daysSinceLast = Math.floor((refDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        } catch {
          daysSinceLast = 999;
        }
      }
      const activityStatus = daysSinceLast >= 90 ? "ACTIVE" : "INACTIVE";
      if (activityStatus === "INACTIVE") continue;

      // 5. Minor Antigen Matching (Alloimmunization Risk)
      let isAntigenCompatible = true;
      let alloimmunizationRisk: "LOW" | "MODERATE" | "HIGH" = "LOW";
      const extendedAntigens = d.extendedAntigens || d.extended_antigens || [];

      if (antibodyHistory.length > 0) {
        const conflicts = antibodyHistory.filter((ab) => extendedAntigens.includes(ab));
        if (conflicts.length > 0) {
          isAntigenCompatible = false;
          alloimmunizationRisk = "HIGH";
        } else if (antibodyHistory.includes("Kell") && !extendedAntigens.includes("K-")) {
          alloimmunizationRisk = "MODERATE";
        }
      }

      // 6. Deterministic Composite Score (0 - 100)
      // 40% ABO match, 30% Distance, 20% Activity Recency, 10% Antigen Safety
      let distanceScore = Math.max(0, 100 - dist);
      let antigenScore = alloimmunizationRisk === "LOW" ? 100 : alloimmunizationRisk === "MODERATE" ? 60 : 20;
      let activityScore = Math.min(100, Math.floor(daysSinceLast / 3));
      let compositeScore = Math.round(0.4 * 100 + 0.3 * distanceScore + 0.2 * activityScore + 0.1 * antigenScore);

      const donorName = `${d.firstName || ""} ${d.lastName || ""}`.trim() || d.donor_name || "Anonymous Donor";
      const rawPhone = d.phone || d.mobile || "+919876543210";

      candidates.push({
        donorId,
        donorName,
        bloodGroup: donorBlood,
        city: d.city || "Hyderabad",
        distanceKm: dist,
        isAboCompatible,
        isAntigenCompatible,
        alloimmunizationRisk,
        compositeScore,
        daysSinceLastDonation: daysSinceLast,
        activityStatus,
        selectedForOutreach: false,
        responseStatus: "PENDING",
        rawPhone
      });
    }

    // Sort descending by compositeScore
    candidates.sort((a, b) => b.compositeScore - a.compositeScore);
    request.candidates = candidates.slice(0, maxCandidates);

    this.validateTransition(request.status, "PENDING_COORDINATOR_REVIEW");
    await this.recordAuditEvent(
      request,
      "PENDING_COORDINATOR_REVIEW",
      "MATCHES_GENERATED",
      actor,
      `Generated ${request.candidates.length} compatible candidates for coordinator review`,
      { candidatesCount: request.candidates.length }
    );

    return request;
  }

  /**
   * STAGE 5 & 6: Coordinator Review & Explicit Human Approval
   * Prevents automated outreach without human authorization.
   */
  async coordinatorReview(
    requestId: string,
    action: "APPROVE" | "REJECT",
    actor: ActorContext,
    options: { selectedDonorIds?: string[]; rejectionReason?: string; coordinatorNotes?: string } = {}
  ): Promise<BloodRequestRecord> {
    const request = await this.store.getRequest(requestId);
    if (!request) {
      throw new Error(`Blood request '${requestId}' not found`);
    }

    // Explicit Authorization Guard: ONLY coordinators can approve outreach
    if (actor.role !== "coordinator") {
      throw new Error(`Unauthorized: Human coordinator authorization is strictly required for candidate review (role: ${actor.role})`);
    }

    if (request.status !== "PENDING_COORDINATOR_REVIEW") {
      throw new Error(`Cannot review request in state '${request.status}'. Expected 'PENDING_COORDINATOR_REVIEW'`);
    }

    if (action === "REJECT") {
      this.validateTransition(request.status, "COORDINATOR_REJECTED");
      await this.recordAuditEvent(
        request,
        "COORDINATOR_REJECTED",
        "COORDINATOR_REJECTED",
        actor,
        options.rejectionReason || "Coordinator requested alternative candidate selection",
        { notes: options.coordinatorNotes }
      );
      return request;
    }

    // Action is APPROVE
    const selectedIds = options.selectedDonorIds && options.selectedDonorIds.length > 0
      ? options.selectedDonorIds
      : request.candidates.map((c) => c.donorId);

    // Validate that selected donors exist among the matched candidates and are compatible
    const validCandidateIds = new Set(request.candidates.map((c) => c.donorId));
    const approvedList: string[] = [];

    for (const dId of selectedIds) {
      if (!validCandidateIds.has(dId)) {
        throw new Error(`Selected donor ID '${dId}' is not among the evaluated candidates for this request`);
      }
      const candidate = request.candidates.find((c) => c.donorId === dId)!;
      if (!candidate.isAboCompatible) {
        throw new Error(`Clinical Safety Violation: Donor '${dId}' is ABO incompatible with patient '${request.input.bloodGroup}'`);
      }
      candidate.selectedForOutreach = true;
      approvedList.push(dId);
    }

    if (approvedList.length === 0) {
      throw new Error("Coordinator must approve at least one compatible donor for outreach");
    }

    request.approvedCandidateIds = approvedList;

    this.validateTransition(request.status, "COORDINATOR_APPROVED");
    await this.recordAuditEvent(
      request,
      "COORDINATOR_APPROVED",
      "COORDINATOR_APPROVED",
      actor,
      options.coordinatorNotes || `Coordinator approved ${approvedList.length} donors for outreach`,
      { approvedCount: approvedList.length, approvedDonorIds: approvedList }
    );

    return request;
  }

  /**
   * STAGE 7: Donor Notification Dispatch
   * Requires prior coordinator approval; enforces cryptographic idempotency keys.
   */
  async dispatchOutreach(
    requestId: string,
    actor: ActorContext,
    idempotencyKey?: string
  ): Promise<BloodRequestRecord> {
    const request = await this.store.getRequest(requestId);
    if (!request) {
      throw new Error(`Blood request '${requestId}' not found`);
    }

    // 1. Idempotency protection: If this exact key was already dispatched, return existing record
    const dispatchKey = idempotencyKey || `IDEMP-OUTREACH-${requestId}`;
    if (
      this.dispatcher.hasExecuted(dispatchKey) ||
      (request.outreachDispatchedAt && request.auditTrail.some((e) => e.metadata?.idempotencyKey === dispatchKey))
    ) {
      return request; // Idempotent return without duplicate notifications
    }

    // 2. Safety Gate: Initial outreach requires explicit coordinator approval!
    if (request.status !== "COORDINATOR_APPROVED") {
      throw new Error(
        `Safety Violation: Automated outreach is forbidden without explicit coordinator approval (current status: '${request.status}')`
      );
    }

    this.validateTransition(request.status, "OUTREACH_IN_PROGRESS");
    await this.recordAuditEvent(request, "OUTREACH_IN_PROGRESS", "OUTREACH_STARTED", actor, undefined, {
      idempotencyKey: dispatchKey
    });

    const approvedCandidates = request.candidates.filter((c) =>
      request.approvedCandidateIds.includes(c.donorId)
    );

    // Verify no approved donor has opted out
    for (const candidate of approvedCandidates) {
      const isOptedOut = await this.store.isDonorOptedOut(candidate.donorId, candidate.rawPhone);
      if (isOptedOut) {
        throw new Error(`Safety Violation: Cannot dispatch outreach to opted-out donor '${candidate.donorId}'`);
      }
    }

    const now = new Date();
    const sentRecords = [];

    for (const candidate of approvedCandidates) {
      const notifId = `NOTIF-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      const candidateIdempKey = `${dispatchKey}-${candidate.donorId}`;

      const messageBody = (
        `[Raksha AI Emergency Match] Urgent blood donation request. ` +
        `Patient requires ${request.input.bloodGroup} at ${request.input.hospital}, ${request.input.city}. ` +
        `Ref ID: ${request.requestId}. Please reply YES to accept or NO to decline.`
      );

      const notifRecord = await this.dispatcher.dispatch({
        notificationId: notifId,
        idempotencyKey: candidateIdempKey,
        requestId: request.requestId,
        donorId: candidate.donorId,
        donorPhone: candidate.rawPhone || "+919876543210",
        channel: "SMS",
        message: messageBody,
        metadata: {
          urgency: request.input.urgency,
          bloodGroup: request.input.bloodGroup
        }
      });

      request.notifications.push(notifRecord);
      sentRecords.push(notifRecord);
    }

    // Calculate response deadline based on urgency:
    // CRITICAL: 30 mins | URGENT: 2 hours | ROUTINE: 24 hours
    const urgency = request.input.urgency || "ROUTINE";
    const deadlineMinutes = urgency === "CRITICAL" ? 30 : urgency === "URGENT" ? 120 : 1440;
    const deadline = new Date(now.getTime() + deadlineMinutes * 60 * 1000).toISOString();

    request.outreachDispatchedAt = now.toISOString();
    request.responseDeadline = deadline;

    this.validateTransition(request.status, "AWAITING_RESPONSES");
    await this.recordAuditEvent(
      request,
      "AWAITING_RESPONSES",
      "OUTREACH_DISPATCHED",
      actor,
      `Dispatched notifications to ${approvedCandidates.length} approved donors`,
      {
        dispatchedCount: approvedCandidates.length,
        responseDeadline: deadline,
        idempotencyKey: dispatchKey
      }
    );

    this.dispatcher.recordIdempotency(dispatchKey);

    return request;
  }

  /**
   * STAGE 8: Donor Response Recording (Accept, Decline)
   */
  async recordDonorResponse(
    requestId: string,
    donorId: string,
    response: "ACCEPTED" | "DECLINED" | "OPTED_OUT",
    actor: ActorContext,
    optionsOrNotes?: string | {
      notes?: string;
      channel?: "SMS" | "WHATSAPP" | "SIMULATED" | "PORTAL";
      isSimulated?: boolean;
    }
  ): Promise<BloodRequestRecord> {
    const request = await this.store.getRequest(requestId);
    if (!request) {
      throw new Error(`Blood request '${requestId}' not found`);
    }

    const validStates: RequestStatus[] = ["AWAITING_RESPONSES", "PARTIALLY_ACCEPTED", "ESCALATED"];
    if (!validStates.includes(request.status)) {
      throw new Error(`Cannot record donor response in status '${request.status}'`);
    }

    const candidate = request.candidates.find((c) => c.donorId === donorId);
    if (!candidate) {
      throw new Error(`Donor '${donorId}' is not associated with request '${requestId}'`);
    }

    if (candidate.responseStatus !== "PENDING") {
      request.duplicateWebhookCount = (request.duplicateWebhookCount || 0) + 1;
      await this.store.saveRequest(request);
      return request; // Response already recorded idempotently
    }

    const notes = typeof optionsOrNotes === "string" ? optionsOrNotes : optionsOrNotes?.notes;
    const channel = typeof optionsOrNotes === "object" ? optionsOrNotes.channel : undefined;
    const isSimulated = typeof optionsOrNotes === "object" ? optionsOrNotes.isSimulated : (channel === "SIMULATED");

    const now = new Date().toISOString();
    candidate.responseStatus = response;
    candidate.respondedAt = now;
    candidate.responseChannel = channel || "SMS";
    candidate.isSimulated = isSimulated !== undefined ? isSimulated : false;

    request.lastResponseAt = now;

    if (response === "ACCEPTED") {
      request.acceptedDonorsCount++;
    } else {
      request.declinedDonorsCount++;
    }

    let nextStatus: RequestStatus = request.status;

    if (request.acceptedDonorsCount >= request.requiredDonors) {
      nextStatus = "ACCEPTED_FULFILLED";
    } else if (request.acceptedDonorsCount > 0) {
      nextStatus = "PARTIALLY_ACCEPTED";
    }

    const action = response === "ACCEPTED" ? "DONOR_ACCEPTED" : response === "OPTED_OUT" ? "DONOR_OPTED_OUT" : "DONOR_DECLINED";

    if (nextStatus !== request.status) {
      this.validateTransition(request.status, nextStatus);
    }

    await this.recordAuditEvent(
      request,
      nextStatus,
      action,
      actor,
      notes || `Donor ${candidate.donorId} ${response.toLowerCase()} the request`,
      {
        donorId: candidate.donorId,
        donorNameMasked: candidate.donorName ? candidate.donorName[0] + "***" : "Anonymous",
        acceptedCount: request.acceptedDonorsCount,
        requiredCount: request.requiredDonors,
        channel: candidate.responseChannel,
        isSimulated: candidate.isSimulated
      }
    );

    return request;
  }

  /**
   * STAGE 9 & 10: Timeout Handling & Escalation
   */
  async checkTimeoutAndEscalate(
    requestId: string,
    actor: ActorContext,
    options: { forceEscalate?: boolean; customReason?: string } = {}
  ): Promise<BloodRequestRecord> {
    const request = await this.store.getRequest(requestId);
    if (!request) {
      throw new Error(`Blood request '${requestId}' not found`);
    }

    const validStates: RequestStatus[] = ["AWAITING_RESPONSES", "PARTIALLY_ACCEPTED"];
    if (!validStates.includes(request.status)) {
      return request;
    }

    const now = new Date();
    const isTimedOut =
      request.responseDeadline && new Date(request.responseDeadline).getTime() <= now.getTime();

    if (!isTimedOut && !options.forceEscalate) {
      return request; // Not timed out yet
    }

    if (request.acceptedDonorsCount >= request.requiredDonors) {
      return request; // Already fulfilled
    }

    // Trigger escalation
    const reason =
      options.customReason ||
      `Response deadline expired with insufficient donors (accepted: ${request.acceptedDonorsCount}/${request.requiredDonors})`;

    request.isEscalated = true;
    request.escalationReason = reason;
    request.escalatedAt = now.toISOString();

    this.validateTransition(request.status, "ESCALATED");
    await this.recordAuditEvent(request, "ESCALATED", "REQUEST_ESCALATED", actor, reason, {
      acceptedCount: request.acceptedDonorsCount,
      requiredCount: request.requiredDonors,
      deadline: request.responseDeadline
    });

    return request;
  }

  /**
   * STAGE 11: Request Completion or Cancellation
   */
  async completeRequest(
    requestId: string,
    actor: ActorContext,
    completionNotes?: string
  ): Promise<BloodRequestRecord> {
    const request = await this.store.getRequest(requestId);
    if (!request) {
      throw new Error(`Blood request '${requestId}' not found`);
    }

    const completableStates: RequestStatus[] = ["ACCEPTED_FULFILLED", "ESCALATED"];
    if (!completableStates.includes(request.status)) {
      throw new Error(`Cannot complete request in state '${request.status}'. Must be 'ACCEPTED_FULFILLED' or 'ESCALATED'`);
    }

    this.validateTransition(request.status, "COMPLETED");
    await this.recordAuditEvent(
      request,
      "COMPLETED",
      "REQUEST_COMPLETED",
      actor,
      completionNotes || "Blood transfusion scheduled and donor coordination completed successfully"
    );

    return request;
  }

  async cancelRequest(
    requestId: string,
    actor: ActorContext,
    reason?: string
  ): Promise<BloodRequestRecord> {
    const request = await this.store.getRequest(requestId);
    if (!request) {
      throw new Error(`Blood request '${requestId}' not found`);
    }

    if (request.status === "COMPLETED" || request.status === "CANCELLED") {
      throw new Error(`Cannot cancel a request that is already '${request.status}'`);
    }

    this.validateTransition(request.status, "CANCELLED");
    await this.recordAuditEvent(
      request,
      "CANCELLED",
      "REQUEST_CANCELLED",
      actor,
      reason || "Request cancelled by user or coordinator"
    );

    return request;
  }
}

// Global Singleton instance
let _engineInstance: CoordinationEngine | null = null;
export function getCoordinationEngine(): CoordinationEngine {
  if (!_engineInstance) {
    _engineInstance = new CoordinationEngine();
  }
  return _engineInstance;
}
