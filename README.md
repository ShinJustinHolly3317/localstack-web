# LocalStack SQS Web UI

A lightweight web interface to browse and edit Amazon SQS queue attributes when using [LocalStack](https://github.com/localstack/localstack).

## Features

- List all queues running in your LocalStack instance
- View queue attributes in a friendly table (akin to AWS console)
- Inline editing of writable attributes with validation
- Search bar & auto-refresh
- Loader overlay and success toast for smooth UX

## Getting Started

### Prerequisites

- Node.js 16+
- A running LocalStack container exposing SQS (default port **4566**)

### Installation

```bash
cd localstack-web
pnpm install
```

### Running

```bash
# on host machine
AWS_REGION=ap-northeast-1 pnpm start
```

Open `http://localhost:3001` (or the port you configured) in your browser.

### Docker Compose Service

Add this snippet to your `docker-compose.yml` if you prefer to run in the same network as LocalStack:

```yaml
  localstack-web:
    build: ./localstack-web
    environment:
      - LOCALSTACK_HOST=localstack      # match your LocalStack service name
      - AWS_REGION=ap-northeast-1
    ports:
      - "3001:3001"
    depends_on:
      - localstack
```

## Development

The backend lives in `server.js` (Express + AWS SDK v2). Static assets are served from `public/`.

Feel free to open issues or PRs for improvements! ✨ 