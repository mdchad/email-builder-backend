import {StackContext, Api, Table, StaticSite} from "sst/constructs";
import * as iam from "aws-cdk-lib/aws-iam";

export function API({ stack, app }: StackContext) {
  const table = new Table(stack, "TemplatesV2", {
    fields: {
      templateId: "string",
      username: "string",
      name: "string",
      data: "string",
      createdAt: "number"
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
              "arn:aws:ses:ap-southeast-1:391537862305:identity/dev@pixelmindstudio.co"
            ],
          }),
        ]
      },
    },
    routes: {
      "GET /": "packages/functions/src/list.handler",
      "POST /": "packages/functions/src/create.handler",
      "DELETE /{id}": "packages/functions/src/delete.handler",
      "POST /email": "packages/functions/src/email.handler"
    },
  });

  const web = new StaticSite(stack, "web", {
    path: "packages/web",
    buildOutput: "build",
    buildCommand: "npm run build",
    environment: {
      REACT_APP_API_URL: api.url
    },
  });

  stack.addOutputs({
    ApiEndpoint: api.url,
    SiteUrl: web.url
  });
}
