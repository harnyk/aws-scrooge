#!/usr/bin/env node
import { chain } from '@sweepbright/iter-helpers';
import {
  printHeader,
  printError,
  printTable,
  printAccountInfo,
  printCostSummary,
  printEmptyResourcesTree,
} from './output.js';
import { getCostAndUsage } from './cost.js';
import {
  getAccountInfo,
  scanEC2Instances,
  scanEBSVolumes,
  scanEBSSnapshots,
  scanElasticIPs,
  scanNATGateways,
  scanVPCEndpoints,
  scanRDSInstances,
  scanRDSSnapshots,
  scanS3Buckets,
  scanLambdaFunctions,
  scanLoadBalancers,
  scanClassicLoadBalancers,
  scanEFSFileSystems,
  scanElastiCacheClusters,
  scanOpenSearchDomains,
  scanSecrets,
  scanKMSKeys,
  scanLogGroups,
  scanECRRepositories,
  scanECSClusters,
  scanEKSClusters,
  scanDynamoDBTables,
  scanRedshiftClusters,
  scanSQSQueues,
  scanSNSTopics,
  scanKinesisStreams,
  scanEventBridgeBuses,
  scanAPIGatewayREST,
  scanAPIGatewayHTTP,
  scanCloudFrontDistributions,
  scanRoute53HostedZones,
  scanACMCertificates,
  scanGlueJobs,
  scanSageMakerEndpoints,
  scanTransferServers,
} from './scanners/index.js';
import type { ScanResult } from './types.js';

type Category =
  | 'Compute'
  | 'Storage'
  | 'Database'
  | 'Cache'
  | 'Network'
  | 'API'
  | 'Messaging'
  | 'Containers'
  | 'Monitoring'
  | 'Security'
  | 'Data'
  | 'Transfer';

interface ScanTask<T = unknown> {
  category: Category;
  scanner: () => Promise<ScanResult<T>>;
  headers: string[];
  rowMapper: (resource: T) => string[];
}

interface ScanTaskResult<T = unknown> {
  task: ScanTask<T>;
  result: ScanResult<T>;
}

