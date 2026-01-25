import { LambdaClient, ListFunctionsCommand } from '@aws-sdk/client-lambda';
import type { ScanResult, LambdaFunction } from '../types.js';

export async function scanLambdaFunctions(): Promise<ScanResult<LambdaFunction>> {
  const client = new LambdaClient({});

  try {
    const functions: LambdaFunction[] = [];
    let marker: string | undefined;

    do {
      const response = await client.send(
        new ListFunctionsCommand({
          Marker: marker,
        })
      );

      response.Functions?.forEach((fn) => {
        functions.push({
          functionName: fn.FunctionName || 'Unknown',
          runtime: fn.Runtime || 'Unknown',
          memorySize: fn.MemorySize || 0,
          lastModified: fn.LastModified || 'Unknown',
        });
      });

      marker = response.NextMarker;
    } while (marker);

    return {
      name: 'Lambda Functions',
      count: functions.length,
      resources: functions,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'Lambda Functions', count: 0, resources: [], error: message };
  }
}
