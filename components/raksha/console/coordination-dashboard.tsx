"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  Users,
  Search,
  Filter,
  RefreshCw,
  Send,
  Plus,
  ChevronRight,
  Eye,
  Phone,
  MapPin,
  Heart,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  FileText,
  Check,
  X,
  ArrowRight,
  Lock,
  Calendar,
  Building,
  UserCheck,
  MessageSquare,
  Radio,
  Smartphone
} from "lucide-react";

// ─── TYPES & INTERFACES ────────────────────────────────────────────────────────

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

export type UrgencyLevel = "ROUTINE" | "URGENT" | "CRITICAL";

export interface DonorCandidate {
  donorId: string;
  donorName: string;
  bloodGroup: string;
  city: string;
  distanceKm: number;
  isAboCompatible: boolean;
  isAntigenCompatible: boolean;
  alloimmunizationRisk: "LOW" | "MODERATE" | "HIGH";
  compositeScore: number;
  daysSinceLastDonation: number;
  activityStatus: "ACTIVE" | "INACTIVE";
  selectedForOutreach: boolean;
  responseStatus: "PENDING" | "ACCEPTED" | "DECLINED" | "TIMED_OUT";
  respondedAt?: string;
  rawPhone?: string;
  responseChannel?: "SMS" | "WHATSAPP" | "SIMULATED" | "PORTAL";
  isSimulated?: boolean;
}

export interface InboundWebhookRecord {
  id: string;
  timestamp: string;
  channel: "SMS" | "WHATSAPP";
  provider: string;
  providerMessageId: string;
  fromPhoneMasked: string;
  rawMessage: string;
  normalizedResponse: "ACCEPTED" | "DECLINED" | "HELP" | "UNKNOWN";
  donorId?: string;
  status: "PROCESSED" | "IGNORED_DUPLICATE" | "INVALID" | "REJECTED_UNMATCHED";
  error?: string;
  isSimulated?: boolean;
}

export interface AuditEvent {
  eventId: string;
  timestamp: string;
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
  channel: "SMS" | "WHATSAPP" | "EMAIL";
  destinationMasked: string;
  messageBody: string;
  deliveryStatus: "PENDING" | "SENT" | "DELIVERED" | "FAILED" | "RETRYING";
  sentAt: string;
  deliveredAt?: string;
  retryCount: number;
  maxRetries: number;
  provider: "mock" | "aws_sns";
}

