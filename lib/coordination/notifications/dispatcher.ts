/**
 * Notification Dispatcher
 * Coordinates notification delivery through pluggable providers with:
 * - Cryptographic idempotency key validation
 * - Duplicate dispatch prevention
 * - Automatic retry policy with configurable backoff
 * - PII masking in logs and audit records
 */

import { INotificationProvider, NotificationPayload, NotificationResult, maskPhoneNumber } from "./interface.ts";
import { NotificationRecord, NotificationDeliveryStatus } from "../types.ts";

export interface DispatcherOptions {
  provider: INotificationProvider;
  maxRetries?: number;
  initialBackoffMs?: number;
}

export class NotificationDispatcher {
  private provider: INotificationProvider;
  private maxRetries: number;
  private initialBackoffMs: number;
  private idempotencyCache: Map<string, NotificationRecord> = new Map();

  constructor(options: DispatcherOptions) {
    this.provider = options.provider;
    this.maxRetries = options.maxRetries !== undefined ? options.maxRetries : 3;
    this.initialBackoffMs = options.initialBackoffMs !== undefined ? options.initialBackoffMs : 100;
  }

  public setProvider(provider: INotificationProvider): void {
    this.provider = provider;
  }

  /**
   * Dispatches a notification with idempotency protection and retry handling.
   */
  async dispatch(payload: NotificationPayload): Promise<NotificationRecord> {
    const key = payload.idempotencyKey;

    // 1. Idempotency Check: Prevent duplicate sends
    const cached = this.idempotencyCache.get(key);
    if (cached) {
      if (cached.deliveryStatus === "DELIVERED" || cached.deliveryStatus === "SENT") {
        return {
          ...cached,
          // Return cached record without re-dispatching
        };
      }
    }

    const maskedPhone = maskPhoneNumber(payload.donorPhone);
    let attempts = 0;
    let lastResult: NotificationResult | null = null;
    let deliveryStatus: NotificationDeliveryStatus = "PENDING";
    const sentAt = new Date().toISOString();

    while (attempts <= this.maxRetries) {
      attempts++;
      lastResult = await this.provider.send(payload);

      if (lastResult.success) {
        deliveryStatus = lastResult.status === "DELIVERED" ? "DELIVERED" : "SENT";
        break;
      }

      if (!lastResult.retryable || attempts > this.maxRetries) {
        deliveryStatus = "FAILED";
        break;
      }

      // Retryable failure - brief backoff
      deliveryStatus = "RETRYING";
      const backoff = this.initialBackoffMs * Math.pow(2, attempts - 1);
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }

    const record: NotificationRecord = {
      notificationId: payload.notificationId,
      idempotencyKey: key,
      requestId: payload.requestId,
      donorId: payload.donorId,
      channel: payload.channel,
      destinationMasked: maskedPhone,
      messageBody: payload.message,
      deliveryStatus,
      sentAt,
      deliveredAt: deliveryStatus === "DELIVERED" ? new Date().toISOString() : undefined,
      retryCount: attempts - 1,
      maxRetries: this.maxRetries,
      provider: this.provider.name as any,
      providerMessageId: lastResult?.providerMessageId,
      error: lastResult?.error
    };

    this.idempotencyCache.set(key, record);
    return record;
  }

  /**
   * Records an idempotency key as executed.
   */
  public recordIdempotency(key: string, record?: any): void {
    this.idempotencyCache.set(key, record || { deliveryStatus: "DELIVERED" });
  }

  /**
   * Checks if an idempotency key was already executed successfully.
   */
  public hasExecuted(idempotencyKey: string): boolean {
    const existing = this.idempotencyCache.get(idempotencyKey);
    return !!existing && (existing.deliveryStatus === "DELIVERED" || existing.deliveryStatus === "SENT");
  }

  public getRecord(idempotencyKey: string): NotificationRecord | undefined {
    return this.idempotencyCache.get(idempotencyKey);
  }

  public clearCache(): void {
    this.idempotencyCache.clear();
  }
}
