import {
  EFSClient,
  DescribeFileSystemsCommand,
} from '@aws-sdk/client-efs';
import type { ScanResult, EFSFileSystem } from '../types.js';

export async function scanEFSFileSystems(): Promise<ScanResult<EFSFileSystem>> {
  const client = new EFSClient({});

  try {
    const fileSystems: EFSFileSystem[] = [];
    let marker: string | undefined;

    do {
      const response = await client.send(
        new DescribeFileSystemsCommand({
          Marker: marker,
        })
      );

      response.FileSystems?.forEach((fs) => {
        fileSystems.push({
          fileSystemId: fs.FileSystemId || 'Unknown',
          name: fs.Name || '-',
          lifeCycleState: fs.LifeCycleState || 'Unknown',
          sizeInBytes: fs.SizeInBytes?.Value || 0,
        });
      });

      marker = response.NextMarker;
    } while (marker);

    return {
      name: 'EFS File Systems',
      count: fileSystems.length,
      resources: fileSystems,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'EFS File Systems', count: 0, resources: [], error: message };
  }
}
