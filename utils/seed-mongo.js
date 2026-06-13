const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

// Zero-dependency manual environment loader for .env.local
try {
  const envLocalPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envLocalPath)) {
    const envLines = fs.readFileSync(envLocalPath, "utf8").split("\n");
    for (const line of envLines) {
      const parts = line.split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join("=").trim();
        process.env[key] = val;
      }
    }
  }
} catch (e) {
  console.warn("Failed to parse .env.local", e);
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/raksha";

async function main() {
  console.log("Connecting to MongoDB at:", MONGODB_URI);
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    // 1. Read seed_data.json
    const filePath = path.join(process.cwd(), "public", "seed_data.json");
    if (!fs.existsSync(filePath)) {
      console.error("Error: seed_data.json not found at", filePath);
      return;
    }
    const seedData = JSON.parse(fs.readFileSync(filePath, "utf8"));
    
    const donors = seedData.donors || [];
    const patients = seedData.patients || [];
    
    console.log(`Read ${donors.length} donors and ${patients.length} patients from seed_data.json`);
    
    // 2. Clear existing collections
    await db.collection("donors").deleteMany({});
    await db.collection("patients").deleteMany({});
    await db.collection("transfusions").deleteMany({});
    await db.collection("blood_requests").deleteMany({});
    console.log("Cleared existing MongoDB collections.");
    
    // 3. Insert donors and patients
    if (donors.length > 0) {
      await db.collection("donors").insertMany(donors);
      console.log("Successfully inserted donors.");
    }
    if (patients.length > 0) {
      await db.collection("patients").insertMany(patients);
      console.log("Successfully inserted patients.");
    }
    
    // 4. Generate mock transfusions for donors with active donation counts
    const transfusions = [];
    let transIdCounter = 1;
    
    for (const d of donors) {
      const donorId = d.donorId || d.donor_id;
      const donationCount = d.donationCount || d.donation_count || 0;
      
      if (donationCount > 0 && donorId) {
        // Create 1 to 3 mock transfusions for data richness
        const numTransfusions = Math.min(3, Math.max(1, Math.floor(Math.random() * 3) + 1));
        
        for (let i = 0; i < numTransfusions; i++) {
          const transfusionId = `TX-${10000 + transIdCounter++}`;
          
          // Random date in last 2 years
          const date = new Date(Date.now() - Math.floor(Math.random() * 365 * 2 * 24 * 60 * 60 * 1000))
            .toISOString()
            .split("T")[0];
            
          const hemoglobinBefore = parseFloat((6.5 + Math.random() * 2.5).toFixed(1)); // 6.5 to 9.0 g/dL
          const hemoglobinAfter = parseFloat((9.5 + Math.random() * 2.5).toFixed(1)); // 9.5 to 12.0 g/dL
          const units = Math.floor(Math.random() * 2) + 1; // 1 or 2 units
          const outcome = Math.random() > 0.3 ? "Success" : "Good";
          
          transfusions.push({
            transfusionId,
            donorId,
            patientId: `PAT-${1000 + Math.floor(Math.random() * 10)}`,
            date,
            hemoglobinBefore,
            hemoglobinAfter,
            units,
            outcome,
          });
        }
      }
    }
    
    if (transfusions.length > 0) {
      await db.collection("transfusions").insertMany(transfusions);
      console.log(`Generated and inserted ${transfusions.length} mock transfusion history records.`);
    }
    
    console.log("Database seeded successfully!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.close();
  }
}

main();
