/**
 * Coordination Persistence Store
 * Provides persistent storage for Blood Requests, Audit Trails, and Idempotency keys.
 * 
 * Includes high-resilience fallback: if MongoDB is unreachable or in tests,
 * seamlessly uses an in-memory/JSON backing store with zero external dependencies.
 */

import fs from "fs";
import path from "path";
import type { BloodRequestRecord, AuditEvent, RequestStatus, DonorOptOutRecord } from "./types.ts";

export class CoordinationStore {
  private memoryRequests: Map<string, BloodRequestRecord> = new Map();
  private memoryAuditLogs: Map<string, AuditEvent[]> = new Map();
  private memoryIdempotency: Map<string, any> = new Map();
  private memoryOptOuts: Map<string, DonorOptOutRecord> = new Map();
  private memoryWebhookDedup: Map<string, { timestamp: number; requestId?: string; donorId?: string }> = new Map();
  private cachedDonors: any[] | null = null;
  private dataDir: string;
  private optOutFilePath: string;
  private dedupFilePath: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), "data");
    this.optOutFilePath = path.join(this.dataDir, "donor_opt_outs.json");
    this.dedupFilePath = path.join(this.dataDir, "webhook_dedup.json");
    this.loadOptOutsFromDisk();
    this.loadDedupFromDisk();
  }

  private loadOptOutsFromDisk(): void {
    try {
      if (fs.existsSync(this.optOutFilePath)) {
        const raw = fs.readFileSync(this.optOutFilePath, "utf-8");
        const list: DonorOptOutRecord[] = JSON.parse(raw);
        for (const item of list) {
          if (item.phoneNormalized) this.memoryOptOuts.set(item.phoneNormalized, item);
          if (item.donorId) this.memoryOptOuts.set(item.donorId, item);
        }
      }
    } catch {
      // Ignore disk load error
    }
  }

  private loadDedupFromDisk(): void {
    try {
      if (fs.existsSync(this.dedupFilePath)) {
        const raw = fs.readFileSync(this.dedupFilePath, "utf-8");
        const obj = JSON.parse(raw);
        for (const [k, v] of Object.entries(obj)) {
          this.memoryWebhookDedup.set(k, v as any);
        }
      }
    } catch {
      // Ignore disk load error
    }
  }

  private persistOptOuts(): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      const uniqueList = Array.from(new Set(this.memoryOptOuts.values()));
      fs.writeFileSync(this.optOutFilePath, JSON.stringify(uniqueList, null, 2), "utf-8");
    } catch {
      // Fallback
    }
  }

  private persistDedup(): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      const obj = Object.fromEntries(this.memoryWebhookDedup.entries());
      fs.writeFileSync(this.dedupFilePath, JSON.stringify(obj, null, 2), "utf-8");
    } catch {
      // Fallback
    }
  }

  /**
   * Saves or updates a blood request record.
   */
  async saveRequest(record: BloodRequestRecord): Promise<void> {
    const cloned = JSON.parse(JSON.stringify(record));
    this.memoryRequests.set(record.requestId, cloned);

    try {
      // Attempt MongoDB write if available
      const mongo = await import("../mongodb.ts").catch(() => null);
      if (mongo && typeof mongo.getDb === "function") {
        const db = await mongo.getDb();
        await db.collection("blood_requests").updateOne(
          { requestId: record.requestId },
          { $set: cloned },
          { upsert: true }
        );
      }
    } catch {
      // In-memory fallback is active
    }
  }

  /**
   * Retrieves a blood request record by ID.
   */
  async getRequest(requestId: string): Promise<BloodRequestRecord | null> {
    if (this.memoryRequests.has(requestId)) {
      return JSON.parse(JSON.stringify(this.memoryRequests.get(requestId)!));
    }

    try {
      const mongo = await import("../mongodb.ts").catch(() => null);
      if (mongo && typeof mongo.getDb === "function") {
        const db = await mongo.getDb();
        const doc = await db.collection("blood_requests").findOne({ requestId });
        if (doc) {
          const { _id, ...rest } = doc;
          return rest as BloodRequestRecord;
        }
      }
    } catch {
      // Fallback
    }

    return null;
  }

  /**
   * Lists all blood requests, optionally filtered by status.
   */
  async listRequests(statusFilter?: RequestStatus): Promise<BloodRequestRecord[]> {
    let list = Array.from(this.memoryRequests.values());

    if (list.length === 0) {
      try {
        const mongo = await import("../mongodb.ts").catch(() => null);
        if (mongo && typeof mongo.getDb === "function") {
          const db = await mongo.getDb();
          const query = statusFilter ? { status: statusFilter } : {};
          const docs = await db.collection("blood_requests").find(query).toArray();
          list = docs.map(({ _id, ...rest }) => rest as BloodRequestRecord);
        }
      } catch {
        // Fallback
      }
    }

    if (statusFilter) {
      return list.filter((r) => r.status === statusFilter);
    }
    return list;
  }

  /**
   * Appends an audit event to a request's history.
   */
  async saveAuditEvent(event: AuditEvent): Promise<void> {
    const reqId = event.metadata?.requestId || "GLOBAL";
    const existing = this.memoryAuditLogs.get(reqId) || [];
    existing.push(JSON.parse(JSON.stringify(event)));
    this.memoryAuditLogs.set(reqId, existing);

    try {
      const mongo = await import("../mongodb.ts").catch(() => null);
      if (mongo && typeof mongo.getDb === "function") {
        const db = await mongo.getDb();
        await db.collection("coordination_audit_logs").insertOne(event);
      }
    } catch {
      // In-memory fallback
    }
  }

  /**
   * Retrieves the full audit trail for a request.
   */
  async getAuditTrail(requestId: string): Promise<AuditEvent[]> {
    const inMem = this.memoryAuditLogs.get(requestId);
    if (inMem && inMem.length > 0) {
      return JSON.parse(JSON.stringify(inMem));
    }

    try {
      const mongo = await import("../mongodb.ts").catch(() => null);
      if (mongo && typeof mongo.getDb === "function") {
        const db = await mongo.getDb();
        const docs = await db.collection("coordination_audit_logs").find({ "metadata.requestId": requestId }).sort({ timestamp: 1 }).toArray();
        if (docs.length > 0) {
          return docs.map(({ _id, ...rest }) => rest as AuditEvent);
        }
      }
    } catch {
      // In-memory fallback
    }

    return [];
  }

  /**
   * Loads donor pool from MongoDB or local seed data.
   */
  async getDonors(): Promise<any[]> {
    if (this.cachedDonors && this.cachedDonors.length > 0) {
      return this.cachedDonors;
    }

    let donors: any[] = [];
    try {
      const mongo = await import("../mongodb.ts").catch(() => null);
      if (mongo && typeof mongo.getDb === "function") {
        const db = await mongo.getDb();
        donors = await db.collection("donors").find({}).toArray();
      }
    } catch {
      // Fallback to seed data
    }

    if (!donors || donors.length === 0) {
      try {
        const seedPath = path.join(process.cwd(), "public", "seed_data.json");
        if (fs.existsSync(seedPath)) {
          const raw = fs.readFileSync(seedPath, "utf-8");
          const parsed = JSON.parse(raw);
          donors = parsed.donors || [];
        }
      } catch {
        donors = [];
      }
    }

    this.cachedDonors = donors;
    return donors;
  }

  public setDonors(donors: any[]): void {
    this.cachedDonors = donors;
  }

  /**
   * Saves a donor opt-out record and persists across memory and disk.
   */
  async saveDonorOptOut(record: DonorOptOutRecord): Promise<void> {
    if (record.phoneNormalized) {
      this.memoryOptOuts.set(record.phoneNormalized, record);
    }
    if (record.donorId) {
      this.memoryOptOuts.set(record.donorId, record);
    }
    this.persistOptOuts();

    try {
      const mongo = await import("../mongodb.ts").catch(() => null);
      if (mongo && typeof mongo.getDb === "function") {
        const db = await mongo.getDb();
        await db.collection("donor_opt_outs").updateOne(
          { phoneNormalized: record.phoneNormalized },
          { $set: record },
          { upsert: true }
        );
      }
    } catch {}
  }

  /**
   * Checks whether a donor or phone number has opted out of communication.
   */
  async isDonorOptedOut(donorId?: string, rawPhone?: string): Promise<boolean> {
    if (donorId && this.memoryOptOuts.has(donorId)) {
      return true;
    }
    if (rawPhone) {
      const cleaned = rawPhone.replace(/[\s\-\(\)\.]/g, "").toLowerCase();
      if (this.memoryOptOuts.has(cleaned)) return true;
      if (cleaned.startsWith("+") && this.memoryOptOuts.has(cleaned)) return true;
      if (/^\d{10}$/.test(cleaned) && this.memoryOptOuts.has(`+91${cleaned}`)) return true;
      for (const [key] of this.memoryOptOuts.entries()) {
        if (key.endsWith(cleaned) || cleaned.endsWith(key.replace("+", ""))) {
          return true;
        }
      }
    }

    try {
      const mongo = await import("../mongodb.ts").catch(() => null);
      if (mongo && typeof mongo.getDb === "function") {
        const db = await mongo.getDb();
        const queries: any[] = [];
        if (donorId) queries.push({ donorId });
        if (rawPhone) queries.push({ phoneNormalized: rawPhone });
        if (queries.length > 0) {
          const doc = await db.collection("donor_opt_outs").findOne({ $or: queries });
          if (doc) return true;
        }
      }
    } catch {}

    return false;
  }

  /**
   * Removes opt-out status (e.g., when donor replies START).
   */
  async removeDonorOptOut(donorId?: string, rawPhone?: string): Promise<void> {
    if (donorId) this.memoryOptOuts.delete(donorId);
    if (rawPhone) {
      const cleaned = rawPhone.replace(/[\s\-\(\)\.]/g, "").toLowerCase();
      this.memoryOptOuts.delete(cleaned);
      this.memoryOptOuts.delete(`+91${cleaned}`);
    }
    this.persistOptOuts();

    try {
      const mongo = await import("../mongodb.ts").catch(() => null);
      if (mongo && typeof mongo.getDb === "function") {
        const db = await mongo.getDb();
        const queries: any[] = [];
        if (donorId) queries.push({ donorId });
        if (rawPhone) queries.push({ phoneNormalized: rawPhone });
        if (queries.length > 0) {
          await db.collection("donor_opt_outs").deleteMany({ $or: queries });
        }
      }
    } catch {}
  }

  /**
   * Lists all current opt-outs.
   */
  async listOptOuts(): Promise<DonorOptOutRecord[]> {
    return Array.from(new Set(this.memoryOptOuts.values()));
  }

  /**
   * Checks persistent webhook message deduplication.
   */
  isWebhookDuplicate(providerMessageId: string, ttlMs: number = 24 * 60 * 60 * 1000): boolean {
    if (!providerMessageId) return false;
    const now = Date.now();
    const existing = this.memoryWebhookDedup.get(providerMessageId);
    if (existing && now - existing.timestamp < ttlMs) {
      return true;
    }
    return false;
  }

  /**
   * Records webhook message deduplication ID persistently.
   */
  saveWebhookDedup(providerMessageId: string, metadata?: { requestId?: string; donorId?: string }): void {
    if (!providerMessageId) return;
    this.memoryWebhookDedup.set(providerMessageId, { timestamp: Date.now(), ...metadata });
    this.persistDedup();
  }

  /**
   * Resets all internal stores and removes test persistence files.
   */
  public clear(): void {
    this.memoryRequests.clear();
    this.memoryAuditLogs.clear();
    this.memoryIdempotency.clear();
    this.memoryOptOuts.clear();
    this.memoryWebhookDedup.clear();
    this.cachedDonors = null;
    try {
      if (fs.existsSync(this.optOutFilePath)) fs.unlinkSync(this.optOutFilePath);
      if (fs.existsSync(this.dedupFilePath)) fs.unlinkSync(this.dedupFilePath);
    } catch {}
  }
}

// Global Singleton
let _storeInstance: CoordinationStore | null = null;
export function getCoordinationStore(): CoordinationStore {
  if (!_storeInstance) {
    _storeInstance = new CoordinationStore();
  }
  return _storeInstance;
}
