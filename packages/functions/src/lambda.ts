import { ApiHandler } from "sst/node/api";
import { Time } from "@email-builder/core/time";
import AWS from 'aws-sdk';

AWS.config.update({ region: 'ap-southeast-1' });

const options = {
  Source: 'support@pixelmindstudio.co',
  Destination: {
    ToAddresses: ['irsyad.muhd@gmail.com'],
  },
  Message: {
    Body: {
      Html: {
        Charset: 'UTF-8',
        Data: 'hello',
      },
    },
    Subject: {
      Charset: 'UTF-8',
      Data: 'hello world',
    },
  },
};

export const handler = ApiHandler(async (_evt) => {
  const sendPromise = new AWS.SES({ apiVersion: '2010-12-01' })
    .sendEmail(options)
    .promise();

  try {
    const data = await sendPromise
    console.log(data)
  } catch (e) {
    console.error(e)
  }

  return {
    body: `Hello world. The time is ${Time.now()}`,
  };
});
