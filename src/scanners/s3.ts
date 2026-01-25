import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import type { ScanResult, S3Bucket } from '../types.js';

export async function scanS3Buckets(): Promise<ScanResult<S3Bucket>> {
  const client = new S3Client({});

  try {
    const response = await client.send(new ListBucketsCommand({}));

    const buckets: S3Bucket[] =
      response.Buckets?.map((bucket) => ({
        name: bucket.Name || 'Unknown',
        creationDate: bucket.CreationDate?.toISOString() || 'Unknown',
      })) || [];

    return {
      name: 'S3 Buckets',
      count: buckets.length,
      resources: buckets,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'S3 Buckets', count: 0, resources: [], error: message };
  }
}
