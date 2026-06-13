const { MongoClient } = require("mongodb");

const MONGODB_URI = "mongodb://ashwathjelloji2468_db_user:VXRv4jS56kx7CJrt@ac-ij0mwzy-shard-00-00.g6saax8.mongodb.net:27017,ac-ij0mwzy-shard-00-01.g6saax8.mongodb.net:27017,ac-ij0mwzy-shard-00-02.g6saax8.mongodb.net:27017/raksha?ssl=true&replicaSet=atlas-tt7k0u-shard-0&authSource=admin&appName=Cluster1";

async function main() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const adminDb = client.db().admin();
    const dbs = await adminDb.listDatabases();
    console.log("Databases:", dbs.databases.map(d => d.name));
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

main();
