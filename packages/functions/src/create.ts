import * as uuid from "uuid";
import { Table } from "sst/node/table";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb"; // ES Modules import
import {ApiHandler, useBody} from "sst/node/api";
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({ region: "ap-southeast-1" });

interface TemplateBody {
  name: string;
  data: object
}

export const handler = ApiHandler(async (_evt) => {
  const body: string | undefined = useBody();
  const parsedBody: TemplateBody = JSON.parse(body as string)

  const params = {
    // Get the table name from the environment variable
    TableName: Table.TemplatesV2.tableName,
    Item: {
      "templateId": { S: uuid.v1() },
      "username": { S: "irsyad" },
      "name": { S: parsedBody.name },
      "data": { S: JSON.stringify(parsedBody.data) },
      "createdAt": { N: Date.now().toString() },
    },
  };

  const command = new PutItemCommand(params);

  try {
    const data = await client.send(command);
    console.log("Item created successfully:", data);
  } catch (err) {
    console.error("Error creating item:", err);
  }
  return {
    statusCode: 200,
    body: JSON.stringify(params.Item),
  };
});