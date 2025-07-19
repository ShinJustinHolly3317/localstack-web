import { Module } from '@nestjs/common';
import { SnsController } from './sns.controller';
import { SnsService } from './sns.service';
import { AwsService } from '../common/services/aws.service';

@Module({
  controllers: [SnsController],
  providers: [SnsService, AwsService],
})
export class SnsModule {} 