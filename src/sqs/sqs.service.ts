import { Injectable, Logger } from '@nestjs/common';
import { AwsService } from '../common/services/aws.service';
import * as AWS from 'aws-sdk';

@Injectable()
export class SqsService {
  private readonly logger = new Logger(SqsService.name);

  constructor(private readonly awsService: AwsService) {}

  private normalizeQueueUrl(url: string): string {
    if (!url) return url;
    const base = this.awsService.getLocalstackEndpointBase();
    if (url.includes('localhost.localstack.cloud')) {
      try {
        const u = new URL(url);
        return `${base}${u.pathname}`;
      } catch {
        return url;
      }
    }
    return url;
  }

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
      const queueUrl = this.normalizeQueueUrl(url);
      const data = await sqs
        .getQueueAttributes({
          QueueUrl: queueUrl,
          AttributeNames: ['All'],
        })
        .promise();

      const attributes = data.Attributes || {};
      this.logger.log(`[SQS Explorer] Attributes for ${queueUrl}:`, attributes);

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
      const queueUrl = this.normalizeQueueUrl(url);
      await sqs
        .setQueueAttributes({
          QueueUrl: queueUrl,
          Attributes: filteredAttributes,
        })
        .promise();

      this.logger.log(`[SQS Explorer] Updated attributes for ${queueUrl}:`, filteredAttributes);
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
      const queueUrl = this.normalizeQueueUrl(url);
      const params: AWS.SQS.SendMessageRequest = {
        QueueUrl: queueUrl,
        MessageBody: message,
      };

      // If FIFO, require and set MessageGroupId
      if (queueUrl.endsWith('.fifo')) {
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
      this.logger.log(`[SQS Explorer] Sent message to ${queueUrl}:`, message);
      
      return { ok: true, messageId: result.MessageId };
    } catch (error) {
      this.logger.error('Error sending message:', error);
      throw error;
    }
  }

  async peekMessages(url: string): Promise<{ messages: any[] }> {
    try {
      const sqs = this.awsService.getSqs();
      const queueUrl = this.normalizeQueueUrl(url);
      
      // Receive up to 5 messages, do not remove them
      const receiveParams: AWS.SQS.ReceiveMessageRequest = {
        QueueUrl: queueUrl,
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
              QueueUrl: queueUrl,
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
      const queueUrl = this.normalizeQueueUrl(url);
      await sqs.purgeQueue({ QueueUrl: queueUrl }).promise();
      
      this.logger.log(`[SQS Explorer] Purged queue: ${queueUrl}`);
      return { ok: true };
    } catch (error) {
      this.logger.error('Error purging queue:', error);
      throw error;
    }
  }
} 