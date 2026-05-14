export interface ScanResult<T> {
  name: string;
  count: number;
  resources: T[];
  error?: string;
}

export interface CostByService {
  service: string;
  cost: number;
}

export interface AccountInfo {
  accountId: string;
  arn: string;
  userId: string;
}

export interface EC2Instance {
  instanceId: string;
  name: string;
  type: string;
  state: string;
  launchTime: string;
}

export interface EBSVolume {
  volumeId: string;
  size: number;
  state: string;
  type: string;
  attachedTo: string;
}

export interface EBSSnapshot {
  snapshotId: string;
  volumeSize: number;
  startTime: string;
  description: string;
}

export interface ElasticIP {
  publicIp: string;
  allocationId: string;
  associatedWith: string;
}

export interface NATGateway {
  natGatewayId: string;
  state: string;
  vpcId: string;
  subnetId: string;
}

export interface VPCEndpoint {
  vpcEndpointId: string;
  serviceName: string;
  vpcId: string;
  type: string;
}

export interface RDSInstance {
  dbInstanceId: string;
  engine: string;
  instanceClass: string;
  status: string;
}

export interface RDSSnapshot {
  snapshotId: string;
  dbInstanceId: string;
  engine: string;
  snapshotCreateTime: string;
}

export interface S3Bucket {
  name: string;
  creationDate: string;
}

export interface LambdaFunction {
  functionName: string;
  runtime: string;
  memorySize: number;
  lastModified: string;
}

export interface LoadBalancer {
  name: string;
  type: string;
  scheme: string;
  state: string;
}

export interface ClassicLoadBalancer {
  name: string;
  scheme: string;
  vpcId: string;
}

export interface EFSFileSystem {
  fileSystemId: string;
  name: string;
  lifeCycleState: string;
  sizeInBytes: number;
}

export interface ElastiCacheCluster {
  cacheClusterId: string;
  engine: string;
  cacheNodeType: string;
  status: string;
}

export interface OpenSearchDomain {
  domainName: string;
  engineVersion: string;
  instanceType: string;
  instanceCount: number;
}

export interface Secret {
  name: string;
  lastAccessedDate: string;
  lastChangedDate: string;
}

export interface KMSKey {
  keyId: string;
  description: string;
  keyState: string;
}

export interface LogGroup {
  logGroupName: string;
  storedBytes: number;
  retentionDays: number | null;
}

export interface ECRRepository {
  repositoryName: string;
  repositoryUri: string;
  imageCount: number;
}

export interface ECSCluster {
  clusterName: string;
  status: string;
  runningTasksCount: number;
  servicesCount: number;
}

export interface EKSCluster {
  name: string;
  status: string;
  version: string;
}

export interface DynamoDBTable {
  tableName: string;
  tableStatus: string;
  itemCount: number;
  tableSizeBytes: number;
}

export interface RedshiftCluster {
  clusterIdentifier: string;
  nodeType: string;
  numberOfNodes: number;
  clusterStatus: string;
}

export interface SQSQueue {
  queueUrl: string;
  queueName: string;
}

export interface SNSTopic {
  topicArn: string;
  topicName: string;
}

export interface KinesisStream {
  streamName: string;
  status: string;
  shardCount: number;
}

export interface EventBridgeBus {
  name: string;
  arn: string;
}

export interface APIGatewayREST {
  id: string;
  name: string;
  createdDate: string;
}

export interface APIGatewayHTTP {
  apiId: string;
  name: string;
  protocolType: string;
}

export interface CloudFrontDistribution {
  id: string;
  domainName: string;
  status: string;
  enabled: boolean;
}

export interface HostedZone {
  id: string;
  name: string;
  recordSetCount: number;
  isPrivate: boolean;
}

export interface ACMCertificate {
  certificateArn: string;
  domainName: string;
  status: string;
  type: string;
}

export interface GlueJob {
  name: string;
  command: string;
  maxCapacity: number;
}

export interface SageMakerEndpoint {
  endpointName: string;
  status: string;
  creationTime: string;
}

export interface TransferServer {
  serverId: string;
  state: string;
  endpointType: string;
  protocols: string[];
}
