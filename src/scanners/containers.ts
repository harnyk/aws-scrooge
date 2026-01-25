import { ECRClient, DescribeRepositoriesCommand } from '@aws-sdk/client-ecr';
import {
  ECSClient,
  ListClustersCommand,
  DescribeClustersCommand,
} from '@aws-sdk/client-ecs';
import { EKSClient, ListClustersCommand as ListEKSClustersCommand, DescribeClusterCommand } from '@aws-sdk/client-eks';
import type { ScanResult, ECRRepository, ECSCluster, EKSCluster } from '../types.js';

export async function scanECRRepositories(): Promise<ScanResult<ECRRepository>> {
  const client = new ECRClient({});

  try {
    const repositories: ECRRepository[] = [];
    let nextToken: string | undefined;

    do {
      const response = await client.send(
        new DescribeRepositoriesCommand({
          nextToken,
        })
      );

      response.repositories?.forEach((repo) => {
        repositories.push({
          repositoryName: repo.repositoryName || 'Unknown',
          repositoryUri: repo.repositoryUri || 'Unknown',
          imageCount: 0, // Would require additional API call to get image count
        });
      });

      nextToken = response.nextToken;
    } while (nextToken);

    return {
      name: 'ECR Repositories',
      count: repositories.length,
      resources: repositories,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'ECR Repositories', count: 0, resources: [], error: message };
  }
}

export async function scanECSClusters(): Promise<ScanResult<ECSCluster>> {
  const client = new ECSClient({});

  try {
    const listResponse = await client.send(new ListClustersCommand({}));
    const clusterArns = listResponse.clusterArns || [];

    if (clusterArns.length === 0) {
      return {
        name: 'ECS Clusters',
        count: 0,
        resources: [],
      };
    }

    const describeResponse = await client.send(
      new DescribeClustersCommand({
        clusters: clusterArns,
      })
    );

    const clusters: ECSCluster[] =
      describeResponse.clusters?.map((cluster) => ({
        clusterName: cluster.clusterName || 'Unknown',
        status: cluster.status || 'Unknown',
        runningTasksCount: cluster.runningTasksCount || 0,
        servicesCount: cluster.activeServicesCount || 0,
      })) || [];

    return {
      name: 'ECS Clusters',
      count: clusters.length,
      resources: clusters,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'ECS Clusters', count: 0, resources: [], error: message };
  }
}

export async function scanEKSClusters(): Promise<ScanResult<EKSCluster>> {
  const client = new EKSClient({});

  try {
    const listResponse = await client.send(new ListEKSClustersCommand({}));
    const clusterNames = listResponse.clusters || [];

    const clusters: EKSCluster[] = [];

    for (const clusterName of clusterNames) {
      const describeResponse = await client.send(
        new DescribeClusterCommand({
          name: clusterName,
        })
      );

      const cluster = describeResponse.cluster;
      if (cluster) {
        clusters.push({
          name: cluster.name || 'Unknown',
          status: cluster.status || 'Unknown',
          version: cluster.version || 'Unknown',
        });
      }
    }

    return {
      name: 'EKS Clusters',
      count: clusters.length,
      resources: clusters,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'EKS Clusters', count: 0, resources: [], error: message };
  }
}
