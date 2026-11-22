/**
 * RAKSHAI BLOOD REQUEST COORDINATION WORKFLOW - TYPES & CONTRACTS
 * 
 * Strict lifecycle states, valid state transitions, audit event definitions,
 * and notification interfaces for care-coordination and donor outreach.
 */

export type RequestStatus =
  | "CREATED"
  | "MATCHING"
  | "PENDING_COORDINATOR_REVIEW"
  | "COORDINATOR_APPROVED"
  | "COORDINATOR_REJECTED"
  | "OUTREACH_PENDING"
  | "OUTREACH_IN_PROGRESS"
  | "AWAITING_RESPONSES"
  | "PARTIALLY_ACCEPTED"
  | "ACCEPTED_FULFILLED"
  | "ESCALATED"
  | "COMPLETED"
  | "CANCELLED";

export type DonorResponseStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "TIMED_OUT"
  | "OPTED_OUT";

export type NotificationChannel = "SMS" | "WHATSAPP" | "EMAIL";

export type NotificationDeliveryStatus =
  | "PENDING"
  | "SENT"
  | "DELIVERED"
  | "FAILED"
  | "RETRYING";

export type UrgencyLevel = "ROUTINE" | "URGENT" | "CRITICAL";

export interface BloodRequestInput {
  patientId: string;
  patientName: string;
  bloodGroup: string;
  city: string;
  latitude?: number;
  longitude?: number;
  unitsRequired?: number;
  urgency?: UrgencyLevel;
  diagnosis?: string;
  hospital: string;
  hematologist?: string;
  antibodyHistory?: string[];
  targetTransfusionDate?: string;
}

export interface DonorCandidate {
  donorId: string;
  donorName: string; // Redacted when logged or exposed to non-coordinators
  bloodGroup: string;
  city: string;
  distanceKm: number;
  isAboCompatible: boolean;
  isAntigenCompatible: boolean;
  alloimmunizationRisk: "LOW" | "MODERATE" | "HIGH";
  compositeScore: number; // 0 - 100
  daysSinceLastDonation: number;
  activityStatus: "ACTIVE" | "INACTIVE";
  selectedForOutreach: boolean;
  responseStatus: DonorResponseStatus;
  respondedAt?: string;
  rawPhone?: string; // Stored securely server-side only
  responseChannel?: "SMS" | "WHATSAPP" | "SIMULATED" | "PORTAL";
  isSimulated?: boolean;
}

export interface AuditEvent {
  eventId: string;
  timestamp: string; // ISO 8601
  fromStatus: RequestStatus;
  toStatus: RequestStatus;
  action: string;
  actorRole: "coordinator" | "patient" | "system" | "donor";
  actorId: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface NotificationRecord {
  notificationId: string;
  idempotencyKey: string;
  requestId: string;
  donorId: string;
  channel: NotificationChannel;
  destinationMasked: string; // e.g. "+91 98*** **321" (never raw PII)
  messageBody: string;
  deliveryStatus: NotificationDeliveryStatus;
  sentAt: string;
  deliveredAt?: string;
  retryCount: number;
  maxRetries: number;
  provider: "mock" | "aws_sns";
  providerMessageId?: string;
  error?: string;
}

export interface InboundWebhookRecord {
  id: string;
  timestamp: string;
  channel: "SMS" | "WHATSAPP";
  provider: string;
  providerMessageId: string;
  fromPhoneMasked: string;
  rawMessage: string;
  normalizedResponse: "ACCEPTED" | "DECLINED" | "HELP" | "OPT_OUT" | "UNKNOWN";
  donorId?: string;
  status: "PROCESSED" | "IGNORED_DUPLICATE" | "INVALID" | "REJECTED_UNMATCHED";
  error?: string;
  isSimulated?: boolean;
}

export interface DonorOptOutRecord {
  donorId?: string;
  phoneNormalized: string;
  phoneMasked: string;
  optedOutAt: string; // ISO 8601
  channel: "SMS" | "WHATSAPP" | "SYSTEM";
  reason?: string;
}

export interface BloodRequestRecord {
  requestId: string;
  status: RequestStatus;
  input: BloodRequestInput;
  candidates: DonorCandidate[];
  approvedCandidateIds: string[];
  requiredDonors: number;
  acceptedDonorsCount: number;
  declinedDonorsCount: number;
  outreachDispatchedAt?: string;
  responseDeadline?: string;
  isEscalated: boolean;
  escalationReason?: string;
  escalatedAt?: string;
  auditTrail: AuditEvent[];
  notifications: NotificationRecord[];
  inboundResponses?: InboundWebhookRecord[];
  lastResponseAt?: string;
  invalidResponsesCount?: number;
  duplicateWebhookCount?: number;
  createdAt: string;
  updatedAt: string;
}

export const AuditEvent = {};
export const BloodRequestRecord = {};
export const DonorCandidate = {};
export const BloodRequestInput = {};
export const NotificationRecord = {};
export const InboundWebhookRecord = {};
export const RequestStatus = {};
export const DonorResponseStatus = {};
export const NotificationChannel = {};
export const NotificationDeliveryStatus = {};
export const UrgencyLevel = {};

/**
 * Deterministic Lifecycle State Transition Matrix
 * Guarantees no illegal skips or invalid backward jumps.
 */
export const VALID_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  CREATED: ["MATCHING", "CANCELLED"],
  MATCHING: ["PENDING_COORDINATOR_REVIEW", "CANCELLED"],
  PENDING_COORDINATOR_REVIEW: [
    "COORDINATOR_APPROVED",
    "COORDINATOR_REJECTED",
    "MATCHING",
    "CANCELLED"
  ],
  COORDINATOR_APPROVED: ["OUTREACH_PENDING", "OUTREACH_IN_PROGRESS", "CANCELLED"],
  COORDINATOR_REJECTED: ["MATCHING", "CANCELLED"],
  OUTREACH_PENDING: ["OUTREACH_IN_PROGRESS", "CANCELLED"],
  OUTREACH_IN_PROGRESS: ["AWAITING_RESPONSES", "CANCELLED"],
  AWAITING_RESPONSES: [
    "PARTIALLY_ACCEPTED",
    "ACCEPTED_FULFILLED",
    "ESCALATED",
    "CANCELLED"
  ],
  PARTIALLY_ACCEPTED: ["ACCEPTED_FULFILLED", "ESCALATED", "CANCELLED"],
  ACCEPTED_FULFILLED: ["COMPLETED", "CANCELLED"],
  ESCALATED: ["ACCEPTED_FULFILLED", "COMPLETED", "MATCHING", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: []
};

/**
 * Standard ABO compatibility table for RBC transfusion.
 */
export const ABO_COMPATIBILITY_TABLE: Record<string, string[]> = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"]
};
