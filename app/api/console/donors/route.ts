import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const bloodType = searchParams.get("bloodType") || "";
    const status = searchParams.get("status") || "";

    const { db } = await connectToDatabase();

    const query: any = {};

    // 1. Blood Type Filter
    if (bloodType) {
      query.$or = [
        { bloodType: bloodType.trim() },
        { bloodGroup: bloodType.trim() }
      ];
    }

    // 2. Search query (regex matching firstName, lastName, city, phone, email)
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      
      const searchConditions = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { name: searchRegex },
        { city: searchRegex },
        { phone: searchRegex },
        { email: searchRegex }
      ];

      if (query.$or) {
        // If bloodType filter already added $or, we combine them using $and
        const existingOr = query.$or;
        delete query.$or;
        query.$and = [
          { $or: existingOr },
          { $or: searchConditions }
        ];
      } else {
        query.$or = searchConditions;
      }
    }

    // 3. Status filter: eligible / deferred
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    if (status) {
      const isEligibleQuery = {
        hasConditions: { $ne: "yes" },
        conditions: { $in: [null, ""] },
        $or: [
          { lastDonated: { $in: ["Never", "", null] } },
          { lastDonated: { $lte: ninetyDaysAgo } }
        ]
      };

      if (status === "eligible") {
        Object.assign(query, isEligibleQuery);
      } else if (status === "deferred") {
        query.$or = [
          { hasConditions: "yes" },
          { conditions: { $nin: [null, ""] } },
          { 
            lastDonated: { 
              $exists: true, 
              $nin: ["Never", "", null], 
              $gt: ninetyDaysAgo 
            } 
          }
        ];
      }
    }

    // Fetch matching donors from MongoDB
    const donors = await db.collection("donors")
      .find(query, {
        projection: {
          donorId: 1,
          donor_id: 1,
          firstName: 1,
          lastName: 1,
          name: 1,
          bloodType: 1,
          bloodGroup: 1,
          city: 1,
          phone: 1,
          email: 1,
          lastDonated: 1,
          lastDonation: 1,
          hasConditions: 1,
          conditions: 1
        }
      })
      .limit(150) // Return up to 150 matching records for high performance
      .toArray();

    // Map to frontend structure
    const mapped = donors.map((d: any) => {
      let calcStatus: "eligible" | "deferred" = "eligible";
      if (d.hasConditions === "yes" || d.conditions) {
        calcStatus = "deferred";
      } else if (d.lastDonated && d.lastDonated !== "Never" && d.lastDonated !== "") {
        const lastDate = new Date(d.lastDonated).getTime();
        const diffMs = Date.now() - lastDate;
        const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
        if (diffMs < ninetyDaysMs) {
          calcStatus = "deferred";
        }
      }

      return {
        id: d.donorId || d.donor_id || d._id.toString(),
        name: d.name || `${d.firstName || ""} ${d.lastName || ""}`.trim() || "Unknown Donor",
        bloodType: d.bloodType || d.bloodGroup || "O+",
        city: d.city || "Hyderabad",
        phone: d.phone || "",
        email: d.email || "",
        lastDonation: d.lastDonated || d.lastDonation || "Never",
        status: calcStatus
      };
    });

    return NextResponse.json({
      success: true,
      donors: mapped
    });

  } catch (err: any) {
    console.error("Error fetching console donors list:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
