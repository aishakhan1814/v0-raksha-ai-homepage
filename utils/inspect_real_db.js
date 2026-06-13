const { MongoClient } = require("mongodb");

const MONGODB_URI = "mongodb://ashwathjelloji2468_db_user:VXRv4jS56kx7CJrt@ac-ij0mwzy-shard-00-00.g6saax8.mongodb.net:27017,ac-ij0mwzy-shard-00-01.g6saax8.mongodb.net:27017,ac-ij0mwzy-shard-00-02.g6saax8.mongodb.net:27017/raksha?ssl=true&replicaSet=atlas-tt7k0u-shard-0&authSource=admin&appName=Cluster1";

async function main() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db("raksha");
    
    console.log("--- DONORS COLLECTION ---");
    const donors = await db.collection("donors").find({}).limit(5).toArray();
    console.log("Donors count:", await db.collection("donors").countDocuments());
    console.log("Donors samples:", JSON.stringify(donors, null, 2));

    console.log("--- PATIENTS COLLECTION ---");
    const patients = await db.collection("patients").find({}).limit(5).toArray();
    console.log("Patients count:", await db.collection("patients").countDocuments());
    console.log("Patients samples:", JSON.stringify(patients, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

main();
