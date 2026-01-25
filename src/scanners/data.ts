import { GlueClient, GetJobsCommand } from '@aws-sdk/client-glue';
import { SageMakerClient, ListEndpointsCommand } from '@aws-sdk/client-sagemaker';
import type { ScanResult, GlueJob, SageMakerEndpoint } from '../types.js';

export async function scanGlueJobs(): Promise<ScanResult<GlueJob>> {
  const client = new GlueClient({});

  try {
    const jobs: GlueJob[] = [];
    let nextToken: string | undefined;

    do {
      const response = await client.send(
        new GetJobsCommand({
          NextToken: nextToken,
        })
      );

      response.Jobs?.forEach((job) => {
        jobs.push({
          name: job.Name || 'Unknown',
          command: job.Command?.Name || 'Unknown',
          maxCapacity: job.MaxCapacity || 0,
        });
      });

      nextToken = response.NextToken;
    } while (nextToken);

    return {
      name: 'Glue Jobs',
      count: jobs.length,
      resources: jobs,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'Glue Jobs', count: 0, resources: [], error: message };
  }
}

export async function scanSageMakerEndpoints(): Promise<ScanResult<SageMakerEndpoint>> {
  const client = new SageMakerClient({});

  try {
    const endpoints: SageMakerEndpoint[] = [];
    let nextToken: string | undefined;

    do {
      const response = await client.send(
        new ListEndpointsCommand({
          NextToken: nextToken,
        })
      );

      response.Endpoints?.forEach((endpoint) => {
        endpoints.push({
          endpointName: endpoint.EndpointName || 'Unknown',
          status: endpoint.EndpointStatus || 'Unknown',
          creationTime: endpoint.CreationTime?.toISOString() || 'Unknown',
        });
      });

      nextToken = response.NextToken;
    } while (nextToken);

    return {
      name: 'SageMaker Endpoints',
      count: endpoints.length,
      resources: endpoints,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'SageMaker Endpoints', count: 0, resources: [], error: message };
  }
}
