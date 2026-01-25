import { SQSClient, ListQueuesCommand } from '@aws-sdk/client-sqs';
import { SNSClient, ListTopicsCommand } from '@aws-sdk/client-sns';
import { KinesisClient, ListStreamsCommand, DescribeStreamSummaryCommand } from '@aws-sdk/client-kinesis';
import type { ScanResult, SQSQueue, SNSTopic, KinesisStream } from '../types.js';

export async function scanSQSQueues(): Promise<ScanResult<SQSQueue>> {
  const client = new SQSClient({});

  try {
    const queues: SQSQueue[] = [];
    let nextToken: string | undefined;

    do {
      const response = await client.send(
        new ListQueuesCommand({
          NextToken: nextToken,
        })
      );

      response.QueueUrls?.forEach((queueUrl) => {
        const queueName = queueUrl.split('/').pop() || 'Unknown';
        queues.push({
          queueUrl,
          queueName,
        });
      });

      nextToken = response.NextToken;
    } while (nextToken);

    return {
      name: 'SQS Queues',
      count: queues.length,
      resources: queues,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'SQS Queues', count: 0, resources: [], error: message };
  }
}

export async function scanSNSTopics(): Promise<ScanResult<SNSTopic>> {
  const client = new SNSClient({});

  try {
    const topics: SNSTopic[] = [];
    let nextToken: string | undefined;

    do {
      const response = await client.send(
        new ListTopicsCommand({
          NextToken: nextToken,
        })
      );

      response.Topics?.forEach((topic) => {
        const topicArn = topic.TopicArn || 'Unknown';
        const topicName = topicArn.split(':').pop() || 'Unknown';
        topics.push({
          topicArn,
          topicName,
        });
      });

      nextToken = response.NextToken;
    } while (nextToken);

    return {
      name: 'SNS Topics',
      count: topics.length,
      resources: topics,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'SNS Topics', count: 0, resources: [], error: message };
  }
}

export async function scanKinesisStreams(): Promise<ScanResult<KinesisStream>> {
  const client = new KinesisClient({});

  try {
    const streams: KinesisStream[] = [];
    let exclusiveStartStreamName: string | undefined;

    do {
      const listResponse = await client.send(
        new ListStreamsCommand({
          ExclusiveStartStreamName: exclusiveStartStreamName,
        })
      );

      for (const streamName of listResponse.StreamNames || []) {
        const describeResponse = await client.send(
          new DescribeStreamSummaryCommand({
            StreamName: streamName,
          })
        );

        const summary = describeResponse.StreamDescriptionSummary;
        if (summary) {
          streams.push({
            streamName: summary.StreamName || 'Unknown',
            status: summary.StreamStatus || 'Unknown',
            shardCount: summary.OpenShardCount || 0,
          });
        }
      }

      if (listResponse.HasMoreStreams) {
        const streamNames = listResponse.StreamNames || [];
        exclusiveStartStreamName = streamNames[streamNames.length - 1];
      } else {
        exclusiveStartStreamName = undefined;
      }
    } while (exclusiveStartStreamName);

    return {
      name: 'Kinesis Streams',
      count: streams.length,
      resources: streams,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'Kinesis Streams', count: 0, resources: [], error: message };
  }
}
