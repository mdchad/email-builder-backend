import AWS from "aws-sdk";
import { Table } from "sst/node/table";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const handler = async (_evt) => {
  const params = {
    // Get the table name from the environment variable
    TableName: Table.Templates.tableName,
    KeyConditionExpression: "username = :username",
    ExpressionAttributeValues: {
      ":username": "irsyad",
    },
  };
  const results = await dynamoDb.query(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify(results.Items),
  };
};