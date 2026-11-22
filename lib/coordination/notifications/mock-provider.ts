/**
 * Local Mock Notification Provider
 * Used for local testing and deterministic automated verification.
 * Does NOT contact real people or send live external messages.
 */

import { INotificationProvider, NotificationPayload, NotificationResult } from "./interface.ts";

export class MockNotificationProvider implements INotificationProvider {
  public readonly name = "mock_provider";
  public dispatches: Array<NotificationPayload & { dispatchedAt: string; providerMessageId: string }> = [];
  public failNextN = 0;
  public failOnDonorIds = new Set<string>();

  constructor() {}

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const timestamp = new Date().toISOString();

    // Check if failure is simulated
    if (this.failNextN > 0 || this.failOnDonorIds.has(payload.donorId)) {
      if (this.failNextN > 0) this.failNextN--;
      return {
        success: false,
        provider: this.name,
        status: "FAILED",
        error: "Simulated upstream provider gateway timeout",
        timestamp,
        retryable: true
      };
    }

    const providerMessageId = `MOCK-MSG-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    this.dispatches.push({
      ...payload,
      dispatchedAt: timestamp,
      providerMessageId
    });

    return {
      success: true,
      provider: this.name,
      providerMessageId,
      status: "DELIVERED",
      timestamp,
      retryable: false
    };
  }

  public reset(): void {
    this.dispatches = [];
    this.failNextN = 0;
    this.failOnDonorIds.clear();
  }
}
