import { Injectable, Logger } from '@nestjs/common';
import { AwsService } from '../common/services/aws.service';
import * as AWS from 'aws-sdk';

@Injectable()
export class SqsService {
  private readonly logger = new Logger(SqsService.name);

  constructor(private readonly awsService: AwsService) {}

  async listQueues(): Promise<{ queues: string[] }> {
    try {
      const sqs = this.awsService.getSqs();
      const data = await sqs.listQueues().promise();
      const queues = data.QueueUrls || [];

      this.logger.log(`[SQS Explorer] Queues fetched: ${queues.length} queues`);

      if (queues.length === 0) {
        this.logger.warn(`[SQS Explorer] No queues found for region ${this.awsService.getRegion()}`);
      }

      return { queues };
    } catch (error) {
      this.logger.error('Error listing queues:', error);
      throw error;
    }
  }

  async getQueueAttributes(url: string): Promise<{ attributes: AWS.SQS.QueueAttributeMap }> {
    try {
      const sqs = this.awsService.getSqs();
      const data = await sqs
        .getQueueAttributes({
          QueueUrl: url,
          AttributeNames: ['All'],
        })
        .promise();

      const attributes = data.Attributes || {};
      this.logger.log(`[SQS Explorer] Attributes for ${url}:`, attributes);

      return { attributes };
    } catch (error) {
      this.logger.error('Error getting queue attributes:', error);
      throw error;
    }
  }

  async updateQueueAttributes(url: string, attributes: Record<string, string>): Promise<{ ok: boolean }> {
    const writableAttributes = [
      'DelaySeconds',
      'MaximumMessageSize',
      'MessageRetentionPeriod',
      'Policy',
      'ReceiveMessageWaitTimeSeconds',
      'RedrivePolicy',
      'VisibilityTimeout',
      'KmsMasterKeyId',
      'KmsDataKeyReusePeriodSeconds',
      'ContentBasedDeduplication',
      'FifoThroughputLimit',
      'DeduplicationScope',
      'RedriveAllowPolicy',
      'SqsManagedSseEnabled',
    ];

    // Filter only writable attributes
    const filteredAttributes = Object.keys(attributes)
      .filter((k) => writableAttributes.includes(k))
      .reduce((obj, key) => {
        obj[key] = attributes[key];
        return obj;
      }, {});

    if (Object.keys(filteredAttributes).length === 0) {
      throw new Error('No writable attributes provided');
    }

    try {
      const sqs = this.awsService.getSqs();
      await sqs
        .setQueueAttributes({
          QueueUrl: url,
          Attributes: filteredAttributes,
        })
        .promise();

      this.logger.log(`[SQS Explorer] Updated attributes for ${url}:`, filteredAttributes);
      return { ok: true };
    } catch (error) {
      this.logger.error('Error updating queue attributes:', error);
      throw error;
    }
  }

  async sendMessage(
    url: string, 
    message: string, 
    messageGroupId?: string, 
    messageDeduplicationId?: string
  ): Promise<{ ok: boolean; messageId: string }> {
    try {
      const sqs = this.awsService.getSqs();
      const params: AWS.SQS.SendMessageRequest = {
        QueueUrl: url,
        MessageBody: message,
      };

      // If FIFO, require and set MessageGroupId
      if (url.endsWith('.fifo')) {
        if (!messageGroupId) {
          throw new Error('MessageGroupId is required for FIFO queues');
        }
        params.MessageGroupId = messageGroupId;
        
        // If ContentBasedDeduplication is not enabled, require MessageDeduplicationId
        if (messageDeduplicationId) {
          params.MessageDeduplicationId = messageDeduplicationId;
        }
      }

      const result = await sqs.sendMessage(params).promise();
      this.logger.log(`[SQS Explorer] Sent message to ${url}:`, message);
      
      return { ok: true, messageId: result.MessageId };
    } catch (error) {
      this.logger.error('Error sending message:', error);
      throw error;
    }
  }

  async peekMessages(url: string): Promise<{ messages: any[] }> {
    try {
      const sqs = this.awsService.getSqs();
      
      // Receive up to 5 messages, do not remove them
      const receiveParams: AWS.SQS.ReceiveMessageRequest = {
        QueueUrl: url,
        MaxNumberOfMessages: 5,
        VisibilityTimeout: 5, // seconds (short, but will reset to 1 below)
        WaitTimeSeconds: 0,
        AttributeNames: ['All'],
        MessageAttributeNames: ['All'],
      };

      const data = await sqs.receiveMessage(receiveParams).promise();
      this.logger.log('data', data);
      const messages = data.Messages || [];

      // Immediately reset visibility to 1 second for each message
      await Promise.all(
        messages.map((msg) =>
          sqs
            .changeMessageVisibility({
              QueueUrl: url,
              ReceiptHandle: msg.ReceiptHandle,
              VisibilityTimeout: 1,
            })
            .promise()
        )
      );

      return { messages:messages.map((msg) => ({
        messageId: msg.MessageId,
        body: msg.Body,
        attributes: msg.Attributes,
        messageAttributes: msg.MessageAttributes,
        })),
      };
    } catch (error) {
      this.logger.error('Error peeking messages:', error);
      throw error;
    }
  }

  async purgeQueue(url: string): Promise<{ ok: boolean }> {
    try {
      const sqs = this.awsService.getSqs();
      await sqs.purgeQueue({ QueueUrl: url }).promise();
      
      this.logger.log(`[SQS Explorer] Purged queue: ${url}`);
      return { ok: true };
    } catch (error) {
      this.logger.error('Error purging queue:', error);
      throw error;
    }
  }
} 