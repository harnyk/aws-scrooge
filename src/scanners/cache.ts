import {
  ElastiCacheClient,
  DescribeCacheClustersCommand,
} from '@aws-sdk/client-elasticache';
import {
  OpenSearchClient,
  ListDomainNamesCommand,
  DescribeDomainCommand,
} from '@aws-sdk/client-opensearch';
import type { ScanResult, ElastiCacheCluster, OpenSearchDomain } from '../types.js';

export async function scanElastiCacheClusters(): Promise<ScanResult<ElastiCacheCluster>> {
  const client = new ElastiCacheClient({});

  try {
    const clusters: ElastiCacheCluster[] = [];
    let marker: string | undefined;

    do {
      const response = await client.send(
        new DescribeCacheClustersCommand({
          Marker: marker,
        })
      );

      response.CacheClusters?.forEach((cluster) => {
        clusters.push({
          cacheClusterId: cluster.CacheClusterId || 'Unknown',
          engine: cluster.Engine || 'Unknown',
          cacheNodeType: cluster.CacheNodeType || 'Unknown',
          status: cluster.CacheClusterStatus || 'Unknown',
        });
      });

      marker = response.Marker;
    } while (marker);

    return {
      name: 'ElastiCache Clusters',
      count: clusters.length,
      resources: clusters,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'ElastiCache Clusters', count: 0, resources: [], error: message };
  }
}

export async function scanOpenSearchDomains(): Promise<ScanResult<OpenSearchDomain>> {
  const client = new OpenSearchClient({});

  try {
    const listResponse = await client.send(new ListDomainNamesCommand({}));

    const domains: OpenSearchDomain[] = [];

    for (const domainInfo of listResponse.DomainNames || []) {
      if (domainInfo.DomainName) {
        const describeResponse = await client.send(
          new DescribeDomainCommand({
            DomainName: domainInfo.DomainName,
          })
        );

        const domain = describeResponse.DomainStatus;
        if (domain) {
          domains.push({
            domainName: domain.DomainName || 'Unknown',
            engineVersion: domain.EngineVersion || 'Unknown',
            instanceType: domain.ClusterConfig?.InstanceType || 'Unknown',
            instanceCount: domain.ClusterConfig?.InstanceCount || 0,
          });
        }
      }
    }

    return {
      name: 'OpenSearch Domains',
      count: domains.length,
      resources: domains,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'OpenSearch Domains', count: 0, resources: [], error: message };
  }
}
