import * as uuid from "uuid";
import { Table } from "sst/node/table";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb"; // ES Modules import
import AWS from "aws-sdk";
import {ApiHandler, useBody} from "sst/node/api";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const handler = ApiHandler(async (_evt) => {
  const body: string | undefined = useBody();
  const parsedBody: Record<any, any> = JSON.parse(body as string)

  const params = {
    // Get the table name from the environment variable
    TableName: Table.Templates.tableName,
    Item: {
      templateId: uuid.v1(), // A unique uuid
      templateName: parsedBody.name,
      username: "irsyad",
      data: parsedBody.data, // Parsed from request body
      createdAt: Date.now(),
    },
  };

  const data = await dynamoDb.put(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify(params.Item),
  };
});