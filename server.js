const express = require('express');
const AWS = require('aws-sdk');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // for parsing JSON bodies

// Allow region to be configured via env vars (default us-east-1)
const REGION =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-northeast-1';

// Point the AWS SDK to LocalStack
AWS.config.update({
  region: REGION,
  accessKeyId: 'test', // dummy credentials for LocalStack
  secretAccessKey: 'test',
});

// Allow overriding the LocalStack host/port (useful when running in Docker network)
const LOCALSTACK_HOST = process.env.LOCALSTACK_HOST || 'localhost';
const LOCALSTACK_PORT = process.env.LOCALSTACK_PORT || '4566';

const sqs = new AWS.SQS({
  endpoint: `http://${LOCALSTACK_HOST}:${LOCALSTACK_PORT}`,
});

// SNS client
const sns = new AWS.SNS({
  endpoint: `http://${LOCALSTACK_HOST}:${LOCALSTACK_PORT}`,
});

// List all queue URLs
app.get('/api/queues', async (req, res) => {
  try {
    const data = await sqs.listQueues().promise();
    const queues = data.QueueUrls || [];

    // Log the fetched queue URLs
    console.log('[SQS Explorer] Queues fetched:', queues);

    // Helpful log for debugging when no queues are returned
    if (queues.length === 0) {
      console.warn(`[SQS Explorer] No queues found for region ${REGION}`);
    }

    res.json({ queues });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch attributes for a specific queue
app.get('/api/queue', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const data = await sqs
      .getQueueAttributes({
        QueueUrl: url,
        AttributeNames: ['All'],
      })
      .promise();

    const attributes = data.Attributes || {};

    // Log attribute details for the queue
    console.log(`[SQS Explorer] Attributes for ${url}:`, attributes);

    res.json({ attributes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// List SNS topics
app.get('/api/sns', async (_req, res) => {
  try {
    const data = await sns.listTopics().promise();
    const topics = (data.Topics || []).map((t) => t.TopicArn);
    res.json({ topics });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Update attributes for a specific queue
app.post('/api/queue/attributes', async (req, res) => {
  const { url, attributes } = req.body || {};

  // Allow-list of attributes that can be modified via SetQueueAttributes
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

  if (!url || !attributes || typeof attributes !== 'object') {
    return res.status(400).json({ error: 'Missing url or attributes in body' });
  }

  try {
    // Filter only writable attributes
    const filteredAttributes = Object.keys(attributes)
      .filter((k) => writableAttributes.includes(k))
      .reduce((obj, key) => {
        obj[key] = attributes[key];
        return obj;
      }, {});

    if (Object.keys(filteredAttributes).length === 0) {
      return res.status(400).json({ error: 'No writable attributes provided' });
    }

    await sqs
      .setQueueAttributes({
        QueueUrl: url,
        Attributes: filteredAttributes,
      })
      .promise();

    console.log(
      `[SQS Explorer] Updated attributes for ${url}:`,
      filteredAttributes
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Send a message to a specific queue
app.post('/api/queue/send', async (req, res) => {
  const { url, message, messageGroupId, messageDeduplicationId } =
    req.body || {};
  if (!url || typeof message !== 'string') {
    return res.status(400).json({ error: 'Missing url or message in body' });
  }
  try {
    const params = {
      QueueUrl: url,
      MessageBody: message,
    };
    // If FIFO, require and set MessageGroupId
    if (url.endsWith('.fifo')) {
      if (!messageGroupId) {
        return res
          .status(400)
          .json({ error: 'MessageGroupId is required for FIFO queues' });
      }
      params.MessageGroupId = messageGroupId;
      // If ContentBasedDeduplication is not enabled, require MessageDeduplicationId
      if (messageDeduplicationId) {
        params.MessageDeduplicationId = messageDeduplicationId;
      }
    }
    const result = await sqs.sendMessage(params).promise();
    console.log(`[SQS Explorer] Sent message to ${url}:`, message);
    res.json({ ok: true, messageId: result.MessageId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get attributes for a specific SNS topic
app.get('/api/topic', async (req, res) => {
  const { arn } = req.query;
  if (!arn) {
    return res.status(400).json({ error: 'Missing arn parameter' });
  }

  try {
    const data = await sns.getTopicAttributes({ TopicArn: arn }).promise();
    res.json({ attributes: data.Attributes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// List SQS subscriptions for a topic
app.get('/api/topic-sqs-subs', async (req, res) => {
  const { arn } = req.query;
  if (!arn) return res.status(400).json({ error: 'Missing arn parameter' });
  try {
    const data = await sns
      .listSubscriptionsByTopic({ TopicArn: arn })
      .promise();
    const sqsSubs = (data.Subscriptions || []).filter(
      (sub) => sub.Protocol === 'sqs'
    );
    res.json({ sqs: sqsSubs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`LocalStack SQS web UI listening on http://localhost:${PORT}`);
});
