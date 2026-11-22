import { WhatsAppWebhookAdapter } from "../../../../../lib/coordination/webhooks/adapters/whatsapp-adapter.ts";
import { getWebhookProcessor } from "../../../../../lib/coordination/webhooks/processor.ts";

const whatsappAdapter = new WhatsAppWebhookAdapter();
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "rakshaai_webhook_verify_token";

/**
 * GET: Meta WhatsApp Webhook Verification Challenge
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge || "OK", { status: 200 });
  }

  return Response.json({
    status: "active",
    channel: "WHATSAPP",
    provider: "meta_whatsapp_cloud_api",
    message: "RakshAI Inbound WhatsApp Webhook Gateway Active"
  });
}

/**
 * POST: Meta WhatsApp Inbound Message Event
 */
export async function POST(req: Request) {
  let rawBody = "";
  try {
    rawBody = await req.text();
  } catch (err: any) {
    return Response.json(
      { success: false, error: "Failed to read request body" },
      { status: 400 }
    );
  }

  const processor = getWebhookProcessor();
  const result = await processor.processWebhook(whatsappAdapter, req, rawBody);

  return Response.json(result, { status: result.statusCode });
}
