import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SqsModule } from './sqs/sqs.module';
import { SnsModule } from './sns/sns.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SqsModule,
    SnsModule,
  ],
})
export class AppModule {} 