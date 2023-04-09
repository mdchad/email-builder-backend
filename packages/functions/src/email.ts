import {ApiHandler, useBody} from "sst/node/api";
import { Time } from "@email-builder/core/time";
import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";

const sesClient = new SESClient({ region: 'ap-southeast-1' });

export const handler = ApiHandler(async (_evt) => {
  const body = useBody();
  const parsedBody: { html: string } = JSON.parse(body as string)

  const createSendEmailCommand = (toAddress, fromAddress) => {
    return new SendEmailCommand({
      Destination: {
        /* required */
        CcAddresses: [
          /* more items */
        ],
        ToAddresses: [
          toAddress,
          /* more To-email addresses */
        ],
      },
      Message: {
        /* required */
        Body: {
          /* required */
          Html: {
            Charset: "UTF-8",
            Data: parsedBody?.html,
          }
        },
        Subject: {
          Charset: "UTF-8",
          Data: "Email template test",
        },
      },
      Source: fromAddress,
      ReplyToAddresses: [
        /* more items */
      ],
    });
  };

  const sendEmailCommand = createSendEmailCommand(
    "dev@pixelmindstudio.co",
    "support@pixelmindstudio.co"
  );

  try {
    await sesClient.send(sendEmailCommand);
  } catch (e) {
    console.error("Failed to send email.");
  }

  return {
    body: `Email sent. ${Time.now()}`,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    }
  };
});
