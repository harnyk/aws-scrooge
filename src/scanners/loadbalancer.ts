import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  ElasticLoadBalancingClient,
  DescribeLoadBalancersCommand as DescribeClassicLoadBalancersCommand,
} from '@aws-sdk/client-elastic-load-balancing';
import type { ScanResult, LoadBalancer, ClassicLoadBalancer } from '../types.js';

export async function scanLoadBalancers(): Promise<ScanResult<LoadBalancer>> {
  const client = new ElasticLoadBalancingV2Client({});

  try {
    const loadBalancers: LoadBalancer[] = [];
    let marker: string | undefined;

    do {
      const response = await client.send(
        new DescribeLoadBalancersCommand({
          Marker: marker,
        })
      );

      response.LoadBalancers?.forEach((lb) => {
        loadBalancers.push({
          name: lb.LoadBalancerName || 'Unknown',
          type: lb.Type || 'Unknown',
          scheme: lb.Scheme || 'Unknown',
          state: lb.State?.Code || 'Unknown',
        });
      });

      marker = response.NextMarker;
    } while (marker);

    return {
      name: 'Application/Network Load Balancers',
      count: loadBalancers.length,
      resources: loadBalancers,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      name: 'Application/Network Load Balancers',
      count: 0,
      resources: [],
      error: message,
    };
  }
}

export async function scanClassicLoadBalancers(): Promise<ScanResult<ClassicLoadBalancer>> {
  const client = new ElasticLoadBalancingClient({});

  try {
    const response = await client.send(new DescribeClassicLoadBalancersCommand({}));

    const loadBalancers: ClassicLoadBalancer[] =
      response.LoadBalancerDescriptions?.map((lb) => ({
        name: lb.LoadBalancerName || 'Unknown',
        scheme: lb.Scheme || 'Unknown',
        vpcId: lb.VPCId || 'Unknown',
      })) || [];

    return {
      name: 'Classic Load Balancers',
      count: loadBalancers.length,
      resources: loadBalancers,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      name: 'Classic Load Balancers',
      count: 0,
      resources: [],
      error: message,
    };
  }
}
