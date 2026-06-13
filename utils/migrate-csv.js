const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Load Environment variables from .env.local
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
const CSV_FILE_PATH = "/Users/jashwath/Downloads/Dataset_rakshaAI.csv";

// Coordinate mappings for major Indian cities
const CITIES = [
  { name: "Hyderabad", state: "Telangana", lat: 17.3850, lon: 78.4867 },
  { name: "Secunderabad", state: "Telangana", lat: 17.4399, lon: 78.4983 },
  { name: "Warangal", state: "Telangana", lat: 17.9784, lon: 79.5941 },
  { name: "Karimnagar", state: "Telangana", lat: 18.4386, lon: 79.1288 },
  { name: "Nizamabad", state: "Telangana", lat: 18.6725, lon: 78.0941 },
  { name: "Mumbai", state: "Maharashtra", lat: 19.0760, lon: 72.8777 },
  { name: "Pune", state: "Maharashtra", lat: 18.5204, lon: 73.8567 },
  { name: "Nagpur", state: "Maharashtra", lat: 21.1458, lon: 79.0882 },
  { name: "Bangalore", state: "Karnataka", lat: 12.9716, lon: 77.5946 },
  { name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lon: 80.2707 },
  { name: "Vijayawada", state: "Andhra Pradesh", lat: 16.5062, lon: 80.6480 },
  { name: "Visakhapatnam", state: "Andhra Pradesh", lat: 17.6868, lon: 83.2185 },
  { name: "Delhi", state: "Delhi", lat: 28.7041, lon: 77.1025 },
  { name: "Kolkata", state: "West Bengal", lat: 22.5726, lon: 88.3639 },
  { name: "Jaipur", state: "Rajasthan", lat: 26.9124, lon: 75.7873 },
  { name: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lon: 80.9462 },
  { name: "Ahmedabad", state: "Gujarat", lat: 23.0225, lon: 72.5714 }
];

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getClosestCity(lat, lon) {
  if (!lat || !lon) return CITIES[0]; // Default to Hyderabad
  let closest = CITIES[0];
  let minDist = Infinity;
  for (const city of CITIES) {
    const dist = haversineDistance(lat, lon, city.lat, city.lon);
    if (dist < minDist) {
      minDist = dist;
      closest = city;
    }
  }
  return closest;
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash;
}

const MALE_NAMES = ["Ramesh", "Suresh", "Amit", "Rahul", "Vikram", "Rajesh", "Sanjay", "Karthik", "Sandeep", "Vijay", "Anil", "Arjun", "Sunil", "Alok", "Vivek", "Kiran", "Abhishek", "Deepak", "Rohan", "Manoj", "Prakash", "Sanjay", "Dinesh", "Gopal"];
const FEMALE_NAMES = ["Priya", "Sunita", "Anita", "Meera", "Divya", "Neha", "Poonam", "Anjali", "Lakshmi", "Kiran", "Aditi", "Sneha", "Kavita", "Ritu", "Shalini", "Pooja", "Swati", "Preeti", "Geeta", "Radha", "Rekha", "Nisha", "Kajal", "Aarti"];
const LAST_NAMES = ["Kumar", "Sharma", "Reddy", "Patel", "Shah", "Joshi", "Iyer", "Rao", "Nair", "Singh", "Gupta", "Verma", "Mehta", "Sen", "Das", "Choudhury", "Mishra", "Pandey"];

function generateProfile(userId, gender) {
  const hash = Math.abs(hashCode(userId));
  const isFemale = gender && gender.toLowerCase() === "female";
  const nameList = isFemale ? FEMALE_NAMES : MALE_NAMES;
  const firstName = nameList[hash % nameList.length];
  const lastName = LAST_NAMES[(hash + 1) % LAST_NAMES.length];
  
  // Random phone number
  const phone = `+91${9000000000 + (hash % 1000000000)}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@raksha.ai`;
  return { firstName, lastName, phone, email };
}

function mapBloodGroup(longBg) {
  const mapping = {
    "O Positive": "O+",
    "O Negative": "O-",
    "A Positive": "A+",
    "A Negative": "A-",
    "B Positive": "B+",
    "B Negative": "B-",
    "AB Positive": "AB+",
    "AB Negative": "AB-"
  };
  return mapping[longBg] || "O+";
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map(val => val.replace(/^"|"$/g, ""));
}

