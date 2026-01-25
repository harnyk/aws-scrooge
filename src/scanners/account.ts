import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import type { AccountInfo } from '../types.js';

export async function getAccountInfo(): Promise<AccountInfo> {
  const client = new STSClient({});

  const response = await client.send(new GetCallerIdentityCommand({}));

  return {
    accountId: response.Account || 'Unknown',
    arn: response.Arn || 'Unknown',
    userId: response.UserId || 'Unknown',
  };
}
