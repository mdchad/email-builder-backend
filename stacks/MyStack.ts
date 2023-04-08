import { StackContext, Api, Table } from "sst/constructs";
import * as iam from "aws-cdk-lib/aws-iam";

export function API({ stack, app }: StackContext) {
  const table = new Table(stack, "Templates", {
    fields: {
      templateId: "string",
      data: "string"
    },
    primaryIndex: { partitionKey: "templateId" },
  });

  const api = new Api(stack, "api", {
    cors: {
      allowHeaders: ["*"],
      allowMethods: ["ANY"],
      allowOrigins: ["*"],
    },
    defaults: {
      function: {
        bind: [table],
        permissions: [
          new iam.PolicyStatement({
            actions: ["ses:*"],
            effect: iam.Effect.ALLOW,
            resources: [
              // From AWS's SES console. You'll find a copy-pastable ARN
              // under "Verified identities"
              "arn:aws:ses:ap-southeast-1:391537862305:identity/support@pixelmindstudio.co",
              "arn:aws:ses:ap-southeast-1:391537862305:identity/irsyad.muhd@gmail.com"
            ],
          }),
        ]
      },
    },
    routes: {
      "GET /": "packages/functions/src/lambda.handler",
      "POST /": "packages/functions/src/create.handler",
      "POST /email": "packages/functions/src/email.handler",
    },
  });
  stack.addOutputs({
    ApiEndpoint: api.url,
  });
}
