import { Table } from "sst/node/table";
import {DynamoDBClient, ScanCommand} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: 'ap-southeast-1' }); // Set the region

export const handler = async (_evt) => {
  const params = {
    TableName: Table.TemplatesV2.tableName,
  };

  const command = new ScanCommand(params);

  let results
  try {
    results = await client.send(command);
    console.log("Items fetched successfully:", results.Items);
  } catch (err) {
    console.error("Error fetching items:", err);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(results.Items),
  };
};