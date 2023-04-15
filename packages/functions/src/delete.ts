import { Table } from "sst/node/table";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb"; // ES Modules import
import {ApiHandler, useBody, usePathParam} from "sst/node/api";
const { DynamoDBClient, DeleteItemCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({ region: "ap-southeast-1" });

interface TemplateBody {
  name: string;
  data: object;
  templateId: string
}

export const handler = ApiHandler(async (_evt) => {
  const id = usePathParam("id");

  const params = {
    // Get the table name from the environment variable
    TableName: Table.TemplatesV2.tableName,
    Key: {
      "templateId": { S: id as string }
    },
    ReturnValues: "ALL_OLD"
  };

  const command = new DeleteItemCommand(params);

  try {
    const data = await client.send(command);
    console.log("Item deleted successfully:", data);
    return {
      statusCode: 200,
      body: "Item deleted successfully",
    };
  } catch (err) {
    console.error("Error deleting item:", err);
    return {
      statusCode: 400,
      body: err
    }
  }
});