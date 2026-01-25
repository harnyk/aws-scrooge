import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import type { ScanResult, LogGroup } from '../types.js';

export async function scanLogGroups(): Promise<ScanResult<LogGroup>> {
  const client = new CloudWatchLogsClient({});

  try {
    const logGroups: LogGroup[] = [];
    let nextToken: string | undefined;

    do {
      const response = await client.send(
        new DescribeLogGroupsCommand({
          nextToken,
        })
      );

      response.logGroups?.forEach((lg) => {
        logGroups.push({
          logGroupName: lg.logGroupName || 'Unknown',
          storedBytes: lg.storedBytes || 0,
          retentionDays: lg.retentionInDays || null,
        });
      });

      nextToken = response.nextToken;
    } while (nextToken);

    return {
      name: 'CloudWatch Log Groups',
      count: logGroups.length,
      resources: logGroups,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'CloudWatch Log Groups', count: 0, resources: [], error: message };
  }
}
