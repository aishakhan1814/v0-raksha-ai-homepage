import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = process.env.RAKSHA_AWS_REGION || process.env.AWS_REGION || "ap-south-1";
const accessKeyId = process.env.RAKSHA_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.RAKSHA_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

if (!accessKeyId || !secretAccessKey) {
  console.warn("AWS Credentials not fully configured in environment variables!");
}

const client = new DynamoDBClient({
  region,
  credentials: {
    accessKeyId: accessKeyId || "",
    secretAccessKey: secretAccessKey || "",
  },
});

export const db = DynamoDBDocumentClient.from(client);