async function run() {
  console.log("Connecting to MongoDB at:", MONGODB_URI);
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    // Clear existing collections
    await db.collection("donors").deleteMany({});
    await db.collection("patients").deleteMany({});
    await db.collection("transfusions").deleteMany({});
    await db.collection("blood_requests").deleteMany({});
    console.log("Cleared existing collections.");

    const rl = readline.createInterface({
      input: fs.createReadStream(CSV_FILE_PATH),
      crlfDelay: Infinity
    });

    let isHeader = true;
    let headers = [];
    const donors = [];
    const patients = [];
    
    for await (const line of rl) {
      if (isHeader) {
        headers = parseCSVLine(line);
        isHeader = false;
        continue;
      }
      
      const values = parseCSVLine(line);
      if (values.length < headers.length) continue;
      
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx];
      });
      
      const role = row.role || "";
      let userId = row.user_id || "";
      if (!userId) continue;
      userId = userId.replace(/^\\x/, "").replace(/^'|'$/g, "");
      
      const gender = row.gender || "Male";
      const profile = generateProfile(userId, gender);
      
      const lat = parseFloat(row.latitude) || 0;
      const lon = parseFloat(row.longitude) || 0;
      const closestCity = getClosestCity(lat, lon);
      
      const bloodGroupLong = row.blood_group || "O Positive";
      const bloodGroupShort = mapBloodGroup(bloodGroupLong);
      
      if (role === "Patient") {
        // Patient schema
        patients.push({
          patientId: userId,
          firstName: profile.firstName,
          lastName: profile.lastName,
          gender: gender,
          phone: profile.phone,
          email: profile.email,
          bloodGroup: bloodGroupShort,
          blood_group: bloodGroupLong,
          city: closestCity.name,
          state: closestCity.state,
          latitude: lat,
          longitude: lon,
          diagnosis: "Thalassemia Major",
          transfusionFreq: "Every 21 days",
          createdAt: new Date().toISOString()
        });
      } else {
        // Donor schema (Bridge Donor, Emergency Donor, Volunteer, Guest)
        const donationCount = parseInt(row.donations_till_date) || 0;
        const totalCalls = parseInt(row.total_calls) || 0;
        const frequencyInDays = parseInt(row.frequency_in_days) || 90;
        const registrationDate = row.registration_date ? row.registration_date.split(" ")[0] : "2023-01-01";
        const lastDonated = row.last_donation_date ? row.last_donation_date.split(" ")[0] : "2024-01-01";
        const lastContacted = row.last_contacted_date ? row.last_contacted_date.split(" ")[0] : "2024-01-01";
        const hasConditions = !!row.inactive_trigger_comment;
        
        // Randomly generate extended antigens compatibility profile
        const possibleAntigens = ["Anti-D", "Anti-E", "Anti-C", "Kell", "Duffy", "Kidd", "MNS", "Lewis"];
        const extendedAntigens = [];
        const hash = Math.abs(hashCode(userId));
        possibleAntigens.forEach((ant, idx) => {
          if ((hash + idx) % 7 === 0) {
            extendedAntigens.push(ant);
          }
        });

        donors.push({
          donorId: userId,
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          email: profile.email,
          age: 20 + (hash % 45), // 20 to 65
          gender: gender,
          bloodType: bloodGroupShort,
          bloodGroup: bloodGroupShort,
          blood_group: bloodGroupLong,
          city: closestCity.name,
          state: closestCity.state,
          latitude: lat,
          longitude: lon,
          donationCount: donationCount,
          lastDonated: lastDonated,
          registrationDate: registrationDate,
          lastContacted: lastContacted,
          hasConditions: hasConditions ? "yes" : "no",
          conditions: row.inactive_trigger_comment || null,
          availability: ["weekdays", "emergencies"],
          feedbackScore: parseFloat((3.8 + (hash % 13) / 10).toFixed(1)), // 3.8 to 5.0
          extendedAntigens: extendedAntigens,
          totalCalls: totalCalls,
          frequencyInDays: frequencyInDays
        });
      }
    }

    console.log(`Parsed ${donors.length} donors and ${patients.length} patients.`);
    
    // Chunked insertions for performance
    const chunkSize = 500;
    
    if (donors.length > 0) {
      console.log("Inserting donors in chunks...");
      for (let i = 0; i < donors.length; i += chunkSize) {
        const chunk = donors.slice(i, i + chunkSize);
        await db.collection("donors").insertMany(chunk);
      }
      console.log(`Successfully inserted ${donors.length} donors.`);
    }

    if (patients.length > 0) {
      console.log("Inserting patients in chunks...");
      for (let i = 0; i < patients.length; i += chunkSize) {
        const chunk = patients.slice(i, i + chunkSize);
        await db.collection("patients").insertMany(chunk);
      }
      console.log(`Successfully inserted ${patients.length} patients.`);
    }

    // 5. Generate Mock Transfusions for data richness
    const transfusions = [];
    let transIdCounter = 1;
    
    console.log("Generating mock transfusion history records...");
    for (const d of donors) {
      const donationCount = d.donationCount || 0;
      if (donationCount > 0) {
        const numTransfusions = Math.min(3, Math.max(1, Math.floor(Math.random() * 3) + 1));
        for (let i = 0; i < numTransfusions; i++) {
          const transfusionId = `TX-${10000 + transIdCounter++}`;
          const date = new Date(Date.now() - Math.floor(Math.random() * 365 * 2 * 24 * 60 * 60 * 1000))
            .toISOString()
            .split("T")[0];
          const hemoglobinBefore = parseFloat((6.5 + Math.random() * 2.5).toFixed(1));
          const hemoglobinAfter = parseFloat((9.5 + Math.random() * 2.5).toFixed(1));
          const units = Math.floor(Math.random() * 2) + 1;
          const outcome = Math.random() > 0.3 ? "Success" : "Good";
          
          transfusions.push({
            transfusionId,
            donorId: d.donorId,
            patientId: patients.length > 0 ? patients[Math.floor(Math.random() * patients.length)].patientId : "PAT-1001",
            date,
            hemoglobinBefore,
            hemoglobinAfter,
            units,
            outcome
          });
        }
      }
    }

    if (transfusions.length > 0) {
      console.log("Inserting transfusions in chunks...");
      for (let i = 0; i < transfusions.length; i += chunkSize) {
        const chunk = transfusions.slice(i, i + chunkSize);
        await db.collection("transfusions").insertMany(chunk);
      }
      console.log(`Successfully generated and inserted ${transfusions.length} mock transfusions.`);
    }
    
    console.log("Database Migration Completed Successfully!");
  } catch (e) {
    console.error("Migration script failed:", e);
  } finally {
    await client.close();
  }
}

run();
