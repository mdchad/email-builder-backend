import { Table } from "sst/node/table";
import {DynamoDBClient, ScanCommand} from "@aws-sdk/client-dynamodb";
import { unmarshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient({ region: 'ap-southeast-1' }); // Set the region

export const handler = async (_evt) => {
  const params = {
    TableName: Table.TemplatesV2.tableName,
  };

  const command = new ScanCommand(params);

  let results
  try {
    results = await client.send(command);
    results = results.Items.map((item) => unmarshall(item));
    console.log("Items fetched successfully:", results);
  } catch (err) {
    console.error("Error fetching items:", err);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(results),
  };
};