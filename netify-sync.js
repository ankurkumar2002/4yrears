
/**
 * Netlify Function: sync.js
 * 
 * INSTRUCTIONS:
 * 1. Create a folder named 'netlify/functions' in your project root.
 * 2. Save this file as 'sync.js' inside that folder.
 * 3. Netlify will automatically deploy this as an endpoint at /.netlify/functions/sync
 */

const { MongoClient } = require('mongodb');

// Use the URI you provided
const MONGODB_URI = "mongodb+srv://app_admin:ankur@cluster0.abcd.mongodb.net/anniversary?retryWrites=true&w=majority";

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

exports.handler = async (event) => {
  try {
    const client = await connectToDatabase();
    const db = client.db("anniversary");
    const collection = db.collection("config");

    const { action, config } = event.queryStringParameters.action ? event.queryStringParameters : JSON.parse(event.body || '{}');
    const actualAction = action || event.queryStringParameters.action;

    if (actualAction === 'get') {
      const data = await collection.findOne({});
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data || {})
      };
    }

    if (actualAction === 'save' || actualAction === 'migrate') {
      const parsedBody = JSON.parse(event.body);
      await collection.updateOne({}, { $set: parsedBody.config }, { upsert: true });
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    }

    return { statusCode: 400, body: "Invalid Action" };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
