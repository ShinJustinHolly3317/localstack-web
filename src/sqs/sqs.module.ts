import { Module } from '@nestjs/common';
import { SqsController } from './sqs.controller';
import { SqsService } from './sqs.service';
import { AwsService } from '../common/services/aws.service';

@Module({
  controllers: [SqsController],
  providers: [SqsService, AwsService],
})
export class SqsModule {} 