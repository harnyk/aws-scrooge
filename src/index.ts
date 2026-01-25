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

async function displayScanResult<T>(
  result: ScanResult<T>,
  headers: string[],
  rowMapper: (resource: T) => string[]
): Promise<void> {
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

  // === COMPUTE ===
  printHeader('COMPUTE RESOURCES');

  // EC2 Instances
  const ec2Instances = await scanEC2Instances();
  await displayScanResult(ec2Instances, ['Instance ID', 'Name', 'Type', 'State', 'Launch Time'], (r) => [
    r.instanceId,
    r.name,
    r.type,
    r.state,
    r.launchTime,
  ]);

  // Lambda Functions
  const lambdaFunctions = await scanLambdaFunctions();
  await displayScanResult(lambdaFunctions, ['Function Name', 'Runtime', 'Memory (MB)', 'Last Modified'], (r) => [
    r.functionName,
    r.runtime,
    String(r.memorySize),
    r.lastModified,
  ]);

  // ECS Clusters
  const ecsClusters = await scanECSClusters();
  await displayScanResult(ecsClusters, ['Cluster Name', 'Status', 'Running Tasks', 'Services'], (r) => [
    r.clusterName,
    r.status,
    String(r.runningTasksCount),
    String(r.servicesCount),
  ]);

  // EKS Clusters
  const eksClusters = await scanEKSClusters();
  await displayScanResult(eksClusters, ['Cluster Name', 'Status', 'Version'], (r) => [
    r.name,
    r.status,
    r.version,
  ]);

  // === STORAGE ===
  printHeader('STORAGE RESOURCES');

  // EBS Volumes
  const ebsVolumes = await scanEBSVolumes();
  await displayScanResult(ebsVolumes, ['Volume ID', 'Size (GB)', 'State', 'Type', 'Attached To'], (r) => [
    r.volumeId,
    String(r.size),
    r.state,
    r.type,
    r.attachedTo,
  ]);

  // EBS Snapshots
  const ebsSnapshots = await scanEBSSnapshots();
  await displayScanResult(ebsSnapshots, ['Snapshot ID', 'Volume Size (GB)', 'Start Time', 'Description'], (r) => [
    r.snapshotId,
    String(r.volumeSize),
    r.startTime,
    r.description.substring(0, 40),
  ]);

  // S3 Buckets
  const s3Buckets = await scanS3Buckets();
  await displayScanResult(s3Buckets, ['Bucket Name', 'Creation Date'], (r) => [r.name, r.creationDate]);

  // EFS File Systems
  const efsFileSystems = await scanEFSFileSystems();
  await displayScanResult(efsFileSystems, ['File System ID', 'Name', 'State', 'Size (Bytes)'], (r) => [
    r.fileSystemId,
    r.name,
    r.lifeCycleState,
    String(r.sizeInBytes),
  ]);

  // === DATABASE ===
  printHeader('DATABASE RESOURCES');

  // RDS Instances
  const rdsInstances = await scanRDSInstances();
  await displayScanResult(rdsInstances, ['DB Instance ID', 'Engine', 'Instance Class', 'Status'], (r) => [
    r.dbInstanceId,
    r.engine,
    r.instanceClass,
    r.status,
  ]);

  // RDS Snapshots
  const rdsSnapshots = await scanRDSSnapshots();
  await displayScanResult(rdsSnapshots, ['Snapshot ID', 'DB Instance', 'Engine', 'Created'], (r) => [
    r.snapshotId,
    r.dbInstanceId,
    r.engine,
    r.snapshotCreateTime,
  ]);

  // DynamoDB Tables
  const dynamoDBTables = await scanDynamoDBTables();
  await displayScanResult(dynamoDBTables, ['Table Name', 'Status', 'Item Count', 'Size (Bytes)'], (r) => [
    r.tableName,
    r.tableStatus,
    String(r.itemCount),
    String(r.tableSizeBytes),
  ]);

  // Redshift Clusters
  const redshiftClusters = await scanRedshiftClusters();
  await displayScanResult(redshiftClusters, ['Cluster ID', 'Node Type', 'Nodes', 'Status'], (r) => [
    r.clusterIdentifier,
    r.nodeType,
    String(r.numberOfNodes),
    r.clusterStatus,
  ]);

  // OpenSearch Domains
  const openSearchDomains = await scanOpenSearchDomains();
  await displayScanResult(openSearchDomains, ['Domain Name', 'Engine Version', 'Instance Type', 'Instance Count'], (r) => [
    r.domainName,
    r.engineVersion,
    r.instanceType,
    String(r.instanceCount),
  ]);

  // === CACHE ===
  printHeader('CACHE RESOURCES');

  // ElastiCache Clusters
  const elastiCacheClusters = await scanElastiCacheClusters();
  await displayScanResult(elastiCacheClusters, ['Cluster ID', 'Engine', 'Node Type', 'Status'], (r) => [
    r.cacheClusterId,
    r.engine,
    r.cacheNodeType,
    r.status,
  ]);

  // === NETWORK ===
  printHeader('NETWORK RESOURCES');

  // Elastic IPs
  const elasticIPs = await scanElasticIPs();
  await displayScanResult(elasticIPs, ['Public IP', 'Allocation ID', 'Associated With'], (r) => [
    r.publicIp,
    r.allocationId,
    r.associatedWith,
  ]);

  // NAT Gateways
  const natGateways = await scanNATGateways();
  await displayScanResult(natGateways, ['NAT Gateway ID', 'State', 'VPC ID', 'Subnet ID'], (r) => [
    r.natGatewayId,
    r.state,
    r.vpcId,
    r.subnetId,
  ]);

  // VPC Endpoints
  const vpcEndpoints = await scanVPCEndpoints();
  await displayScanResult(vpcEndpoints, ['Endpoint ID', 'Service Name', 'VPC ID', 'Type'], (r) => [
    r.vpcEndpointId,
    r.serviceName,
    r.vpcId,
    r.type,
  ]);

  // Load Balancers (ALB/NLB)
  const loadBalancers = await scanLoadBalancers();
  await displayScanResult(loadBalancers, ['Name', 'Type', 'Scheme', 'State'], (r) => [
    r.name,
    r.type,
    r.scheme,
    r.state,
  ]);

  // Classic Load Balancers
  const classicLBs = await scanClassicLoadBalancers();
  await displayScanResult(classicLBs, ['Name', 'Scheme', 'VPC ID'], (r) => [r.name, r.scheme, r.vpcId]);

  // CloudFront Distributions
  const cloudFrontDistributions = await scanCloudFrontDistributions();
  await displayScanResult(cloudFrontDistributions, ['ID', 'Domain Name', 'Status', 'Enabled'], (r) => [
    r.id,
    r.domainName,
    r.status,
    String(r.enabled),
  ]);

  // Route53 Hosted Zones
  const route53Zones = await scanRoute53HostedZones();
  await displayScanResult(route53Zones, ['Zone ID', 'Name', 'Record Count', 'Private'], (r) => [
    r.id,
    r.name,
    String(r.recordSetCount),
    String(r.isPrivate),
  ]);

  // === API ===
  printHeader('API RESOURCES');

  // API Gateway REST APIs
  const apiGatewayREST = await scanAPIGatewayREST();
  await displayScanResult(apiGatewayREST, ['ID', 'Name', 'Created'], (r) => [r.id, r.name, r.createdDate]);

  // API Gateway HTTP APIs
  const apiGatewayHTTP = await scanAPIGatewayHTTP();
  await displayScanResult(apiGatewayHTTP, ['API ID', 'Name', 'Protocol'], (r) => [r.apiId, r.name, r.protocolType]);

  // === MESSAGING ===
  printHeader('MESSAGING RESOURCES');

  // SQS Queues
  const sqsQueues = await scanSQSQueues();
  await displayScanResult(sqsQueues, ['Queue Name', 'Queue URL'], (r) => [r.queueName, r.queueUrl]);

  // SNS Topics
  const snsTopics = await scanSNSTopics();
  await displayScanResult(snsTopics, ['Topic Name', 'Topic ARN'], (r) => [r.topicName, r.topicArn]);

  // Kinesis Streams
  const kinesisStreams = await scanKinesisStreams();
  await displayScanResult(kinesisStreams, ['Stream Name', 'Status', 'Shard Count'], (r) => [
    r.streamName,
    r.status,
    String(r.shardCount),
  ]);

  // === CONTAINERS ===
  printHeader('CONTAINER RESOURCES');

  // ECR Repositories
  const ecrRepositories = await scanECRRepositories();
  await displayScanResult(ecrRepositories, ['Repository Name', 'URI', 'Image Count'], (r) => [
    r.repositoryName,
    r.repositoryUri,
    String(r.imageCount),
  ]);

  // === MONITORING ===
  printHeader('MONITORING RESOURCES');

  // CloudWatch Log Groups
  const logGroups = await scanLogGroups();
  await displayScanResult(logGroups, ['Log Group Name', 'Stored Bytes', 'Retention (Days)'], (r) => [
    r.logGroupName,
    String(r.storedBytes),
    r.retentionDays !== null ? String(r.retentionDays) : 'Never Expire',
  ]);

  // === SECURITY ===
  printHeader('SECURITY RESOURCES');

  // Secrets Manager Secrets
  const secrets = await scanSecrets();
  await displayScanResult(secrets, ['Secret Name', 'Last Accessed', 'Last Changed'], (r) => [
    r.name,
    r.lastAccessedDate,
    r.lastChangedDate,
  ]);

  // KMS Keys
  const kmsKeys = await scanKMSKeys();
  await displayScanResult(kmsKeys, ['Key ID', 'Description', 'State'], (r) => [
    r.keyId,
    r.description.substring(0, 40),
    r.keyState,
  ]);

  // ACM Certificates
  const acmCertificates = await scanACMCertificates();
  await displayScanResult(acmCertificates, ['Domain', 'Status', 'Type', 'ARN'], (r) => [
    r.domainName,
    r.status,
    r.type,
    r.certificateArn.substring(0, 50),
  ]);

  // === DATA ===
  printHeader('DATA RESOURCES');

  // Glue Jobs
  const glueJobs = await scanGlueJobs();
  await displayScanResult(glueJobs, ['Job Name', 'Command', 'Max Capacity'], (r) => [
    r.name,
    r.command,
    String(r.maxCapacity),
  ]);

  // SageMaker Endpoints
  const sageMakerEndpoints = await scanSageMakerEndpoints();
  await displayScanResult(sageMakerEndpoints, ['Endpoint Name', 'Status', 'Created'], (r) => [
    r.endpointName,
    r.status,
    r.creationTime,
  ]);

  // === TRANSFER ===
  printHeader('TRANSFER RESOURCES');

  // Transfer Family Servers
  const transferServers = await scanTransferServers();
  await displayScanResult(transferServers, ['Server ID', 'State', 'Endpoint Type', 'Protocols'], (r) => [
    r.serverId,
    r.state,
    r.endpointType,
    r.protocols.join(', '),
  ]);

  // === COST SUMMARY ===
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
