import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      donorId,
      donorName,
      patientBloodGroup,
      patientCity,
      diagnosis,
      urgency,
      phoneOverride, // Optional override for live testing
    } = body;

    if (!donorId || !donorName || !patientBloodGroup || !patientCity) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const requestId = "REQ-" + Date.now();

    // 1. Retrieve Donor details from Database to get their phone number
    const donor = await db.collection("donors").findOne({
      $or: [
        { donorId: donorId },
        { donor_id: donorId }
      ]
    });

    // Determine target phone (use override if provided for demo testing)
    const rawPhone = phoneOverride || donor?.phone || "";
    let targetPhone = rawPhone.replace(/\s+/g, "");

    // Format target phone to E.164 format (+91 for India by default if 10 digits)
    if (targetPhone && !targetPhone.startsWith("+")) {
      if (targetPhone.length === 10) {
        targetPhone = "+91" + targetPhone;
      } else {
        targetPhone = "+" + targetPhone;
      }
    }

    // 2. Twilio automated dispatch integration
    let twilioResult: any = { status: "not_configured" };
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioSmsFrom = process.env.TWILIO_SMS_FROM;
    const twilioWhatsappFrom = process.env.TWILIO_WHATSAPP_FROM;

    if (twilioAccountSid && twilioAuthToken && targetPhone) {
      try {
        const twilio = require("twilio");
        const client = twilio(twilioAccountSid, twilioAuthToken);
        
        const messageBody = `[Raksha AI Emergency Match] Urgent blood donation request found. Blood type: ${patientBloodGroup} needed in ${patientCity} for a ${diagnosis || "Thalassemia"} patient. Ref ID: ${requestId}. Reply YES to accept.`;

        let smsSid = null;
        if (twilioSmsFrom) {
          const smsRes = await client.messages.create({
            body: messageBody,
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
            body: messageBody,
            from: formattedWhatsappFrom,
            to: `whatsapp:${targetPhone}`,
          });
          whatsappSid = whatsappRes.sid;
        }

        twilioResult = {
          status: "success",
          smsSid,
          whatsappSid,
          targetPhone,
        };
      } catch (twilioErr: any) {
        console.error("Twilio send failed:", twilioErr);
        twilioResult = {
          status: "error",
          error: twilioErr.message || "Twilio API failure",
          targetPhone,
        };
      }
    }

    // 3. Save blood request tracking record in MongoDB
    await db.collection("blood_requests").insertOne({
      requestId,
      donorId,
      donorName,
      patientBloodGroup,
      patientCity,
      diagnosis: diagnosis || "Thalassemia",
      urgency: urgency || "Standard",
      status: "pending",
      targetPhone,
      twilio: twilioResult,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      requestId,
      targetPhone,
      twilio: twilioResult,
      message: `Request registered successfully. Twilio Status: ${twilioResult.status}`,
    });
  } catch (err: any) {
    console.error("Request donor failed:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
