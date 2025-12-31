import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) return cachedClient;

  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  await client.connect();
  cachedClient = client;
  return client;
}

export const handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const client = await connectToDatabase();
    const db = client.db("anniversary");
    const collection = db.collection("config");

    const qsp = event.queryStringParameters || {};
    const body = event.body ? JSON.parse(event.body) : {};

    const action = qsp.action || body.action;
    const config = body.config;

    if (action === "get") {
      const data = await collection.findOne({});
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data || {}),
      };
    }

    if (action === "save" || action === "migrate") {
      if (!config) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "No configuration data provided." }),
        };
      }

      await collection.updateOne({}, { $set: config }, { upsert: true });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: `Invalid action: ${action}` }),
    };
  } catch (err) {
    console.error("MongoDB Sync Error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Database operation failed",
        message: err.message,
      }),
    };
  }
};
