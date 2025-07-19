import { Controller, Get, Post, Query, Body, HttpException, HttpStatus } from '@nestjs/common';
import { SqsService } from './sqs.service';

@Controller()
export class SqsController {
  constructor(private readonly sqsService: SqsService) {}

  @Get('queues')
  async listQueues() {
    try {
      return await this.sqsService.listQueues();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('queue')
  async getQueueAttributes(@Query('url') url: string) {
    if (!url) {
      throw new HttpException('Missing url parameter', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.sqsService.getQueueAttributes(url);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('queue/attributes')
  async updateQueueAttributes(@Body() body: { url: string; attributes: Record<string, string> }) {
    const { url, attributes } = body;

    if (!url || !attributes || typeof attributes !== 'object') {
      throw new HttpException('Missing url or attributes in body', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.sqsService.updateQueueAttributes(url, attributes);
    } catch (error) {
      if (error.message === 'No writable attributes provided') {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('queue/send')
  async sendMessage(@Body() body: { 
    url: string; 
    message: string; 
    messageGroupId?: string; 
    messageDeduplicationId?: string 
  }) {
    const { url, message, messageGroupId, messageDeduplicationId } = body;

    if (!url || typeof message !== 'string') {
      throw new HttpException('Missing url or message in body', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.sqsService.sendMessage(url, message, messageGroupId, messageDeduplicationId);
    } catch (error) {
      if (error.message === 'MessageGroupId is required for FIFO queues') {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('queue/messages')
  async peekMessages(@Body() body: { url: string }) {
    const { url } = body;

    if (!url) {
      throw new HttpException('Missing url in body', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.sqsService.peekMessages(url);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('queue/purge')
  async purgeQueue(@Body() body: { url: string }) {
    const { url } = body;

    if (!url) {
      throw new HttpException('Missing url in body', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.sqsService.purgeQueue(url);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 