const scanTasks: ScanTask<any>[] = [
  // Compute
  {
    category: 'Compute',
    scanner: scanEC2Instances,
    headers: ['Instance ID', 'Name', 'Type', 'State', 'Launch Time'],
    rowMapper: (r) => [r.instanceId, r.name, r.type, r.state, r.launchTime],
  },
  {
    category: 'Compute',
    scanner: scanLambdaFunctions,
    headers: ['Function Name', 'Runtime', 'Memory (MB)', 'Last Modified'],
    rowMapper: (r) => [r.functionName, r.runtime, String(r.memorySize), r.lastModified],
  },
  {
    category: 'Compute',
    scanner: scanECSClusters,
    headers: ['Cluster Name', 'Status', 'Running Tasks', 'Services'],
    rowMapper: (r) => [r.clusterName, r.status, String(r.runningTasksCount), String(r.servicesCount)],
  },
  {
    category: 'Compute',
    scanner: scanEKSClusters,
    headers: ['Cluster Name', 'Status', 'Version'],
    rowMapper: (r) => [r.name, r.status, r.version],
  },
  // Storage
  {
    category: 'Storage',
    scanner: scanEBSVolumes,
    headers: ['Volume ID', 'Size (GB)', 'State', 'Type', 'Attached To'],
    rowMapper: (r) => [r.volumeId, String(r.size), r.state, r.type, r.attachedTo],
  },
  {
    category: 'Storage',
    scanner: scanEBSSnapshots,
    headers: ['Snapshot ID', 'Volume Size (GB)', 'Start Time', 'Description'],
    rowMapper: (r) => [r.snapshotId, String(r.volumeSize), r.startTime, r.description.substring(0, 40)],
  },
  {
    category: 'Storage',
    scanner: scanS3Buckets,
    headers: ['Bucket Name', 'Creation Date'],
    rowMapper: (r) => [r.name, r.creationDate],
  },
  {
    category: 'Storage',
    scanner: scanEFSFileSystems,
    headers: ['File System ID', 'Name', 'State', 'Size (Bytes)'],
    rowMapper: (r) => [r.fileSystemId, r.name, r.lifeCycleState, String(r.sizeInBytes)],
  },
  // Database
  {
    category: 'Database',
    scanner: scanRDSInstances,
    headers: ['DB Instance ID', 'Engine', 'Instance Class', 'Status'],
    rowMapper: (r) => [r.dbInstanceId, r.engine, r.instanceClass, r.status],
  },
  {
    category: 'Database',
    scanner: scanRDSSnapshots,
    headers: ['Snapshot ID', 'DB Instance', 'Engine', 'Created'],
    rowMapper: (r) => [r.snapshotId, r.dbInstanceId, r.engine, r.snapshotCreateTime],
  },
  {
    category: 'Database',
    scanner: scanDynamoDBTables,
    headers: ['Table Name', 'Status', 'Item Count', 'Size (Bytes)'],
    rowMapper: (r) => [r.tableName, r.tableStatus, String(r.itemCount), String(r.tableSizeBytes)],
  },
  {
    category: 'Database',
    scanner: scanRedshiftClusters,
    headers: ['Cluster ID', 'Node Type', 'Nodes', 'Status'],
    rowMapper: (r) => [r.clusterIdentifier, r.nodeType, String(r.numberOfNodes), r.clusterStatus],
  },
  {
    category: 'Database',
    scanner: scanOpenSearchDomains,
    headers: ['Domain Name', 'Engine Version', 'Instance Type', 'Instance Count'],
    rowMapper: (r) => [r.domainName, r.engineVersion, r.instanceType, String(r.instanceCount)],
  },
  // Cache
  {
    category: 'Cache',
    scanner: scanElastiCacheClusters,
    headers: ['Cluster ID', 'Engine', 'Node Type', 'Status'],
    rowMapper: (r) => [r.cacheClusterId, r.engine, r.cacheNodeType, r.status],
  },
  // Network
  {
    category: 'Network',
    scanner: scanElasticIPs,
    headers: ['Public IP', 'Allocation ID', 'Associated With'],
    rowMapper: (r) => [r.publicIp, r.allocationId, r.associatedWith],
  },
  {
    category: 'Network',
    scanner: scanNATGateways,
    headers: ['NAT Gateway ID', 'State', 'VPC ID', 'Subnet ID'],
    rowMapper: (r) => [r.natGatewayId, r.state, r.vpcId, r.subnetId],
  },
  {
    category: 'Network',
    scanner: scanVPCEndpoints,
    headers: ['Endpoint ID', 'Service Name', 'VPC ID', 'Type'],
    rowMapper: (r) => [r.vpcEndpointId, r.serviceName, r.vpcId, r.type],
  },
  {
    category: 'Network',
    scanner: scanLoadBalancers,
    headers: ['Name', 'Type', 'Scheme', 'State'],
    rowMapper: (r) => [r.name, r.type, r.scheme, r.state],
  },
  {
    category: 'Network',
    scanner: scanClassicLoadBalancers,
    headers: ['Name', 'Scheme', 'VPC ID'],
    rowMapper: (r) => [r.name, r.scheme, r.vpcId],
  },
  {
    category: 'Network',
    scanner: scanCloudFrontDistributions,
    headers: ['ID', 'Domain Name', 'Status', 'Enabled'],
    rowMapper: (r) => [r.id, r.domainName, r.status, String(r.enabled)],
  },
  {
    category: 'Network',
    scanner: scanRoute53HostedZones,
    headers: ['Zone ID', 'Name', 'Record Count', 'Private'],
    rowMapper: (r) => [r.id, r.name, String(r.recordSetCount), String(r.isPrivate)],
  },
  // API
  {
    category: 'API',
    scanner: scanAPIGatewayREST,
    headers: ['ID', 'Name', 'Created'],
    rowMapper: (r) => [r.id, r.name, r.createdDate],
  },
  {
    category: 'API',
    scanner: scanAPIGatewayHTTP,
    headers: ['API ID', 'Name', 'Protocol'],
    rowMapper: (r) => [r.apiId, r.name, r.protocolType],
  },
  // Messaging
  {
    category: 'Messaging',
    scanner: scanSQSQueues,
    headers: ['Queue Name', 'Queue URL'],
    rowMapper: (r) => [r.queueName, r.queueUrl],
  },
  {
    category: 'Messaging',
    scanner: scanSNSTopics,
    headers: ['Topic Name', 'Topic ARN'],
    rowMapper: (r) => [r.topicName, r.topicArn],
  },
  {
    category: 'Messaging',
    scanner: scanKinesisStreams,
    headers: ['Stream Name', 'Status', 'Shard Count'],
    rowMapper: (r) => [r.streamName, r.status, String(r.shardCount)],
  },
  {
    category: 'Messaging',
    scanner: scanEventBridgeBuses,
    headers: ['Bus Name', 'ARN'],
    rowMapper: (r) => [r.name, r.arn],
  },
  // Containers
  {
    category: 'Containers',
    scanner: scanECRRepositories,
    headers: ['Repository Name', 'URI', 'Image Count'],
    rowMapper: (r) => [r.repositoryName, r.repositoryUri, String(r.imageCount)],
  },
  // Monitoring
  {
    category: 'Monitoring',
    scanner: scanLogGroups,
    headers: ['Log Group Name', 'Stored Bytes', 'Retention (Days)'],
    rowMapper: (r) => [
      r.logGroupName,
      String(r.storedBytes),
      r.retentionDays !== null ? String(r.retentionDays) : 'Never Expire',
    ],
  },
  // Security
  {
    category: 'Security',
    scanner: scanSecrets,
    headers: ['Secret Name', 'Last Accessed', 'Last Changed'],
    rowMapper: (r) => [r.name, r.lastAccessedDate, r.lastChangedDate],
  },
  {
    category: 'Security',
    scanner: scanKMSKeys,
    headers: ['Key ID', 'Description', 'State'],
    rowMapper: (r) => [r.keyId, r.description.substring(0, 40), r.keyState],
  },
  {
    category: 'Security',
    scanner: scanACMCertificates,
    headers: ['Domain', 'Status', 'Type', 'ARN'],
    rowMapper: (r) => [r.domainName, r.status, r.type, r.certificateArn.substring(0, 50)],
  },
  // Data
  {
    category: 'Data',
    scanner: scanGlueJobs,
    headers: ['Job Name', 'Command', 'Max Capacity'],
    rowMapper: (r) => [r.name, r.command, String(r.maxCapacity)],
  },
  {
    category: 'Data',
    scanner: scanSageMakerEndpoints,
    headers: ['Endpoint Name', 'Status', 'Created'],
    rowMapper: (r) => [r.endpointName, r.status, r.creationTime],
  },
  // Transfer
  {
    category: 'Transfer',
    scanner: scanTransferServers,
    headers: ['Server ID', 'State', 'Endpoint Type', 'Protocols'],
    rowMapper: (r) => [r.serverId, r.state, r.endpointType, r.protocols.join(', ')],
  },
];

