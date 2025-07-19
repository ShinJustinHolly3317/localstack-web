import { Injectable, Logger } from '@nestjs/common';
import { AwsService } from '../common/services/aws.service';
import * as AWS from 'aws-sdk';

@Injectable()
export class SnsService {
  private readonly logger = new Logger(SnsService.name);

  constructor(private readonly awsService: AwsService) {}

  async listTopics(): Promise<{ topics: string[] }> {
    try {
      const sns = this.awsService.getSns();
      const data = await sns.listTopics().promise();
      const topics = (data.Topics || []).map((t) => t.TopicArn);
      return { topics };
    } catch (error) {
      this.logger.error('Error listing SNS topics:', error);
      throw error;
    }
  }

  async getTopicAttributes(arn: string): Promise<{ attributes: AWS.SNS.TopicAttributesMap }> {
    try {
      const sns = this.awsService.getSns();
      const data = await sns.getTopicAttributes({ TopicArn: arn }).promise();
      return { attributes: data.Attributes };
    } catch (error) {
      this.logger.error('Error getting topic attributes:', error);
      throw error;
    }
  }

  async getTopicSqsSubscriptions(arn: string): Promise<{ sqs: AWS.SNS.Subscription[] }> {
    try {
      const sns = this.awsService.getSns();
      const data = await sns.listSubscriptionsByTopic({ TopicArn: arn }).promise();
      const sqsSubs = (data.Subscriptions || []).filter(
        (sub) => sub.Protocol === 'sqs'
      );
      return { sqs: sqsSubs };
    } catch (error) {
      this.logger.error('Error getting topic SQS subscriptions:', error);
      throw error;
    }
  }
} 