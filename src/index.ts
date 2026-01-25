import { chain } from '@sweepbright/iter-helpers';
import {
  printBanner,
  printHeader,
  printSubHeader,
  printFound,
  printNone,
  printError,
  printTable,
  printAccountInfo,
  printCostSummary,
  printScanComplete,
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
  | 'COMPUTE'
  | 'STORAGE'
  | 'DATABASE'
  | 'CACHE'
  | 'NETWORK'
  | 'API'
  | 'MESSAGING'
  | 'CONTAINERS'
  | 'MONITORING'
  | 'SECURITY'
  | 'DATA'
  | 'TRANSFER';

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

// Define all scan tasks with their display configuration
const scanTasks: ScanTask<any>[] = [
  // COMPUTE
  {
    category: 'COMPUTE',
    scanner: scanEC2Instances,
    headers: ['Instance ID', 'Name', 'Type', 'State', 'Launch Time'],
    rowMapper: (r) => [r.instanceId, r.name, r.type, r.state, r.launchTime],
  },
  {
    category: 'COMPUTE',
    scanner: scanLambdaFunctions,
    headers: ['Function Name', 'Runtime', 'Memory (MB)', 'Last Modified'],
    rowMapper: (r) => [r.functionName, r.runtime, String(r.memorySize), r.lastModified],
  },
  {
    category: 'COMPUTE',
    scanner: scanECSClusters,
    headers: ['Cluster Name', 'Status', 'Running Tasks', 'Services'],
    rowMapper: (r) => [r.clusterName, r.status, String(r.runningTasksCount), String(r.servicesCount)],
  },
  {
    category: 'COMPUTE',
    scanner: scanEKSClusters,
    headers: ['Cluster Name', 'Status', 'Version'],
    rowMapper: (r) => [r.name, r.status, r.version],
  },
  // STORAGE
  {
    category: 'STORAGE',
    scanner: scanEBSVolumes,
    headers: ['Volume ID', 'Size (GB)', 'State', 'Type', 'Attached To'],
    rowMapper: (r) => [r.volumeId, String(r.size), r.state, r.type, r.attachedTo],
  },
  {
    category: 'STORAGE',
    scanner: scanEBSSnapshots,
    headers: ['Snapshot ID', 'Volume Size (GB)', 'Start Time', 'Description'],
    rowMapper: (r) => [r.snapshotId, String(r.volumeSize), r.startTime, r.description.substring(0, 40)],
  },
  {
    category: 'STORAGE',
    scanner: scanS3Buckets,
    headers: ['Bucket Name', 'Creation Date'],
    rowMapper: (r) => [r.name, r.creationDate],
  },
  {
    category: 'STORAGE',
    scanner: scanEFSFileSystems,
    headers: ['File System ID', 'Name', 'State', 'Size (Bytes)'],
    rowMapper: (r) => [r.fileSystemId, r.name, r.lifeCycleState, String(r.sizeInBytes)],
  },
  // DATABASE
  {
    category: 'DATABASE',
    scanner: scanRDSInstances,
    headers: ['DB Instance ID', 'Engine', 'Instance Class', 'Status'],
    rowMapper: (r) => [r.dbInstanceId, r.engine, r.instanceClass, r.status],
  },
  {
    category: 'DATABASE',
    scanner: scanRDSSnapshots,
    headers: ['Snapshot ID', 'DB Instance', 'Engine', 'Created'],
    rowMapper: (r) => [r.snapshotId, r.dbInstanceId, r.engine, r.snapshotCreateTime],
  },
  {
    category: 'DATABASE',
    scanner: scanDynamoDBTables,
    headers: ['Table Name', 'Status', 'Item Count', 'Size (Bytes)'],
    rowMapper: (r) => [r.tableName, r.tableStatus, String(r.itemCount), String(r.tableSizeBytes)],
  },
  {
    category: 'DATABASE',
    scanner: scanRedshiftClusters,
    headers: ['Cluster ID', 'Node Type', 'Nodes', 'Status'],
    rowMapper: (r) => [r.clusterIdentifier, r.nodeType, String(r.numberOfNodes), r.clusterStatus],
  },
  {
    category: 'DATABASE',
    scanner: scanOpenSearchDomains,
    headers: ['Domain Name', 'Engine Version', 'Instance Type', 'Instance Count'],
    rowMapper: (r) => [r.domainName, r.engineVersion, r.instanceType, String(r.instanceCount)],
  },
  // CACHE
  {
    category: 'CACHE',
    scanner: scanElastiCacheClusters,
    headers: ['Cluster ID', 'Engine', 'Node Type', 'Status'],
    rowMapper: (r) => [r.cacheClusterId, r.engine, r.cacheNodeType, r.status],
  },
  // NETWORK
  {
    category: 'NETWORK',
    scanner: scanElasticIPs,
    headers: ['Public IP', 'Allocation ID', 'Associated With'],
    rowMapper: (r) => [r.publicIp, r.allocationId, r.associatedWith],
  },
  {
    category: 'NETWORK',
    scanner: scanNATGateways,
    headers: ['NAT Gateway ID', 'State', 'VPC ID', 'Subnet ID'],
    rowMapper: (r) => [r.natGatewayId, r.state, r.vpcId, r.subnetId],
  },
  {
    category: 'NETWORK',
    scanner: scanVPCEndpoints,
    headers: ['Endpoint ID', 'Service Name', 'VPC ID', 'Type'],
    rowMapper: (r) => [r.vpcEndpointId, r.serviceName, r.vpcId, r.type],
  },
  {
    category: 'NETWORK',
    scanner: scanLoadBalancers,
    headers: ['Name', 'Type', 'Scheme', 'State'],
    rowMapper: (r) => [r.name, r.type, r.scheme, r.state],
  },
  {
    category: 'NETWORK',
    scanner: scanClassicLoadBalancers,
    headers: ['Name', 'Scheme', 'VPC ID'],
    rowMapper: (r) => [r.name, r.scheme, r.vpcId],
  },
  {
    category: 'NETWORK',
    scanner: scanCloudFrontDistributions,
    headers: ['ID', 'Domain Name', 'Status', 'Enabled'],
    rowMapper: (r) => [r.id, r.domainName, r.status, String(r.enabled)],
  },
  {
    category: 'NETWORK',
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
  // MESSAGING
  {
    category: 'MESSAGING',
    scanner: scanSQSQueues,
    headers: ['Queue Name', 'Queue URL'],
    rowMapper: (r) => [r.queueName, r.queueUrl],
  },
  {
    category: 'MESSAGING',
    scanner: scanSNSTopics,
    headers: ['Topic Name', 'Topic ARN'],
    rowMapper: (r) => [r.topicName, r.topicArn],
  },
  {
    category: 'MESSAGING',
    scanner: scanKinesisStreams,
    headers: ['Stream Name', 'Status', 'Shard Count'],
    rowMapper: (r) => [r.streamName, r.status, String(r.shardCount)],
  },
  // CONTAINERS
  {
    category: 'CONTAINERS',
    scanner: scanECRRepositories,
    headers: ['Repository Name', 'URI', 'Image Count'],
    rowMapper: (r) => [r.repositoryName, r.repositoryUri, String(r.imageCount)],
  },
  // MONITORING
  {
    category: 'MONITORING',
    scanner: scanLogGroups,
    headers: ['Log Group Name', 'Stored Bytes', 'Retention (Days)'],
    rowMapper: (r) => [r.logGroupName, String(r.storedBytes), r.retentionDays !== null ? String(r.retentionDays) : 'Never Expire'],
  },
  // SECURITY
  {
    category: 'SECURITY',
    scanner: scanSecrets,
    headers: ['Secret Name', 'Last Accessed', 'Last Changed'],
    rowMapper: (r) => [r.name, r.lastAccessedDate, r.lastChangedDate],
  },
  {
    category: 'SECURITY',
    scanner: scanKMSKeys,
    headers: ['Key ID', 'Description', 'State'],
    rowMapper: (r) => [r.keyId, r.description.substring(0, 40), r.keyState],
  },
  {
    category: 'SECURITY',
    scanner: scanACMCertificates,
    headers: ['Domain', 'Status', 'Type', 'ARN'],
    rowMapper: (r) => [r.domainName, r.status, r.type, r.certificateArn.substring(0, 50)],
  },
  // DATA
  {
    category: 'DATA',
    scanner: scanGlueJobs,
    headers: ['Job Name', 'Command', 'Max Capacity'],
    rowMapper: (r) => [r.name, r.command, String(r.maxCapacity)],
  },
  {
    category: 'DATA',
    scanner: scanSageMakerEndpoints,
    headers: ['Endpoint Name', 'Status', 'Created'],
    rowMapper: (r) => [r.endpointName, r.status, r.creationTime],
  },
  // TRANSFER
  {
    category: 'TRANSFER',
    scanner: scanTransferServers,
    headers: ['Server ID', 'State', 'Endpoint Type', 'Protocols'],
    rowMapper: (r) => [r.serverId, r.state, r.endpointType, r.protocols.join(', ')],
  },
];

function displayScanResult<T>(
  result: ScanResult<T>,
  headers: string[],
  rowMapper: (resource: T) => string[]
): void {
  printSubHeader(result.name);

  if (result.error) {
    printError(result.error);
    return;
  }

  if (result.count === 0) {
    printNone();
    return;
  }

  printFound(`Found ${result.count} ${result.name.toLowerCase()}`);
  printTable(headers, result.resources.map(rowMapper));
}

const categoryOrder: Category[] = [
  'COMPUTE',
  'STORAGE',
  'DATABASE',
  'CACHE',
  'NETWORK',
  'API',
  'MESSAGING',
  'CONTAINERS',
  'MONITORING',
  'SECURITY',
  'DATA',
  'TRANSFER',
];

const categoryHeaders: Record<Category, string> = {
  COMPUTE: 'COMPUTE RESOURCES',
  STORAGE: 'STORAGE RESOURCES',
  DATABASE: 'DATABASE RESOURCES',
  CACHE: 'CACHE RESOURCES',
  NETWORK: 'NETWORK RESOURCES',
  API: 'API RESOURCES',
  MESSAGING: 'MESSAGING RESOURCES',
  CONTAINERS: 'CONTAINER RESOURCES',
  MONITORING: 'MONITORING RESOURCES',
  SECURITY: 'SECURITY RESOURCES',
  DATA: 'DATA RESOURCES',
  TRANSFER: 'TRANSFER RESOURCES',
};

async function main(): Promise<void> {
  printBanner();

  // Get account info
  try {
    const account = await getAccountInfo();
    printAccountInfo(account.accountId, account.arn);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    printError(`Failed to get account info: ${message}`);
    process.exit(1);
  }

  console.log('\nScanning AWS resources (4 concurrent scans)...\n');

  // Run all scans in parallel with concurrency of 4
  const results = await chain(scanTasks)
    .concurrentMap(
      { concurrency: 4 },
      async (task): Promise<ScanTaskResult> => {
        const result = await task.scanner();
        return { task, result };
      }
    )
    .toArray();

  // Group results by category
  const resultsByCategory = new Map<Category, ScanTaskResult[]>();
  for (const result of results) {
    const category = result.task.category;
    if (!resultsByCategory.has(category)) {
      resultsByCategory.set(category, []);
    }
    resultsByCategory.get(category)!.push(result);
  }

  // Display results in category order
  for (const category of categoryOrder) {
    const categoryResults = resultsByCategory.get(category);
    if (!categoryResults || categoryResults.length === 0) continue;

    printHeader(categoryHeaders[category]);

    // Sort results within category to maintain consistent order
    const taskOrder = scanTasks
      .filter((t) => t.category === category)
      .map((t) => t.scanner);

    categoryResults.sort((a, b) => {
      return taskOrder.indexOf(a.task.scanner) - taskOrder.indexOf(b.task.scanner);
    });

    for (const { task, result } of categoryResults) {
      displayScanResult(result, task.headers, task.rowMapper);
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

  printScanComplete();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