const categoryOrder: Category[] = [
  'Compute',
  'Storage',
  'Database',
  'Cache',
  'Network',
  'API',
  'Messaging',
  'Containers',
  'Monitoring',
  'Security',
  'Data',
  'Transfer',
];

async function main(): Promise<void> {
  // Get account info
  try {
    const account = await getAccountInfo();
    printAccountInfo(account.accountId, account.arn);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    printError(`Failed to get account info: ${message}`);
    process.exit(1);
  }

  // Run all scans in parallel with concurrency of 4
  const results = await chain(scanTasks)
    .concurrentMap({ concurrency: 4 }, async (task): Promise<ScanTaskResult> => {
      const result = await task.scanner();
      return { task, result };
    })
    .toArray();

  // Separate empty and found resources
  const emptyByCategory = new Map<string, string[]>();
  const foundResults: ScanTaskResult[] = [];
  const errors: ScanTaskResult[] = [];

  for (const r of results) {
    if (r.result.error) {
      errors.push(r);
    } else if (r.result.count === 0) {
      const category = r.task.category;
      if (!emptyByCategory.has(category)) {
        emptyByCategory.set(category, []);
      }
      emptyByCategory.get(category)!.push(r.result.name);
    } else {
      foundResults.push(r);
    }
  }

  // Print empty resources tree
  printEmptyResourcesTree(emptyByCategory);

  // Print errors if any
  if (errors.length > 0) {
    printHeader('Errors');
    for (const { result } of errors) {
      printError(`${result.name}: ${result.error}`);
    }
  }

  // Group found results by category
  const foundByCategory = new Map<Category, ScanTaskResult[]>();
  for (const r of foundResults) {
    const category = r.task.category;
    if (!foundByCategory.has(category)) {
      foundByCategory.set(category, []);
    }
    foundByCategory.get(category)!.push(r);
  }

  // Display found resources by category
  for (const category of categoryOrder) {
    const categoryResults = foundByCategory.get(category);
    if (!categoryResults || categoryResults.length === 0) continue;

    // Sort within category to maintain consistent order
    const taskOrder = scanTasks.filter((t) => t.category === category).map((t) => t.scanner);
    categoryResults.sort(
      (a, b) => taskOrder.indexOf(a.task.scanner) - taskOrder.indexOf(b.task.scanner)
    );

    for (const { task, result } of categoryResults) {
      printHeader(`${result.name} (${result.count})`);
      printTable(task.headers, result.resources.map(task.rowMapper));
    }
  }

  // Cost summary
  try {
    const { totalCost, serviceBreakdown } = await getCostAndUsage();
    printCostSummary(totalCost, serviceBreakdown);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    printError(`Failed to get cost data: ${message}`);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
