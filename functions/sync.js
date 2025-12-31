const { MongoClient } = require('mongodb');

/**
 * MongoDB Atlas Connection String provided by user.
 * Database name 'anniversary' is used for the collection store.
 */
const MONGODB_URI = "mongodb+srv://app_admin:ankur@cluster0.3nmgy2b.mongodb.net/anniversary?retryWrites=true&w=majority&appName=Cluster0";

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient && cachedClient.topology && cachedClient.topology.isConnected()) {
    return cachedClient;
  }
  
  const client = new MongoClient(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
  });
  
  await client.connect();
  cachedClient = client;
  return client;
}

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const client = await connectToDatabase();
    const db = client.db("anniversary");
    const collection = db.collection("config");

    const qsp = event.queryStringParameters || {};
    let body = {};
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch (e) {}

    const action = qsp.action || body.action;
    const config = body.config;

    if (action === 'get') {
      const data = await collection.findOne({});
      // Return empty object if no config exists yet
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data || {})
      };
    }

    if (action === 'save' || action === 'migrate') {
      if (!config) {
        return { 
          statusCode: 400, 
          headers, 
          body: JSON.stringify({ error: "No configuration data provided." }) 
        };
      }
      
      // Update the single configuration document
      await collection.updateOne({}, { $set: config }, { upsert: true });
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, timestamp: new Date().toISOString() })
      };
    }

    return { 
      statusCode: 400, 
      headers, 
      body: JSON.stringify({ error: `Invalid action: ${action}` }) 
    };
  } catch (err) {
    console.error("MongoDB Sync Error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "Database operation failed.", 
        message: err.message 
      })
    };
  }
};