# Migration from Express.js to NestJS

## Overview
This project has been migrated from a simple Express.js application to a full-featured NestJS application with TypeScript support.

## Key Changes

### Project Structure
```
src/
├── main.ts                 # Application entry point
├── app.module.ts          # Root module
├── common/
│   └── services/
│       └── aws.service.ts # Shared AWS configuration
├── sqs/
│   ├── sqs.controller.ts  # SQS API endpoints
│   ├── sqs.service.ts     # SQS business logic
│   └── sqs.module.ts      # SQS module
└── sns/
    ├── sns.controller.ts  # SNS API endpoints
    ├── sns.service.ts     # SNS business logic
    └── sns.module.ts      # SNS module
```

### API Endpoints
All existing API endpoints are preserved with the same functionality:

#### SQS Endpoints
- `GET /api/queues` - List all queues
- `GET /api/queues/queue?url=<queue-url>` - Get queue attributes
- `POST /api/queues/queue/attributes` - Update queue attributes
- `POST /api/queues/queue/send` - Send message to queue
- `POST /api/queues/queue/messages` - Peek messages in queue

#### SNS Endpoints
- `GET /api/sns` - List all topics
- `GET /api/sns/topic?arn=<topic-arn>` - Get topic attributes
- `GET /api/sns/topic-sqs-subs?arn=<topic-arn>` - Get SQS subscriptions for topic

### Benefits of NestJS Migration

1. **TypeScript Support**: Full type safety and better IDE support
2. **Modular Architecture**: Clean separation of concerns with modules
3. **Dependency Injection**: Better testability and maintainability
4. **Built-in Validation**: Request validation and error handling
5. **Scalability**: Easy to add new features and modules
6. **Testing**: Built-in testing utilities and mocking support

### Development Commands

```bash
# Install dependencies
pnpm install

# Development mode with hot reload
pnpm run start:dev

# Production build
pnpm run build

# Start production server
pnpm run start:prod

# Run tests
pnpm test

# Format code
pnpm run format

# Lint code
pnpm run lint
```

### Environment Variables
The same environment variables are supported:
- `AWS_REGION` / `AWS_DEFAULT_REGION` - AWS region (default: ap-northeast-1)
- `LOCALSTACK_HOST` - LocalStack host (default: localhost)
- `LOCALSTACK_PORT` - LocalStack port (default: 4566)
- `PORT` - Application port (default: 3000)

### Docker
The Dockerfile has been updated to build the TypeScript application:
```bash
docker build -t localstack-web .
docker run -p 3000:3000 localstack-web
```

## Migration Notes

- All existing functionality has been preserved
- API endpoints remain the same for frontend compatibility
- Error handling has been improved with proper HTTP status codes
- Logging has been enhanced with NestJS Logger
- Code is now more maintainable and testable 