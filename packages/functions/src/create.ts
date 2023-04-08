import AWS from "aws-sdk";
import * as uuid from "uuid";
import { Table } from "sst/node/table";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

import {ApiHandler, useBody} from "sst/node/api";

export const handler = ApiHandler(async (_evt) => {
  const body = useBody();

  const params = {
    // Get the table name from the environment variable
    TableName: Table.Templates.tableName,
    Item: {
      templateId: uuid.v1(), // A unique uuid
      data: body, // Parsed from request body
      createdAt: Date.now(),
    },
  };

  const data = await dynamoDb.put(params).promise();
  console.log(data)

  return {
    statusCode: 200,
    body: JSON.stringify(params.Item),
  };
});