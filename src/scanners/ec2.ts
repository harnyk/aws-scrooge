import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVolumesCommand,
  DescribeSnapshotsCommand,
  DescribeAddressesCommand,
  DescribeNatGatewaysCommand,
  DescribeVpcEndpointsCommand,
} from '@aws-sdk/client-ec2';
import type {
  ScanResult,
  EC2Instance,
  EBSVolume,
  EBSSnapshot,
  ElasticIP,
  NATGateway,
  VPCEndpoint,
} from '../types.js';

export async function scanEC2Instances(): Promise<ScanResult<EC2Instance>> {
  const client = new EC2Client({});

  try {
    const response = await client.send(
      new DescribeInstancesCommand({
        Filters: [
          { Name: 'instance-state-name', Values: ['running', 'stopped'] },
        ],
      })
    );

    const instances: EC2Instance[] = [];

    response.Reservations?.forEach((reservation) => {
      reservation.Instances?.forEach((instance) => {
        const nameTag = instance.Tags?.find((tag) => tag.Key === 'Name');
        instances.push({
          instanceId: instance.InstanceId || 'Unknown',
          name: nameTag?.Value || '-',
          type: instance.InstanceType || 'Unknown',
          state: instance.State?.Name || 'Unknown',
          launchTime: instance.LaunchTime?.toISOString() || 'Unknown',
        });
      });
    });

    return {
      name: 'EC2 Instances',
      count: instances.length,
      resources: instances,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'EC2 Instances', count: 0, resources: [], error: message };
  }
}

export async function scanEBSVolumes(): Promise<ScanResult<EBSVolume>> {
  const client = new EC2Client({});

  try {
    const response = await client.send(new DescribeVolumesCommand({}));

    const volumes: EBSVolume[] =
      response.Volumes?.map((volume) => ({
        volumeId: volume.VolumeId || 'Unknown',
        size: volume.Size || 0,
        state: volume.State || 'Unknown',
        type: volume.VolumeType || 'Unknown',
        attachedTo: volume.Attachments?.[0]?.InstanceId || 'Unattached',
      })) || [];

    return {
      name: 'EBS Volumes',
      count: volumes.length,
      resources: volumes,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'EBS Volumes', count: 0, resources: [], error: message };
  }
}

export async function scanEBSSnapshots(): Promise<ScanResult<EBSSnapshot>> {
  const client = new EC2Client({});

  try {
    const response = await client.send(
      new DescribeSnapshotsCommand({
        OwnerIds: ['self'],
      })
    );

    const snapshots: EBSSnapshot[] =
      response.Snapshots?.map((snapshot) => ({
        snapshotId: snapshot.SnapshotId || 'Unknown',
        volumeSize: snapshot.VolumeSize || 0,
        startTime: snapshot.StartTime?.toISOString() || 'Unknown',
        description: snapshot.Description || '-',
      })) || [];

    return {
      name: 'EBS Snapshots',
      count: snapshots.length,
      resources: snapshots,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'EBS Snapshots', count: 0, resources: [], error: message };
  }
}

export async function scanElasticIPs(): Promise<ScanResult<ElasticIP>> {
  const client = new EC2Client({});

  try {
    const response = await client.send(new DescribeAddressesCommand({}));

    const eips: ElasticIP[] =
      response.Addresses?.map((address) => ({
        publicIp: address.PublicIp || 'Unknown',
        allocationId: address.AllocationId || 'Unknown',
        associatedWith: address.InstanceId || address.NetworkInterfaceId || 'Unassociated',
      })) || [];

    return {
      name: 'Elastic IPs',
      count: eips.length,
      resources: eips,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'Elastic IPs', count: 0, resources: [], error: message };
  }
}

export async function scanNATGateways(): Promise<ScanResult<NATGateway>> {
  const client = new EC2Client({});

  try {
    const response = await client.send(
      new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'state', Values: ['available', 'pending'] }],
      })
    );

    const natGateways: NATGateway[] =
      response.NatGateways?.map((nat) => ({
        natGatewayId: nat.NatGatewayId || 'Unknown',
        state: nat.State || 'Unknown',
        vpcId: nat.VpcId || 'Unknown',
        subnetId: nat.SubnetId || 'Unknown',
      })) || [];

    return {
      name: 'NAT Gateways',
      count: natGateways.length,
      resources: natGateways,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'NAT Gateways', count: 0, resources: [], error: message };
  }
}

export async function scanVPCEndpoints(): Promise<ScanResult<VPCEndpoint>> {
  const client = new EC2Client({});

  try {
    const response = await client.send(new DescribeVpcEndpointsCommand({}));

    const endpoints: VPCEndpoint[] =
      response.VpcEndpoints?.map((endpoint) => ({
        vpcEndpointId: endpoint.VpcEndpointId || 'Unknown',
        serviceName: endpoint.ServiceName || 'Unknown',
        vpcId: endpoint.VpcId || 'Unknown',
        type: endpoint.VpcEndpointType || 'Unknown',
      })) || [];

    return {
      name: 'VPC Endpoints',
      count: endpoints.length,
      resources: endpoints,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'VPC Endpoints', count: 0, resources: [], error: message };
  }
}
