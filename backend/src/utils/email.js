import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { logger } from './logger.js';

const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const params = {
      Source: `${process.env.AWS_SES_FROM_NAME} <${process.env.AWS_SES_FROM_EMAIL}>`,
      Destination: {
        ToAddresses: Array.isArray(to) ? to : [to]
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8'
        },
        Body: {
          ...(html && {
            Html: {
              Data: html,
              Charset: 'UTF-8'
            }
          }),
          ...(text && {
            Text: {
              Data: text,
              Charset: 'UTF-8'
            }
          })
        }
      }
    };

    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);
    
    logger.info('Email sent successfully', { messageId: result.MessageId });
    return result;
  } catch (error) {
    logger.error('Error sending email', { error });
    throw new Error('Failed to send email');
  }
}; 