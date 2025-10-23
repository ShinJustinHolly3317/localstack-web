import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';

@Injectable()
export class AwsService {
  private sqs: AWS.SQS;
  private sns: AWS.SNS;
  private region: string;
  private localstackHost: string;
  private localstackPort: string;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get('AWS_REGION') || 
                  this.configService.get('AWS_DEFAULT_REGION') || 
                  'ap-northeast-1';

    this.localstackHost = this.configService.get('LOCALSTACK_HOST') || 'localhost';
    this.localstackPort = this.configService.get('LOCALSTACK_PORT') || '4566';

    // Configure AWS SDK
    AWS.config.update({
      region: this.region,
      accessKeyId: 'test', // dummy credentials for LocalStack
      secretAccessKey: 'test',
    });

    // Initialize SQS client
    this.sqs = new AWS.SQS({ endpoint: `http://${this.localstackHost}:${this.localstackPort}` });

    // Initialize SNS client
    this.sns = new AWS.SNS({ endpoint: `http://${this.localstackHost}:${this.localstackPort}` });
  }

  getSqs(): AWS.SQS {
    return this.sqs;
  }

  getSns(): AWS.SNS {
    return this.sns;
  }

  getRegion(): string {
    return this.region;
  }

  getLocalstackEndpointBase(): string {
    return `http://${this.localstackHost}:${this.localstackPort}`;
  }
} 