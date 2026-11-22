import { SmsWebhookAdapter } from "../../../../../lib/coordination/webhooks/adapters/sms-adapter.ts";
import { getWebhookProcessor } from "../../../../../lib/coordination/webhooks/processor.ts";

const smsAdapter = new SmsWebhookAdapter();

export async function GET() {
  return Response.json({
    status: "active",
    channel: "SMS",
    provider: "twilio_compatible",
    message: "RakshAI Inbound SMS Webhook Gateway Active"
  });
}

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
  const result = await processor.processWebhook(smsAdapter, req, rawBody);

  // If Twilio format was delivered via form-urlencoded, return TwiML XML
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/x-www-form-urlencoded") && result.replyMessage) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${result.replyMessage}</Message></Response>`;
    return new Response(twiml, {
      status: result.statusCode,
      headers: { "Content-Type": "text/xml" }
    });
  }

  return Response.json(result, { status: result.statusCode });
}
