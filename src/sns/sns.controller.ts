import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { SnsService } from './sns.service';

@Controller()
export class SnsController {
  constructor(private readonly snsService: SnsService) {}

  @Get('sns')
  async listTopics() {
    try {
      return await this.snsService.listTopics();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('topic')
  async getTopicAttributes(@Query('arn') arn: string) {
    if (!arn) {
      throw new HttpException('Missing arn parameter', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.snsService.getTopicAttributes(arn);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('topic-sqs-subs')
  async getTopicSqsSubscriptions(@Query('arn') arn: string) {
    if (!arn) {
      throw new HttpException('Missing arn parameter', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.snsService.getTopicSqsSubscriptions(arn);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 