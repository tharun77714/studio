const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://chowdaryvarun45_db_user:tharun12344@cluster0.solmlht.mongodb.net/?appName=Cluster0";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Successfully connected to MongoDB!");
    // You can also list databases to be extra sure
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    console.log("Available databases:", dbs.databases.map(db => db.name).join(", "));
  } catch (error) {
    console.error("Connection failed:", error.message);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
