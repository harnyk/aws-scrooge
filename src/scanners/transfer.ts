import { TransferClient, ListServersCommand, DescribeServerCommand } from '@aws-sdk/client-transfer';
import type { ScanResult, TransferServer } from '../types.js';

export async function scanTransferServers(): Promise<ScanResult<TransferServer>> {
  const client = new TransferClient({});

  try {
    const servers: TransferServer[] = [];
    let nextToken: string | undefined;

    do {
      const response = await client.send(
        new ListServersCommand({
          NextToken: nextToken,
        })
      );

      for (const server of response.Servers || []) {
        if (server.ServerId) {
          const describeResponse = await client.send(
            new DescribeServerCommand({
              ServerId: server.ServerId,
            })
          );

          const details = describeResponse.Server;
          servers.push({
            serverId: server.ServerId,
            state: details?.State || 'Unknown',
            endpointType: details?.EndpointType || 'Unknown',
            protocols: details?.Protocols || [],
          });
        }
      }

      nextToken = response.NextToken;
    } while (nextToken);

    return {
      name: 'Transfer Family Servers',
      count: servers.length,
      resources: servers,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'Transfer Family Servers', count: 0, resources: [], error: message };
  }
}
