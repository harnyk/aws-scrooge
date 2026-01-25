import { DynamoDBClient, ListTablesCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { RedshiftClient, DescribeClustersCommand } from '@aws-sdk/client-redshift';
import type { ScanResult, DynamoDBTable, RedshiftCluster } from '../types.js';

export async function scanDynamoDBTables(): Promise<ScanResult<DynamoDBTable>> {
  const client = new DynamoDBClient({});

  try {
    const tables: DynamoDBTable[] = [];
    let lastEvaluatedTableName: string | undefined;

    do {
      const listResponse = await client.send(
        new ListTablesCommand({
          ExclusiveStartTableName: lastEvaluatedTableName,
        })
      );

      for (const tableName of listResponse.TableNames || []) {
        const describeResponse = await client.send(
          new DescribeTableCommand({
            TableName: tableName,
          })
        );

        const table = describeResponse.Table;
        if (table) {
          tables.push({
            tableName: table.TableName || 'Unknown',
            tableStatus: table.TableStatus || 'Unknown',
            itemCount: table.ItemCount || 0,
            tableSizeBytes: table.TableSizeBytes || 0,
          });
        }
      }

      lastEvaluatedTableName = listResponse.LastEvaluatedTableName;
    } while (lastEvaluatedTableName);

    return {
      name: 'DynamoDB Tables',
      count: tables.length,
      resources: tables,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'DynamoDB Tables', count: 0, resources: [], error: message };
  }
}

export async function scanRedshiftClusters(): Promise<ScanResult<RedshiftCluster>> {
  const client = new RedshiftClient({});

  try {
    const clusters: RedshiftCluster[] = [];
    let marker: string | undefined;

    do {
      const response = await client.send(
        new DescribeClustersCommand({
          Marker: marker,
        })
      );

      response.Clusters?.forEach((cluster) => {
        clusters.push({
          clusterIdentifier: cluster.ClusterIdentifier || 'Unknown',
          nodeType: cluster.NodeType || 'Unknown',
          numberOfNodes: cluster.NumberOfNodes || 0,
          clusterStatus: cluster.ClusterStatus || 'Unknown',
        });
      });

      marker = response.Marker;
    } while (marker);

    return {
      name: 'Redshift Clusters',
      count: clusters.length,
      resources: clusters,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'Redshift Clusters', count: 0, resources: [], error: message };
  }
}
