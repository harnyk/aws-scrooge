import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSnapshotsCommand,
} from '@aws-sdk/client-rds';
import type { ScanResult, RDSInstance, RDSSnapshot } from '../types.js';

export async function scanRDSInstances(): Promise<ScanResult<RDSInstance>> {
  const client = new RDSClient({});

  try {
    const response = await client.send(new DescribeDBInstancesCommand({}));

    const instances: RDSInstance[] =
      response.DBInstances?.map((instance) => ({
        dbInstanceId: instance.DBInstanceIdentifier || 'Unknown',
        engine: instance.Engine || 'Unknown',
        instanceClass: instance.DBInstanceClass || 'Unknown',
        status: instance.DBInstanceStatus || 'Unknown',
      })) || [];

    return {
      name: 'RDS Instances',
      count: instances.length,
      resources: instances,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'RDS Instances', count: 0, resources: [], error: message };
  }
}

export async function scanRDSSnapshots(): Promise<ScanResult<RDSSnapshot>> {
  const client = new RDSClient({});

  try {
    const response = await client.send(
      new DescribeDBSnapshotsCommand({
        SnapshotType: 'manual',
      })
    );

    const snapshots: RDSSnapshot[] =
      response.DBSnapshots?.map((snapshot) => ({
        snapshotId: snapshot.DBSnapshotIdentifier || 'Unknown',
        dbInstanceId: snapshot.DBInstanceIdentifier || 'Unknown',
        engine: snapshot.Engine || 'Unknown',
        snapshotCreateTime: snapshot.SnapshotCreateTime?.toISOString() || 'Unknown',
      })) || [];

    return {
      name: 'RDS Snapshots',
      count: snapshots.length,
      resources: snapshots,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'RDS Snapshots', count: 0, resources: [], error: message };
  }
}