export interface BloodRequestRecord {
  requestId: string;
  status: RequestStatus;
  input: {
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
  };
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

import {
  maskPhoneNumber,
  formatDateTime,
  getStatusBadge,
  getUrgencyBadge,
} from "@/lib/coordination/ui-helpers";

export { maskPhoneNumber, formatDateTime, getStatusBadge, getUrgencyBadge };

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function CoordinationDashboard() {
  // State
  const [requests, setRequests] = useState<BloodRequestRecord[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<BloodRequestRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("ALL");
  const [bloodGroupFilter, setBloodGroupFilter] = useState<string>("ALL");

  // Candidate Selection for Approval
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [reviewNotes, setReviewNotes] = useState("");

  // Modals & Confirmation Dialogs
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isOutreachDialogOpen, setIsOutreachDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Create Form State
  const [newRequestForm, setNewRequestForm] = useState({
    patientId: "",
    patientName: "",
    bloodGroup: "B+",
    hospital: "",
    city: "Bengaluru",
    unitsRequired: 1,
    urgency: "URGENT" as UrgencyLevel,
    diagnosis: "Thalassemia Major",
    hematologist: "",
  });

  // ─── DATA FETCHING ──────────────────────────────────────────────────────────

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/coordination/requests", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests(data.requests || []);
        if (selectedRequestId) {
          const updated = (data.requests || []).find((r: BloodRequestRecord) => r.requestId === selectedRequestId);
          if (updated) setSelectedRequest(updated);
        } else if (data.requests?.length > 0) {
          setSelectedRequestId(data.requests[0].requestId);
          setSelectedRequest(data.requests[0]);
        }
      } else {
        setError(data.error || "Failed to load blood requests");
      }
    } catch (err: any) {
      setError(err.message || "Network error loading blood requests");
    } finally {
      setLoading(false);
    }
  }, [selectedRequestId]);

  const fetchRequestDetails = useCallback(async (requestId: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/coordination/requests/${requestId}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedRequest(data.request);
        // Sync selected candidate IDs
        const preselected = new Set<string>();
        if (data.request.approvedCandidateIds?.length > 0) {
          data.request.approvedCandidateIds.forEach((id: string) => preselected.add(id));
        } else if (data.request.candidates?.length > 0) {
          // By default preselect compatible candidates
          data.request.candidates
            .filter((c: DonorCandidate) => c.isAboCompatible)
            .forEach((c: DonorCandidate) => preselected.add(c.donorId));
        }
        setSelectedCandidates(preselected);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch request details");
    } finally {
      setActionLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (selectedRequestId) {
      fetchRequestDetails(selectedRequestId);
    }
  }, [selectedRequestId, fetchRequestDetails]);

  // ─── COMPUTED OVERVIEW METRICS ──────────────────────────────────────────────

  const metrics = useMemo(() => {
    const total = requests.length;
    const created = requests.filter((r) => r.status === "CREATED").length;
    const awaitingReview = requests.filter(
      (r) => r.status === "PENDING_COORDINATOR_REVIEW" || r.status === "MATCHING"
    ).length;
    const approvedAwaitingOutreach = requests.filter(
      (r) => r.status === "COORDINATOR_APPROVED" || r.status === "OUTREACH_PENDING"
    ).length;
    const activeOutreach = requests.filter((r) => r.status === "OUTREACH_IN_PROGRESS").length;
    const awaitingResponses = requests.filter(
      (r) => r.status === "AWAITING_RESPONSES" || r.status === "PARTIALLY_ACCEPTED"
    ).length;
    const escalated = requests.filter((r) => r.status === "ESCALATED" || r.isEscalated).length;
    const fulfilled = requests.filter(
      (r) => r.status === "ACCEPTED_FULFILLED" || r.status === "COMPLETED"
    ).length;
    const cancelled = requests.filter(
      (r) => r.status === "CANCELLED" || r.status === "COORDINATOR_REJECTED"
    ).length;

    return {
      total,
      created,
      awaitingReview,
      approvedAwaitingOutreach,
      activeOutreach,
      awaitingResponses,
      escalated,
      fulfilled,
      cancelled,
    };
  }, [requests]);

  // ─── FILTERED REQUESTS ──────────────────────────────────────────────────────

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = r.requestId.toLowerCase().includes(q);
        const matchesPatient = r.input.patientName.toLowerCase().includes(q);
        const matchesHospital = r.input.hospital.toLowerCase().includes(q);
        const matchesCity = r.input.city.toLowerCase().includes(q);
        if (!matchesId && !matchesPatient && !matchesHospital && !matchesCity) return false;
      }
      // Status
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      // Urgency
      if (urgencyFilter !== "ALL" && r.input.urgency !== urgencyFilter) return false;
      // Blood Group
      if (bloodGroupFilter !== "ALL" && r.input.bloodGroup !== bloodGroupFilter) return false;

      return true;
    });
  }, [requests, searchQuery, statusFilter, urgencyFilter, bloodGroupFilter]);

  // ─── ACTION HANDLERS ────────────────────────────────────────────────────────

  const showNotification = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => setSuccessNotice(null), 5000);
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequestForm.patientName || !newRequestForm.hospital || !newRequestForm.city) {
      setError("Please fill all required fields");
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      const res = await fetch("/api/coordination/requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newRequestForm,
          patientId: newRequestForm.patientId || `PT-${Math.floor(1000 + Math.random() * 9000)}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`Blood request ${data.request.requestId} created successfully`);
        setIsCreateModalOpen(false);
        // Refresh and select
        await fetchRequests();
        setSelectedRequestId(data.request.requestId);
        setSelectedRequest(data.request);
      } else {
        setError(data.error || "Failed to create request");
      }
    } catch (err: any) {
      setError(err.message || "Network error creating request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunMatching = async () => {
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      setError(null);
      const res = await fetch(`/api/coordination/requests/${selectedRequest.requestId}/matches`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxCandidates: 10, radiusKm: 25 }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`Matched ${data.candidatesCount} compatible donor candidates`);
        await fetchRequestDetails(selectedRequest.requestId);
        await fetchRequests();
      } else {
        setError(data.error || "Failed to match donor candidates");
      }
    } catch (err: any) {
      setError(err.message || "Network error running matching engine");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveCandidates = async () => {
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      setError(null);
      const res = await fetch(`/api/coordination/requests/${selectedRequest.requestId}/review`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE",
          reviewNotes: reviewNotes || "Coordinator approved candidate pool for outreach",
          selectedCandidateIds: Array.from(selectedCandidates),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("Candidates successfully approved. Ready for human-authorized outreach dispatch.");
        setIsApproveDialogOpen(false);
        setReviewNotes("");
        await fetchRequestDetails(selectedRequest.requestId);
        await fetchRequests();
      } else {
        setError(data.error || "Failed to approve candidates");
      }
    } catch (err: any) {
      setError(err.message || "Network error approving candidates");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectCandidates = async () => {
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      setError(null);
      const res = await fetch(`/api/coordination/requests/${selectedRequest.requestId}/review`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REJECT",
          reviewNotes: rejectReason || "Coordinator rejected candidate pool; re-matching required",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("Candidate pool rejected. You can re-run matching with updated parameters.");
        setIsRejectDialogOpen(false);
        setRejectReason("");
        await fetchRequestDetails(selectedRequest.requestId);
        await fetchRequests();
      } else {
        setError(data.error || "Failed to reject candidates");
      }
    } catch (err: any) {
      setError(err.message || "Network error rejecting candidates");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatchOutreach = async () => {
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      setError(null);
      const idempotencyKey = `outreach-${selectedRequest.requestId}-${Date.now()}`;
      const candidateIds = Array.from(selectedCandidates);

      const res = await fetch(`/api/coordination/requests/${selectedRequest.requestId}/outreach`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          candidateIds: candidateIds.length > 0 ? candidateIds : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`Outreach dispatched successfully to ${data.notificationsDispatched} donors`);
        setIsOutreachDialogOpen(false);
        await fetchRequestDetails(selectedRequest.requestId);
        await fetchRequests();
      } else {
        setError(data.error || "Failed to dispatch outreach");
      }
    } catch (err: any) {
      setError(err.message || "Network error dispatching outreach");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordResponse = async (donorId: string, response: "ACCEPTED" | "DECLINED") => {
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      setError(null);
      const res = await fetch(`/api/coordination/requests/${selectedRequest.requestId}/respond`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorId,
          response,
          notes: `Recorded via Coordinator Console test panel: Donor ${response}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`Response recorded: Donor ${donorId} marked as ${response}`);
        await fetchRequestDetails(selectedRequest.requestId);
        await fetchRequests();
      } else {
        setError(data.error || "Failed to record response");
      }
    } catch (err: any) {
      setError(err.message || "Network error recording donor response");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerEscalation = async () => {
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      setError(null);
      const res = await fetch(`/api/coordination/requests/${selectedRequest.requestId}/escalate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.escalated) {
          showNotification(`Request escalated! Reason: ${data.message}`);
        } else {
          showNotification(data.message || "SLA checked: Request within acceptable window");
        }
        await fetchRequestDetails(selectedRequest.requestId);
        await fetchRequests();
      } else {
        setError(data.error || "Failed to check SLA escalation");
      }
    } catch (err: any) {
      setError(err.message || "Network error evaluating escalation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteRequest = async () => {
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      setError(null);
      const res = await fetch(`/api/coordination/requests/${selectedRequest.requestId}/complete`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completionNotes: "Coordinator marked blood request fulfilled and completed" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("Blood request marked as COMPLETED");
        await fetchRequestDetails(selectedRequest.requestId);
        await fetchRequests();
      } else {
        setError(data.error || "Failed to complete request");
      }
    } catch (err: any) {
      setError(err.message || "Network error completing request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!selectedRequest) return;
    const reason = prompt("Enter cancellation reason:", "Donor requirements no longer active");
    if (!reason) return;
    try {
      setActionLoading(true);
      setError(null);
      const res = await fetch(`/api/coordination/requests/${selectedRequest.requestId}/cancel`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelReason: reason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("Blood request CANCELLED");
        await fetchRequestDetails(selectedRequest.requestId);
        await fetchRequests();
      } else {
        setError(data.error || "Failed to cancel request");
      }
    } catch (err: any) {
      setError(err.message || "Network error cancelling request");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleCandidateSelection = (donorId: string) => {
    setSelectedCandidates((prev) => {
      const next = new Set(prev);
      if (next.has(donorId)) {
        next.delete(donorId);
      } else {
        next.add(donorId);
      }
      return next;
    });
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 text-raksha-white animate-fade-in">
      {/* Alert / Notification Banners */}
      {error && (
        <div className="bg-rose-950/60 border border-rose-500/50 p-4 rounded-xl flex items-center justify-between text-rose-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successNotice && (
        <div className="bg-emerald-950/60 border border-emerald-500/50 p-4 rounded-xl flex items-center justify-between text-emerald-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-medium">{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── SECTION 1: OVERVIEW METRIC CARDS ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total */}
        <div
          onClick={() => setStatusFilter("ALL")}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            statusFilter === "ALL"
              ? "bg-raksha-navy border-raksha-teal shadow-lg shadow-raksha-teal/10"
              : "bg-raksha-navy/40 border-raksha-wine/20 hover:border-raksha-wine/50"
          }`}
        >
          <div className="flex justify-between items-center text-xs text-raksha-muted uppercase font-sans tracking-wider">
            <span>Total Requests</span>
            <Activity className="w-4 h-4 text-raksha-teal" />
          </div>
          <p className="text-2xl font-bold font-mono text-raksha-white mt-1">{metrics.total}</p>
          <span className="text-[10px] text-raksha-muted block mt-0.5">All registered cases</span>
        </div>

        {/* Newly Created */}
        <div
          onClick={() => setStatusFilter("CREATED")}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            statusFilter === "CREATED"
              ? "bg-raksha-navy border-blue-500 shadow-lg shadow-blue-500/10"
              : "bg-raksha-navy/40 border-raksha-wine/20 hover:border-blue-500/40"
          }`}
        >
          <div className="flex justify-between items-center text-xs text-blue-400 uppercase font-sans tracking-wider">
            <span>New Created</span>
            <Plus className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-blue-300 mt-1">{metrics.created}</p>
          <span className="text-[10px] text-raksha-muted block mt-0.5">Awaiting matching</span>
        </div>

        {/* Awaiting Review */}
        <div
          onClick={() => setStatusFilter("PENDING_COORDINATOR_REVIEW")}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            statusFilter === "PENDING_COORDINATOR_REVIEW"
              ? "bg-raksha-navy border-amber-500 shadow-lg shadow-amber-500/10"
              : "bg-raksha-navy/40 border-raksha-wine/20 hover:border-amber-500/40"
          }`}
        >
          <div className="flex justify-between items-center text-xs text-amber-400 uppercase font-sans tracking-wider">
            <span>Needs Review</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-300 mt-1">{metrics.awaitingReview}</p>
          <span className="text-[10px] text-raksha-muted block mt-0.5">Human approval gate</span>
        </div>

        {/* Approved Pending Outreach */}
        <div
          onClick={() => setStatusFilter("COORDINATOR_APPROVED")}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            statusFilter === "COORDINATOR_APPROVED"
              ? "bg-raksha-navy border-cyan-500 shadow-lg shadow-cyan-500/10"
              : "bg-raksha-navy/40 border-raksha-wine/20 hover:border-cyan-500/40"
          }`}
        >
          <div className="flex justify-between items-center text-xs text-cyan-400 uppercase font-sans tracking-wider">
            <span>Ready for Outreach</span>
            <Send className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-cyan-300 mt-1">{metrics.approvedAwaitingOutreach}</p>
          <span className="text-[10px] text-raksha-muted block mt-0.5">Approved candidates</span>
        </div>

        {/* Active Outreach */}
        <div
          onClick={() => setStatusFilter("OUTREACH_IN_PROGRESS")}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            statusFilter === "OUTREACH_IN_PROGRESS"
              ? "bg-raksha-navy border-teal-500 shadow-lg shadow-teal-500/10"
              : "bg-raksha-navy/40 border-raksha-wine/20 hover:border-teal-500/40"
          }`}
        >
          <div className="flex justify-between items-center text-xs text-teal-400 uppercase font-sans tracking-wider">
            <span>Outreach Active</span>
            <Users className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-teal-300 mt-1">{metrics.activeOutreach}</p>
          <span className="text-[10px] text-raksha-muted block mt-0.5">Notifications in flight</span>
        </div>

        {/* Awaiting Responses */}
        <div
          onClick={() => setStatusFilter("AWAITING_RESPONSES")}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            statusFilter === "AWAITING_RESPONSES"
              ? "bg-raksha-navy border-indigo-500 shadow-lg shadow-indigo-500/10"
              : "bg-raksha-navy/40 border-raksha-wine/20 hover:border-indigo-500/40"
          }`}
        >
          <div className="flex justify-between items-center text-xs text-indigo-400 uppercase font-sans tracking-wider">
            <span>Awaiting Responses</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-indigo-300 mt-1">{metrics.awaitingResponses}</p>
          <span className="text-[10px] text-raksha-muted block mt-0.5">Within SLA window</span>
        </div>

        {/* Escalated */}
        <div
          onClick={() => setStatusFilter("ESCALATED")}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            statusFilter === "ESCALATED"
              ? "bg-raksha-navy border-red-500 shadow-lg shadow-red-500/20"
              : "bg-raksha-navy/40 border-raksha-wine/20 hover:border-red-500/40"
          }`}
        >
          <div className="flex justify-between items-center text-xs text-red-400 uppercase font-sans tracking-wider">
            <span>Escalated</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-red-400 mt-1">{metrics.escalated}</p>
          <span className="text-[10px] text-red-400/80 block mt-0.5">SLA timeout breaches</span>
        </div>

        {/* Fulfilled */}
        <div
          onClick={() => setStatusFilter("ACCEPTED_FULFILLED")}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            statusFilter === "ACCEPTED_FULFILLED"
              ? "bg-raksha-navy border-green-500 shadow-lg shadow-green-500/10"
              : "bg-raksha-navy/40 border-raksha-wine/20 hover:border-green-500/40"
          }`}
        >
          <div className="flex justify-between items-center text-xs text-green-400 uppercase font-sans tracking-wider">
            <span>Fulfilled</span>
            <CheckCircle className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-green-300 mt-1">{metrics.fulfilled}</p>
          <span className="text-[10px] text-raksha-muted block mt-0.5">Donors confirmed</span>
        </div>

        {/* Cancelled */}
        <div
          onClick={() => setStatusFilter("CANCELLED")}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            statusFilter === "CANCELLED"
              ? "bg-raksha-navy border-gray-500 shadow-lg shadow-gray-500/10"
              : "bg-raksha-navy/40 border-raksha-wine/20 hover:border-gray-500/40"
          }`}
        >
          <div className="flex justify-between items-center text-xs text-gray-400 uppercase font-sans tracking-wider">
            <span>Cancelled / Rejected</span>
            <XCircle className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-gray-300 mt-1">{metrics.cancelled}</p>
          <span className="text-[10px] text-raksha-muted block mt-0.5">Closed or rejected</span>
        </div>
      </div>

      {/* ─── SECTION 2: CONTROLS & FILTER BAR ─────────────────────────────────── */}
      <div className="bg-raksha-navy/30 border border-raksha-wine/20 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-raksha-muted" />
          <input
            type="text"
            className="w-full bg-black/40 border border-raksha-wine/30 rounded-lg pl-9 pr-4 py-2 text-sm text-raksha-white placeholder-raksha-muted focus:outline-none focus:border-raksha-teal"
            placeholder="Search by Request ID, Patient, Hospital, or City..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Blood Group */}
          <select
            className="bg-black/40 border border-raksha-wine/30 rounded-lg px-3 py-2 text-xs text-raksha-white focus:outline-none focus:border-raksha-teal"
            value={bloodGroupFilter}
            onChange={(e) => setBloodGroupFilter(e.target.value)}
          >
            <option value="ALL">All Blood Groups</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>

          {/* Urgency */}
          <select
            className="bg-black/40 border border-raksha-wine/30 rounded-lg px-3 py-2 text-xs text-raksha-white focus:outline-none focus:border-raksha-teal"
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
          >
            <option value="ALL">All Urgencies</option>
            <option value="CRITICAL">Critical</option>
            <option value="URGENT">Urgent</option>
            <option value="ROUTINE">Routine</option>
          </select>

          {/* Status */}
          <select
            className="bg-black/40 border border-raksha-wine/30 rounded-lg px-3 py-2 text-xs text-raksha-white focus:outline-none focus:border-raksha-teal"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="CREATED">Created</option>
            <option value="MATCHING">Matching</option>
            <option value="PENDING_COORDINATOR_REVIEW">Pending Review</option>
            <option value="COORDINATOR_APPROVED">Approved</option>
            <option value="OUTREACH_PENDING">Outreach Pending</option>
            <option value="OUTREACH_IN_PROGRESS">Outreach Active</option>
            <option value="AWAITING_RESPONSES">Awaiting Responses</option>
            <option value="ACCEPTED_FULFILLED">Fulfilled</option>
            <option value="ESCALATED">Escalated</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => {
              fetchRequests();
              if (selectedRequestId) fetchRequestDetails(selectedRequestId);
            }}
            disabled={loading || actionLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-raksha-navy hover:bg-raksha-deep border border-raksha-wine/40 rounded-lg text-xs font-medium text-raksha-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-raksha-teal ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          {/* New Request Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-raksha-blood hover:bg-raksha-crimson rounded-lg text-xs font-semibold text-white transition-all shadow-md shadow-raksha-blood/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Blood Request</span>
          </button>
        </div>
      </div>

      {/* ─── SECTION 3: SPLIT VIEW LAYOUT ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Request List (4 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs uppercase font-sans tracking-wider text-raksha-muted">
              Requests ({filteredRequests.length})
            </span>
            <span className="text-[11px] text-raksha-teal font-mono">
              Live Coordination Feed
            </span>
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {filteredRequests.length === 0 ? (
              <div className="bg-raksha-navy/20 border border-raksha-wine/10 rounded-xl p-8 text-center text-raksha-muted">
                <Users className="w-8 h-8 mx-auto opacity-30 mb-2" />
                <p className="text-sm font-medium">No blood requests match this filter.</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                    setUrgencyFilter("ALL");
                    setBloodGroupFilter("ALL");
                  }}
                  className="mt-3 text-xs text-raksha-teal hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              filteredRequests.map((req) => {
                const isSelected = req.requestId === selectedRequestId;
                const statusBadge = getStatusBadge(req.status);
                const urgencyBadge = getUrgencyBadge(req.input.urgency);

                return (
                  <div
                    key={req.requestId}
                    onClick={() => {
                      setSelectedRequestId(req.requestId);
                      setSelectedRequest(req);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-raksha-navy/90 border-raksha-teal shadow-md shadow-raksha-teal/10"
                        : "bg-raksha-navy/30 border-raksha-wine/20 hover:border-raksha-wine/40 hover:bg-raksha-navy/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-raksha-teal">
                            {req.requestId}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono border ${urgencyBadge.bg} ${urgencyBadge.text} ${urgencyBadge.border}`}
                          >
                            {urgencyBadge.label}
                          </span>
                        </div>
                        <h3 className="font-display text-base font-bold text-raksha-white mt-1">
                          {req.input.patientName}
                        </h3>
                      </div>

                      {/* Blood Group Badge */}
                      <span className="px-2.5 py-1 bg-raksha-blood/20 border border-raksha-blood/40 text-raksha-blood font-mono font-bold text-sm rounded">
                        {req.input.bloodGroup}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-xs text-raksha-muted">
                      <span className="truncate max-w-[180px]">{req.input.hospital}</span>
                      <span>{req.input.city}</span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-raksha-wine/10 flex items-center justify-between">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded font-medium border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                      >
                        {statusBadge.label}
                      </span>

                      {req.isEscalated && (
                        <span className="text-[10px] flex items-center gap-1 text-red-400 font-semibold uppercase animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> SLA Escalated
                        </span>
                      )}

                      <span className="text-[10px] text-raksha-muted">
                        {formatDateTime(req.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Request Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedRequest ? (
            <div className="space-y-4">
              {/* Request Header Card */}
              <div className="bg-raksha-navy/40 border border-raksha-wine/20 rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-raksha-wine/20 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-raksha-teal">
                        {selectedRequest.requestId}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded font-mono border ${
                          getUrgencyBadge(selectedRequest.input.urgency).bg
                        } ${getUrgencyBadge(selectedRequest.input.urgency).text} ${
                          getUrgencyBadge(selectedRequest.input.urgency).border
                        }`}
                      >
                        {selectedRequest.input.urgency || "URGENT"} PRIORITY
                      </span>
                    </div>
                    <h2 className="font-display text-2xl font-bold text-raksha-white mt-1">
                      {selectedRequest.input.patientName}
                    </h2>
                    <p className="text-xs text-raksha-muted mt-0.5">
                      Diagnosis:{" "}
                      <span className="text-raksha-white/90">
                        {selectedRequest.input.diagnosis || "Thalassemia Major"}
                      </span>
                    </p>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className="px-3 py-1 bg-raksha-blood/20 border border-raksha-blood/40 text-raksha-blood font-mono font-bold text-lg rounded">
                      {selectedRequest.input.bloodGroup}
                    </span>
                    <span className="text-xs text-raksha-muted mt-1">
                      Units: <strong className="text-raksha-white">{selectedRequest.input.unitsRequired || 1}</strong>
                    </span>
                  </div>
                </div>

                {/* Key Attributes */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-raksha-muted block">Hospital</span>
                    <span className="font-medium text-raksha-white truncate block">
                      {selectedRequest.input.hospital}
                    </span>
                  </div>
                  <div>
                    <span className="text-raksha-muted block">Location / City</span>
                    <span className="font-medium text-raksha-white block">
                      {selectedRequest.input.city}
                    </span>
                  </div>
                  <div>
                    <span className="text-raksha-muted block">Created At</span>
                    <span className="font-mono text-raksha-white/80 block">
                      {formatDateTime(selectedRequest.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-raksha-muted block">Lifecycle State</span>
                    <span
                      className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] rounded font-medium border ${
                        getStatusBadge(selectedRequest.status).bg
                      } ${getStatusBadge(selectedRequest.status).text} ${
                        getStatusBadge(selectedRequest.status).border
                      }`}
                    >
                      {selectedRequest.status}
                    </span>
                  </div>
                </div>

                {/* SLA Escalation Alert Banner */}
                {selectedRequest.isEscalated && (
                  <div className="bg-red-950/70 border border-red-500/60 rounded-lg p-3 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-red-300">
                        SLA Escalation Activated
                      </h4>
                      <p className="text-xs text-red-200 mt-0.5">
                        {selectedRequest.escalationReason ||
                          "Response deadline exceeded without sufficient confirmed donors. Care coordinator escalation dispatched."}
                      </p>
                      {selectedRequest.escalatedAt && (
                        <span className="text-[10px] text-red-400/90 font-mono mt-1 block">
                          Escalated at: {formatDateTime(selectedRequest.escalatedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Lifecycle Action Bar */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-raksha-wine/10">
                  <div className="flex items-center gap-2">
                    {/* Run Matching Button */}
                    {selectedRequest.candidates.length === 0 && selectedRequest.status !== "CANCELLED" && (
                      <button
                        onClick={handleRunMatching}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-raksha-teal/20 hover:bg-raksha-teal/30 border border-raksha-teal/40 rounded-lg text-xs font-semibold text-raksha-teal transition-colors flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Run Matching Engine
                      </button>
                    )}

                    {/* Approve Outreach Dialog Trigger */}
                    {(selectedRequest.status === "PENDING_COORDINATOR_REVIEW" ||
                      selectedRequest.status === "MATCHING" ||
                      selectedRequest.status === "COORDINATOR_REJECTED") && (
                      <button
                        onClick={() => setIsApproveDialogOpen(true)}
                        disabled={actionLoading || selectedRequest.candidates.length === 0}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-semibold text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Coordinator Review & Approve ({selectedCandidates.size})
                      </button>
                    )}

                    {/* Reject Candidates Trigger */}
                    {selectedRequest.status === "PENDING_COORDINATOR_REVIEW" && (
                      <button
                        onClick={() => setIsRejectDialogOpen(true)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 rounded-lg text-xs font-medium text-rose-300 transition-colors flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject Candidates
                      </button>
                    )}

                    {/* Dispatch Outreach Trigger */}
                    {(selectedRequest.status === "COORDINATOR_APPROVED" ||
                      selectedRequest.status === "OUTREACH_PENDING") && (
                      <button
                        onClick={() => setIsOutreachDialogOpen(true)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Dispatch Outreach
                      </button>
                    )}

                    {/* Complete Request */}
                    {selectedRequest.status === "ACCEPTED_FULFILLED" && (
                      <button
                        onClick={handleCompleteRequest}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Complete Request
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Evaluate Escalation / SLA */}
                    {selectedRequest.status !== "COMPLETED" &&
                      selectedRequest.status !== "CANCELLED" && (
                        <button
                          onClick={handleTriggerEscalation}
                          disabled={actionLoading}
                          className="px-2.5 py-1.5 bg-black/40 hover:bg-black/60 border border-raksha-wine/30 rounded-lg text-xs font-medium text-raksha-muted hover:text-raksha-white transition-colors flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3 text-amber-400" />
                          Check SLA
                        </button>
                      )}

                    {/* Cancel Request */}
                    {selectedRequest.status !== "COMPLETED" &&
                      selectedRequest.status !== "CANCELLED" && (
                        <button
                          onClick={handleCancelRequest}
                          disabled={actionLoading}
                          className="px-2.5 py-1.5 bg-black/40 hover:bg-rose-950/40 border border-raksha-wine/30 rounded-lg text-xs font-medium text-raksha-muted hover:text-rose-400 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                  </div>
                </div>
              </div>

              {/* ─── SECTION 4: CANDIDATE MATCHING & SELECTION INTERFACE ──────── */}
              <div className="bg-raksha-navy/30 border border-raksha-wine/20 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-raksha-wine/20 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-raksha-teal" />
                    <h3 className="text-sm font-semibold text-raksha-white">
                      Compatible Donor Candidates ({selectedRequest.candidates.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-raksha-muted">
                    Masked Contact Info · ABO & Phenotype Compatible
                  </span>
                </div>

                {selectedRequest.candidates.length === 0 ? (
                  <div className="p-8 text-center text-raksha-muted space-y-2">
                    <p className="text-sm">No donor candidates generated yet for this request.</p>
                    <button
                      onClick={handleRunMatching}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-raksha-teal/20 hover:bg-raksha-teal/30 border border-raksha-teal/40 rounded-lg text-xs font-semibold text-raksha-teal"
                    >
                      Run Matching Engine Now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-raksha-wine/20 text-raksha-muted">
                            <th className="pb-2 pl-2">Select</th>
                            <th className="pb-2">Donor</th>
                            <th className="pb-2">Group</th>
                            <th className="pb-2">ABO Match</th>
                            <th className="pb-2">Distance</th>
                            <th className="pb-2">90-Day Recency</th>
                            <th className="pb-2">Allo-Risk</th>
                            <th className="pb-2">Score</th>
                            <th className="pb-2">Status</th>
                            <th className="pb-2 pr-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-raksha-wine/10">
                          {selectedRequest.candidates.map((donor) => {
                            const isChecked = selectedCandidates.has(donor.donorId);
                            const maskedPhone = maskPhoneNumber(donor.rawPhone);

                            return (
                              <tr
                                key={donor.donorId}
                                className={`hover:bg-raksha-navy/40 transition-colors ${
                                  isChecked ? "bg-raksha-navy/20" : ""
                                }`}
                              >
                                {/* Checkbox */}
                                <td className="py-2.5 pl-2">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleCandidateSelection(donor.donorId)}
                                    className="rounded border-raksha-wine/40 text-raksha-teal focus:ring-0 cursor-pointer"
                                  />
                                </td>

                                {/* Name & Masked Phone */}
                                <td className="py-2.5">
                                  <div className="font-medium text-raksha-white">{donor.donorName}</div>
                                  <div className="text-[10px] text-raksha-muted font-mono flex items-center gap-1">
                                    <Phone className="w-2.5 h-2.5 text-raksha-teal" />
                                    <span>{maskedPhone}</span>
                                  </div>
                                </td>

                                {/* Blood Group */}
                                <td className="py-2.5">
                                  <span className="font-mono font-bold text-raksha-white bg-black/40 px-1.5 py-0.5 rounded border border-raksha-wine/20">
                                    {donor.bloodGroup}
                                  </span>
                                </td>

                                {/* ABO Compatibility */}
                                <td className="py-2.5">
                                  {donor.isAboCompatible ? (
                                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                                      <Check className="w-3 h-3" /> Compatible
                                    </span>
                                  ) : (
                                    <span className="text-rose-400 font-medium flex items-center gap-1">
                                      <X className="w-3 h-3" /> Incompatible
                                    </span>
                                  )}
                                </td>

                                {/* Distance */}
                                <td className="py-2.5 font-mono text-raksha-muted">
                                  {donor.distanceKm ? `${donor.distanceKm.toFixed(1)} km` : "Local"}
                                </td>

                                {/* 90-day Recency */}
                                <td className="py-2.5">
                                  {donor.daysSinceLastDonation >= 90 ? (
                                    <span className="text-emerald-400 font-mono text-[11px]">
                                      {donor.daysSinceLastDonation}d (Eligible)
                                    </span>
                                  ) : (
                                    <span className="text-amber-400 font-mono text-[11px]">
                                      {donor.daysSinceLastDonation}d (&lt;90d)
                                    </span>
                                  )}
                                </td>

                                {/* Alloimmunization Risk */}
                                <td className="py-2.5">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                                      donor.alloimmunizationRisk === "LOW"
                                        ? "bg-emerald-950/40 text-emerald-300 border border-emerald-500/30"
                                        : donor.alloimmunizationRisk === "MODERATE"
                                        ? "bg-amber-950/40 text-amber-300 border border-amber-500/30"
                                        : "bg-rose-950/40 text-rose-300 border border-rose-500/30"
                                    }`}
                                  >
                                    {donor.alloimmunizationRisk}
                                  </span>
                                </td>

                                {/* Composite Score */}
                                <td className="py-2.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-raksha-teal text-xs">
                                      {donor.compositeScore}
                                    </span>
                                    <div className="w-10 bg-black/40 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className="bg-raksha-teal h-full"
                                        style={{ width: `${Math.min(100, donor.compositeScore)}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>

                                {/* Response Status & Origin */}
                                <td className="py-2.5">
                                  <div>
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                        donor.responseStatus === "ACCEPTED"
                                          ? "bg-emerald-900/50 text-emerald-300 border border-emerald-500/40"
                                          : donor.responseStatus === "DECLINED"
                                          ? "bg-rose-900/50 text-rose-300 border border-rose-500/40"
                                          : "bg-gray-800 text-gray-300"
                                      }`}
                                    >
                                      {donor.responseStatus}
                                    </span>
                                    {donor.responseStatus !== "PENDING" && (
                                      <span
                                        className={`text-[9px] block mt-0.5 font-mono ${
                                          donor.isSimulated ? "text-purple-400" : "text-cyan-400"
                                        }`}
                                      >
                                        {donor.isSimulated
                                          ? "⚡ Simulated (Dev)"
                                          : `📡 Inbound (${donor.responseChannel || "Webhook"})`}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Test Response Simulation Actions (Dev/Test Only) */}
                                <td className="py-2.5 pr-2 text-right">
                                  {selectedRequest.status === "AWAITING_RESPONSES" ||
                                  selectedRequest.status === "PARTIALLY_ACCEPTED" ||
                                  selectedRequest.status === "OUTREACH_IN_PROGRESS" ? (
                                    <div className="flex flex-col items-end gap-0.5">
                                      <div className="flex items-center justify-end gap-1">
                                        <button
                                          onClick={() => handleRecordResponse(donor.donorId, "ACCEPTED")}
                                          disabled={
                                            actionLoading ||
                                            donor.responseStatus === "ACCEPTED" ||
                                            process.env.NODE_ENV === "production"
                                          }
                                          title={
                                            process.env.NODE_ENV === "production"
                                              ? "Disabled in Production"
                                              : "Simulate Donor Accept (Dev Only)"
                                          }
                                          className="p-1 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-400 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                          <ThumbsUp className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => handleRecordResponse(donor.donorId, "DECLINED")}
                                          disabled={
                                            actionLoading ||
                                            donor.responseStatus === "DECLINED" ||
                                            process.env.NODE_ENV === "production"
                                          }
                                          title={
                                            process.env.NODE_ENV === "production"
                                              ? "Disabled in Production"
                                              : "Simulate Donor Decline (Dev Only)"
                                          }
                                          className="p-1 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-400 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                          <ThumbsDown className="w-3 h-3" />
                                        </button>
                                      </div>
                                      <span className="text-[8px] text-purple-400/80 font-mono tracking-tight">
                                        Dev Sim
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-raksha-muted">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* ─── SECTION 5: OUTREACH & NOTIFICATION MONITORING ────────────── */}
              <div className="bg-raksha-navy/30 border border-raksha-wine/20 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-raksha-wine/20 pb-3">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-semibold text-raksha-white">
                      Outreach Campaign & Notifications ({selectedRequest.notifications?.length || 0})
                    </h3>
                  </div>
                  <span className="text-[11px] text-raksha-muted">
                    Adapter: Mock / AWS SNS Idempotent Delivery
                  </span>
                </div>

                {/* Outreach Stats Summary */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-black/40 rounded-lg border border-raksha-wine/10">
                    <span className="text-[10px] uppercase font-sans tracking-wider text-raksha-muted block">
                      Dispatched
                    </span>
                    <span className="text-xl font-bold font-mono text-cyan-400">
                      {selectedRequest.notifications?.length || 0}
                    </span>
                  </div>
                  <div className="p-3 bg-black/40 rounded-lg border border-raksha-wine/10">
                    <span className="text-[10px] uppercase font-sans tracking-wider text-emerald-400 block">
                      Accepted
                    </span>
                    <span className="text-xl font-bold font-mono text-emerald-300">
                      {selectedRequest.acceptedDonorsCount || 0} / {selectedRequest.requiredDonors || 1}
                    </span>
                  </div>
                  <div className="p-3 bg-black/40 rounded-lg border border-raksha-wine/10">
                    <span className="text-[10px] uppercase font-sans tracking-wider text-rose-400 block">
                      Declined
                    </span>
                    <span className="text-xl font-bold font-mono text-rose-300">
                      {selectedRequest.declinedDonorsCount || 0}
                    </span>
                  </div>
                </div>

                {/* Dispatched Notification Records */}
                {selectedRequest.notifications && selectedRequest.notifications.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedRequest.notifications.map((notif) => (
                      <div
                        key={notif.notificationId}
                        className="p-2.5 bg-black/30 rounded-lg border border-raksha-wine/10 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-cyan-400 text-[11px]">
                              {notif.destinationMasked}
                            </span>
                            <span className="text-[10px] bg-black/50 text-raksha-muted px-1.5 py-0.2 rounded font-mono">
                              {notif.channel}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-medium">
                              ✓ {notif.deliveryStatus}
                            </span>
                          </div>
                          <p className="text-[11px] text-raksha-muted truncate max-w-md">
                            {notif.messageBody}
                          </p>
                        </div>
                        <div className="text-right text-[10px] text-raksha-muted font-mono shrink-0">
                          {formatDateTime(notif.sentAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-raksha-muted text-center py-2">
                    No outreach dispatched yet for this request.
                  </p>
                )}
              </div>

              {/* ─── SECTION 5B: INBOUND WEBHOOK & DONOR RESPONSE ACTIVITY ──── */}
              <div className="bg-raksha-navy/30 border border-raksha-wine/20 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-raksha-wine/20 pb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-raksha-white">
                      Inbound Donor Responses & Webhooks ({selectedRequest.inboundResponses?.length || 0})
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                      Replay Protected
                    </span>
                    <span className="text-[10px] bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded font-mono">
                      Idempotent
                    </span>
                  </div>
                </div>

                {/* Webhook Activity KPI Counters */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-black/40 rounded-lg border border-raksha-wine/10">
                    <span className="text-[10px] uppercase font-sans tracking-wider text-raksha-muted block">Inbound Total</span>
                    <span className="text-lg font-bold font-mono text-cyan-400">{selectedRequest.inboundResponses?.length || 0}</span>
                  </div>
                  <div className="p-2.5 bg-black/40 rounded-lg border border-raksha-wine/10">
                    <span className="text-[10px] uppercase font-sans tracking-wider text-emerald-400 block">Accepted</span>
                    <span className="text-lg font-bold font-mono text-emerald-300">{selectedRequest.acceptedDonorsCount || 0}</span>
                  </div>
                  <div className="p-2.5 bg-black/40 rounded-lg border border-raksha-wine/10">
                    <span className="text-[10px] uppercase font-sans tracking-wider text-rose-400 block">Declined</span>
                    <span className="text-lg font-bold font-mono text-rose-300">{selectedRequest.declinedDonorsCount || 0}</span>
                  </div>
                  <div className="p-2.5 bg-black/40 rounded-lg border border-raksha-wine/10">
                    <span className="text-[10px] uppercase font-sans tracking-wider text-amber-400 block">Invalid</span>
                    <span className="text-lg font-bold font-mono text-amber-300">{selectedRequest.invalidResponsesCount || 0}</span>
                  </div>
                  <div className="p-2.5 bg-black/40 rounded-lg border border-raksha-wine/10">
                    <span className="text-[10px] uppercase font-sans tracking-wider text-purple-400 block">Duplicates</span>
                    <span className="text-lg font-bold font-mono text-purple-300">{selectedRequest.duplicateWebhookCount || 0}</span>
                  </div>
                  <div className="p-2.5 bg-black/40 rounded-lg border border-raksha-wine/10">
                    <span className="text-[10px] uppercase font-sans tracking-wider text-raksha-muted block">Last Response</span>
                    <span className="text-[11px] font-mono text-raksha-white/90 truncate block mt-1">
                      {selectedRequest.lastResponseAt ? formatDateTime(selectedRequest.lastResponseAt) : "—"}
                    </span>
                  </div>
                </div>

                {/* Inbound Response Events Log */}
                {selectedRequest.inboundResponses && selectedRequest.inboundResponses.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedRequest.inboundResponses.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 bg-black/30 rounded-lg border border-raksha-wine/10 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-cyan-400 text-[11px] font-semibold">
                              {item.fromPhoneMasked}
                            </span>
                            <span className="text-[10px] bg-black/50 text-raksha-muted px-1.5 py-0.2 rounded font-mono">
                              {item.channel}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                item.normalizedResponse === "ACCEPTED"
                                  ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                                  : item.normalizedResponse === "DECLINED"
                                  ? "bg-rose-950/60 text-rose-300 border border-rose-500/30"
                                  : item.normalizedResponse === "HELP"
                                  ? "bg-cyan-950/60 text-cyan-300 border border-cyan-500/30"
                                  : "bg-amber-950/60 text-amber-300 border border-amber-500/30"
                              }`}
                            >
                              {item.normalizedResponse}
                            </span>
                            <span
                              className={`text-[10px] font-medium ${
                                item.status === "PROCESSED"
                                  ? "text-emerald-400"
                                  : item.status === "IGNORED_DUPLICATE"
                                  ? "text-purple-400"
                                  : "text-amber-400"
                              }`}
                            >
                              • {item.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-raksha-muted truncate max-w-md">
                            &quot;{item.rawMessage}&quot;
                          </p>
                        </div>
                        <div className="text-right text-[10px] text-raksha-muted font-mono shrink-0">
                          {formatDateTime(item.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-raksha-muted text-center py-2">
                    No inbound webhook responses recorded yet for this request.
                  </p>
                )}
              </div>

              {/* ─── SECTION 6: CHRONOLOGICAL AUDIT EVENT TIMELINE ────────────── */}
              <div className="bg-raksha-navy/30 border border-raksha-wine/20 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-raksha-wine/20 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-raksha-teal" />
                    <h3 className="text-sm font-semibold text-raksha-white">
                      Request Audit Trail ({selectedRequest.auditTrail?.length || 0} events)
                    </h3>
                  </div>
                  <span className="text-[11px] text-raksha-muted">
                    Immutable Compliance Log
                  </span>
                </div>

                {selectedRequest.auditTrail && selectedRequest.auditTrail.length > 0 ? (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-raksha-wine/30">
                    {selectedRequest.auditTrail.map((ev, idx) => (
                      <div key={ev.eventId || idx} className="relative group">
                        {/* Dot */}
                        <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-raksha-deep border-2 border-raksha-teal" />

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-raksha-white">
                              {ev.action}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-black/40 border border-raksha-wine/20 rounded text-raksha-teal font-mono">
                              {ev.actorRole}: {ev.actorId}
                            </span>
                            <span className="text-[10px] text-raksha-muted font-mono ml-auto">
                              {formatDateTime(ev.timestamp)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-raksha-muted">
                            <span className="font-mono text-gray-400">{ev.fromStatus}</span>
                            <ArrowRight className="w-3 h-3 text-raksha-muted" />
                            <span className="font-mono text-raksha-teal">{ev.toStatus}</span>
                          </div>

                          {ev.reason && (
                            <p className="text-xs text-raksha-white/80 bg-black/20 p-2 rounded border border-raksha-wine/10 mt-1">
                              {ev.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-raksha-muted text-center py-2">
                    No audit records available.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-raksha-navy/20 border border-raksha-wine/20 rounded-xl p-12 text-center text-raksha-muted space-y-3">
              <Eye className="w-10 h-10 mx-auto opacity-30 text-raksha-teal" />
              <h3 className="font-display text-lg font-bold text-raksha-white">
                Select a Blood Request
              </h3>
              <p className="text-xs max-w-sm mx-auto">
                Choose a blood request from the left column to view its candidate matches, approval workflow, outreach campaign status, and audit log.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL 1: CREATE BLOOD REQUEST ─────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-raksha-navy border border-raksha-teal/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-raksha-wine/20 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-raksha-blood" />
                <h3 className="font-display text-xl font-bold text-raksha-white">
                  Create Blood Request
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-raksha-muted hover:text-raksha-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-raksha-muted mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-black/40 border border-raksha-wine/30 rounded-lg px-3 py-2 text-sm text-raksha-white focus:outline-none focus:border-raksha-teal"
                    placeholder="e.g. Ramesh K."
                    value={newRequestForm.patientName}
                    onChange={(e) =>
                      setNewRequestForm({ ...newRequestForm, patientName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-raksha-muted mb-1">
                    Patient ID (Optional)
                  </label>
                  <input
                    type="text"
                    className="w-full bg-black/40 border border-raksha-wine/30 rounded-lg px-3 py-2 text-sm text-raksha-white focus:outline-none focus:border-raksha-teal"
                    placeholder="e.g. PT-2041"
                    value={newRequestForm.patientId}
                    onChange={(e) =>
                      setNewRequestForm({ ...newRequestForm, patientId: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-raksha-muted mb-1">
                    Blood Group *
                  </label>
                  <select
                    className="w-full bg-black/40 border border-raksha-wine/30 rounded-lg px-3 py-2 text-sm text-raksha-white focus:outline-none focus:border-raksha-teal"
                    value={newRequestForm.bloodGroup}
                    onChange={(e) =>
                      setNewRequestForm({ ...newRequestForm, bloodGroup: e.target.value })
                    }
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-raksha-muted mb-1">
                    Units Required
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="w-full bg-black/40 border border-raksha-wine/30 rounded-lg px-3 py-2 text-sm text-raksha-white focus:outline-none focus:border-raksha-teal"
                    value={newRequestForm.unitsRequired}
                    onChange={(e) =>
                      setNewRequestForm({
                        ...newRequestForm,
                        unitsRequired: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-raksha-muted mb-1">
                    Urgency
                  </label>
                  <select
                    className="w-full bg-black/40 border border-raksha-wine/30 rounded-lg px-3 py-2 text-sm text-raksha-white focus:outline-none focus:border-raksha-teal"
                    value={newRequestForm.urgency}
                    onChange={(e) =>
                      setNewRequestForm({
                        ...newRequestForm,
                        urgency: e.target.value as UrgencyLevel,
                      })
                    }
                  >
                    <option value="ROUTINE">Routine</option>
                    <option value="URGENT">Urgent (4h SLA)</option>
                    <option value="CRITICAL">Critical (1h SLA)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-raksha-muted mb-1">
                    Hospital *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-black/40 border border-raksha-wine/30 rounded-lg px-3 py-2 text-sm text-raksha-white focus:outline-none focus:border-raksha-teal"
                    placeholder="e.g. Narayana Hrudayalaya"
                    value={newRequestForm.hospital}
                    onChange={(e) =>
                      setNewRequestForm({ ...newRequestForm, hospital: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-raksha-muted mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-black/40 border border-raksha-wine/30 rounded-lg px-3 py-2 text-sm text-raksha-white focus:outline-none focus:border-raksha-teal"
                    placeholder="e.g. Bengaluru"
                    value={newRequestForm.city}
                    onChange={(e) =>
                      setNewRequestForm({ ...newRequestForm, city: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-raksha-muted mb-1">
                  Diagnosis / Clinical Notes
                </label>
                <input
                  type="text"
                  className="w-full bg-black/40 border border-raksha-wine/30 rounded-lg px-3 py-2 text-sm text-raksha-white focus:outline-none focus:border-raksha-teal"
                  placeholder="e.g. Thalassemia Major — regular transfusion schedule"
                  value={newRequestForm.diagnosis}
                  onChange={(e) =>
                    setNewRequestForm({ ...newRequestForm, diagnosis: e.target.value })
                  }
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-raksha-wine/20">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-transparent hover:bg-raksha-deep text-xs font-medium text-raksha-muted hover:text-raksha-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-raksha-blood hover:bg-raksha-crimson text-xs font-semibold text-white rounded-lg transition-all shadow-md shadow-raksha-blood/20 disabled:opacity-50"
                >
                  {actionLoading ? "Submitting..." : "Submit Blood Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: CONFIRM COORDINATOR APPROVAL ─────────────────────────────── */}
      {isApproveDialogOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-raksha-navy border border-emerald-500/50 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-950/60 rounded-xl border border-emerald-500/40 text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-raksha-white">
                  Confirm Coordinator Approval
                </h3>
                <p className="text-xs text-raksha-muted">
                  Human-in-the-loop authorization gate
                </p>
              </div>
            </div>

            <div className="bg-black/30 p-3.5 rounded-lg border border-raksha-wine/10 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-raksha-muted">Patient:</span>
                <span className="font-semibold text-raksha-white">
                  {selectedRequest.input.patientName} ({selectedRequest.input.bloodGroup})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-raksha-muted">Selected Candidates:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {selectedCandidates.size} donors
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-raksha-muted">Required Units:</span>
                <span className="font-semibold text-raksha-white">
                  {selectedRequest.input.unitsRequired || 1}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-raksha-muted">
                Approval Notes / Clinical Rationale
              </label>
              <textarea
                rows={2}
                className="w-full bg-black/40 border border-raksha-wine/30 rounded-lg p-2 text-xs text-raksha-white placeholder-raksha-muted focus:outline-none focus:border-emerald-500"
                placeholder="e.g. Verified ABO match, selected closest donors with >90d recency"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>

            <p className="text-[11px] text-emerald-300/80 bg-emerald-950/30 p-2.5 rounded border border-emerald-500/20">
              ✓ Automated outreach is strictly forbidden without this human approval. Confirming permits notification dispatch.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsApproveDialogOpen(false)}
                className="px-3 py-1.5 text-xs text-raksha-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveCandidates}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Authorizing..." : "Confirm & Authorize"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: CONFIRM OUTREACH DISPATCH ───────────────────────────────── */}
      {isOutreachDialogOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-raksha-navy border border-cyan-500/50 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-950/60 rounded-xl border border-cyan-500/40 text-cyan-400">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-raksha-white">
                  Dispatch Outreach Notifications
                </h3>
                <p className="text-xs text-raksha-muted">
                  Idempotent delivery to approved donors
                </p>
              </div>
            </div>

            <div className="bg-black/30 p-3.5 rounded-lg border border-raksha-wine/10 text-xs space-y-2">
              <p className="text-raksha-white/90">
                You are about to dispatch multi-channel blood request outreach for:
              </p>
              <ul className="list-disc pl-5 text-raksha-muted space-y-0.5">
                <li>Patient: <strong className="text-raksha-white">{selectedRequest.input.patientName}</strong></li>
                <li>Hospital: <strong className="text-raksha-white">{selectedRequest.input.hospital}</strong></li>
                <li>Target Donors: <strong className="text-cyan-400">{selectedCandidates.size} approved candidates</strong></li>
              </ul>
            </div>

            <p className="text-[11px] text-cyan-300/80 bg-cyan-950/30 p-2.5 rounded border border-cyan-500/20">
              ℹ Idempotency key will be attached to prevent duplicate SMS/WhatsApp transmissions.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsOutreachDialogOpen(false)}
                className="px-3 py-1.5 text-xs text-raksha-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDispatchOutreach}
                disabled={actionLoading}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Dispatching..." : "Send Outreach Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: REJECT CANDIDATES DIALOG ─────────────────────────────────── */}
      {isRejectDialogOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-raksha-navy border border-rose-500/50 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-950/60 rounded-xl border border-rose-500/40 text-rose-400">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-raksha-white">
                  Reject Candidate Pool
                </h3>
                <p className="text-xs text-raksha-muted">
                  Requires re-matching or manual review
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-raksha-muted">
                Rejection Reason *
              </label>
              <textarea
                rows={3}
                required
                className="w-full bg-black/40 border border-raksha-wine/30 rounded-lg p-2 text-xs text-raksha-white placeholder-raksha-muted focus:outline-none focus:border-rose-500"
                placeholder="e.g. Proximity too far or antibody history mismatch; re-run matching with larger radius"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectDialogOpen(false)}
                className="px-3 py-1.5 text-xs text-raksha-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectCandidates}
                disabled={actionLoading || !rejectReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
