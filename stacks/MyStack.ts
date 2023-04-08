import { Config, StackContext, Api } from "sst/constructs";
import * as iam from "aws-cdk-lib/aws-iam";

export function API({ stack }: StackContext) {
  const api = new Api(stack, "api", {
    cors: {
      allowHeaders: ["*"],
      allowMethods: ["ANY"],
      allowOrigins: ["*"],
    },
    routes: {
      "GET /": "packages/functions/src/lambda.handler",
      "POST /email": "packages/functions/src/email.handler",
    },
    defaults: {
      function: {
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
        ],
      },
    },
  });
  stack.addOutputs({
    ApiEndpoint: api.url,
  });
}
