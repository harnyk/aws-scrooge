import {
  CloudFrontClient,
  ListDistributionsCommand,
} from '@aws-sdk/client-cloudfront';
import { Route53Client, ListHostedZonesCommand } from '@aws-sdk/client-route-53';
import type { ScanResult, CloudFrontDistribution, HostedZone } from '../types.js';

export async function scanCloudFrontDistributions(): Promise<ScanResult<CloudFrontDistribution>> {
  const client = new CloudFrontClient({});

  try {
    const distributions: CloudFrontDistribution[] = [];
    let marker: string | undefined;

    do {
      const response = await client.send(
        new ListDistributionsCommand({
          Marker: marker,
        })
      );

      response.DistributionList?.Items?.forEach((dist) => {
        distributions.push({
          id: dist.Id || 'Unknown',
          domainName: dist.DomainName || 'Unknown',
          status: dist.Status || 'Unknown',
          enabled: dist.Enabled || false,
        });
      });

      marker = response.DistributionList?.NextMarker;
    } while (marker);

    return {
      name: 'CloudFront Distributions',
      count: distributions.length,
      resources: distributions,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'CloudFront Distributions', count: 0, resources: [], error: message };
  }
}

export async function scanRoute53HostedZones(): Promise<ScanResult<HostedZone>> {
  const client = new Route53Client({});

  try {
    const zones: HostedZone[] = [];
    let marker: string | undefined;

    do {
      const response = await client.send(
        new ListHostedZonesCommand({
          Marker: marker,
        })
      );

      response.HostedZones?.forEach((zone) => {
        zones.push({
          id: zone.Id || 'Unknown',
          name: zone.Name || 'Unknown',
          recordSetCount: zone.ResourceRecordSetCount || 0,
          isPrivate: zone.Config?.PrivateZone || false,
        });
      });

      marker = response.NextMarker;
    } while (marker);

    return {
      name: 'Route53 Hosted Zones',
      count: zones.length,
      resources: zones,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'Route53 Hosted Zones', count: 0, resources: [], error: message };
  }
}
