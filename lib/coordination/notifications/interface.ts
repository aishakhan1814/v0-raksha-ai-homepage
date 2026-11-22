/**
 * Notification Provider Interface & Contracts
 */

export interface NotificationPayload {
  notificationId: string;
  idempotencyKey: string;
  requestId: string;
  donorId: string;
  donorPhone: string;
  channel: "SMS" | "WHATSAPP";
  message: string;
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  provider: string;
  providerMessageId?: string;
  status: "DELIVERED" | "SENT" | "FAILED";
  error?: string;
  timestamp: string;
  retryable?: boolean;
}

export interface INotificationProvider {
  name: string;
  send(payload: NotificationPayload): Promise<NotificationResult>;
}

export const NotificationPayload = {};
export const NotificationResult = {};
export const INotificationProvider = {};

/**
 * Masks E.164 phone numbers for privacy preservation in logs and audit trails.
 * Example: "+919876543210" -> "+91 98*** **210"
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return "[NO_PHONE]";
  const cleaned = phone.replace(/\s+/g, "");
  if (cleaned.length < 8) return "***";
  const start = cleaned.substring(0, cleaned.startsWith("+") ? 5 : 3);
  const end = cleaned.substring(cleaned.length - 3);
  return `${start}*** **${end}`;
}
