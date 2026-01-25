import {
  SecretsManagerClient,
  ListSecretsCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  KMSClient,
  ListKeysCommand,
  DescribeKeyCommand,
} from '@aws-sdk/client-kms';
import type { ScanResult, Secret, KMSKey } from '../types.js';

export async function scanSecrets(): Promise<ScanResult<Secret>> {
  const client = new SecretsManagerClient({});

  try {
    const secrets: Secret[] = [];
    let nextToken: string | undefined;

    do {
      const response = await client.send(
        new ListSecretsCommand({
          NextToken: nextToken,
        })
      );

      response.SecretList?.forEach((secret) => {
        secrets.push({
          name: secret.Name || 'Unknown',
          lastAccessedDate: secret.LastAccessedDate?.toISOString() || 'Never',
          lastChangedDate: secret.LastChangedDate?.toISOString() || 'Unknown',
        });
      });

      nextToken = response.NextToken;
    } while (nextToken);

    return {
      name: 'Secrets Manager Secrets',
      count: secrets.length,
      resources: secrets,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'Secrets Manager Secrets', count: 0, resources: [], error: message };
  }
}

export async function scanKMSKeys(): Promise<ScanResult<KMSKey>> {
  const client = new KMSClient({});

  try {
    const keys: KMSKey[] = [];
    let marker: string | undefined;

    do {
      const response = await client.send(
        new ListKeysCommand({
          Marker: marker,
        })
      );

      for (const keyEntry of response.Keys || []) {
        if (keyEntry.KeyId) {
          const describeResponse = await client.send(
            new DescribeKeyCommand({
              KeyId: keyEntry.KeyId,
            })
          );

          const metadata = describeResponse.KeyMetadata;
          if (metadata && metadata.KeyManager === 'CUSTOMER') {
            keys.push({
              keyId: metadata.KeyId || 'Unknown',
              description: metadata.Description || '-',
              keyState: metadata.KeyState || 'Unknown',
            });
          }
        }
      }

      marker = response.NextMarker;
    } while (marker);

    return {
      name: 'KMS Keys (Customer Managed)',
      count: keys.length,
      resources: keys,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'KMS Keys (Customer Managed)', count: 0, resources: [], error: message };
  }
}
