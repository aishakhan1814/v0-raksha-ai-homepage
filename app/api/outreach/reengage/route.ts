import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { name, role, reason } = await req.json();

    if (!name || !role) {
      return NextResponse.json({ success: false, error: "Missing name or role" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // 1. Find user details (either in donors or patients collection)
    let phone = "";
    let email = "";

    if (role.toLowerCase() === "donor") {
      const donor = await db.collection("donors").findOne({ name: name });
      phone = donor?.phone || "";
      email = donor?.email || "";
    } else {
      const patient = await db.collection("patients").findOne({ patientName: name });
      phone = patient?.phone || "";
      email = patient?.email || "";
    }

    // Default fallbacks if not found in db
    if (!phone) phone = role.toLowerCase() === "donor" ? "+917777777777" : "+915555555555";
    if (!email) email = `${name.toLowerCase().replace(/\s/g, "")}@example.com`;

    const message = `[Raksha AI Outreach] Hello ${name}, we noticed your profile has been inactive or requires attention (${reason}). Please check your Raksha dashboard or reply to this message to coordinate your next donation. Thank you!`;

    // 2. Twilio Automated Dispatch Integration
    let twilioResult: any = { status: "not_configured" };
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioSmsFrom = process.env.TWILIO_SMS_FROM;
    const twilioWhatsappFrom = process.env.TWILIO_WHATSAPP_FROM;

    let targetPhone = phone.replace(/\s+/g, "");
    if (targetPhone && !targetPhone.startsWith("+")) {
      targetPhone = targetPhone.length === 10 ? "+91" : "+";
      targetPhone += phone.replace(/\s+/g, "");
    }

    if (twilioAccountSid && twilioAuthToken && targetPhone) {
      try {
        const twilio = require("twilio");
        const client = twilio(twilioAccountSid, twilioAuthToken);
        
        let smsSid = null;
        if (twilioSmsFrom) {
          const smsRes = await client.messages.create({
            body: message,
            from: twilioSmsFrom,
            to: targetPhone,
          });
          smsSid = smsRes.sid;
        }

        let whatsappSid = null;
        if (twilioWhatsappFrom) {
          const formattedWhatsappFrom = twilioWhatsappFrom.startsWith("whatsapp:") 
            ? twilioWhatsappFrom 
            : `whatsapp:${twilioWhatsappFrom}`;
          const whatsappRes = await client.messages.create({
            body: message,
            from: formattedWhatsappFrom,
            to: `whatsapp:${targetPhone}`,
          });
          whatsappSid = whatsappRes.sid;
        }

        twilioResult = {
          status: "success",
          smsSid,
          whatsappSid,
        };
      } catch (twilioErr: any) {
        console.error("Outreach Twilio send failed:", twilioErr);
        twilioResult = {
          status: "error",
          error: twilioErr.message || "Twilio failure",
        };
      }
    }

    // 3. Save outreach log record in MongoDB
    await db.collection("outreach_logs").insertOne({
      name,
      role,
      reason,
      message,
      phone,
      email,
      twilio: twilioResult,
      createdAt: new Date().toISOString(),
    });

    // 4. Update the inactive user status in inactive_users collection
    await db.collection("inactive_users").updateOne(
      { name: name },
      { $set: { lastActive: "Re-engaged today", reason: "Re-engagement outreach dispatched" } }
    );

    return NextResponse.json({
      success: true,
      channel: twilioResult.status === "success" ? "SMS & WhatsApp" : "System Fallback (WhatsApp Redirect)",
      message,
      recipient: name,
      phone,
      email,
    });
  } catch (err: any) {
    console.error("Reengage API failed:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
