import { APIGatewayClient, GetRestApisCommand } from '@aws-sdk/client-api-gateway';
import { ApiGatewayV2Client, GetApisCommand } from '@aws-sdk/client-apigatewayv2';
import type { ScanResult, APIGatewayREST, APIGatewayHTTP } from '../types.js';

export async function scanAPIGatewayREST(): Promise<ScanResult<APIGatewayREST>> {
  const client = new APIGatewayClient({});

  try {
    const apis: APIGatewayREST[] = [];
    let position: string | undefined;

    do {
      const response = await client.send(
        new GetRestApisCommand({
          position,
        })
      );

      response.items?.forEach((api) => {
        apis.push({
          id: api.id || 'Unknown',
          name: api.name || 'Unknown',
          createdDate: api.createdDate?.toISOString() || 'Unknown',
        });
      });

      position = response.position;
    } while (position);

    return {
      name: 'API Gateway REST APIs',
      count: apis.length,
      resources: apis,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'API Gateway REST APIs', count: 0, resources: [], error: message };
  }
}

export async function scanAPIGatewayHTTP(): Promise<ScanResult<APIGatewayHTTP>> {
  const client = new ApiGatewayV2Client({});

  try {
    const apis: APIGatewayHTTP[] = [];
    let nextToken: string | undefined;

    do {
      const response = await client.send(
        new GetApisCommand({
          NextToken: nextToken,
        })
      );

      response.Items?.forEach((api) => {
        apis.push({
          apiId: api.ApiId || 'Unknown',
          name: api.Name || 'Unknown',
          protocolType: api.ProtocolType || 'Unknown',
        });
      });

      nextToken = response.NextToken;
    } while (nextToken);

    return {
      name: 'API Gateway HTTP APIs',
      count: apis.length,
      resources: apis,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'API Gateway HTTP APIs', count: 0, resources: [], error: message };
  }
}
