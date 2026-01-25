#!/bin/bash

# AWS Paid Resources Scanner
# Scans for resources that may incur costs

set -euo pipefail

export AWS_PAGER=""

AWS_CMD="aws-vault exec admin -- aws"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_found() {
    echo -e "${YELLOW}⚠ Found:${NC} $1"
}

print_none() {
    echo -e "${GREEN}✓${NC} None"
}

print_error() {
    echo -e "${RED}✗ Error:${NC} $1"
}

check_resource() {
    local name="$1"
    local cmd="$2"
    local count_query="$3"

    print_header "$name"

    if result=$($AWS_CMD $cmd 2>/dev/null); then
        count=$(echo "$result" | jq -r "$count_query" 2>/dev/null || echo "0")
        if [[ "$count" -gt 0 ]]; then
            echo "$result" | jq -r "${4:-.}" 2>/dev/null || echo "$result"
            return 0
        else
            print_none
            return 1
        fi
    else
        print_error "Failed to query $name"
        return 1
    fi
}

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     AWS Paid Resources Scanner         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"

# Get account info
print_header "Account Info"
$AWS_CMD sts get-caller-identity 2>/dev/null | jq -r '"Account: \(.Account)\nUser: \(.Arn)"' || print_error "Failed to get account info"

# EC2 Instances (running or stopped - stopped still costs for EBS)
print_header "EC2 Instances (running/stopped)"
instances=$($AWS_CMD ec2 describe-instances \
    --query 'Reservations[*].Instances[?State.Name!=`terminated`].[InstanceId,InstanceType,State.Name,Tags[?Key==`Name`].Value|[0]]' \
    --output json 2>/dev/null | jq -r 'flatten(1) | .[]')
if [[ -n "$instances" && "$instances" != "null" ]]; then
    $AWS_CMD ec2 describe-instances \
        --query 'Reservations[*].Instances[?State.Name!=`terminated`].[InstanceId,InstanceType,State.Name,Tags[?Key==`Name`].Value|[0]]' \
        --output table 2>/dev/null
else
    print_none
fi

# EBS Volumes
print_header "EBS Volumes"
volumes=$($AWS_CMD ec2 describe-volumes --query 'Volumes[*].[VolumeId,Size,State,VolumeType]' --output json 2>/dev/null)
count=$(echo "$volumes" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    $AWS_CMD ec2 describe-volumes --query 'Volumes[*].[VolumeId,Size,State,VolumeType,Attachments[0].InstanceId]' --output table 2>/dev/null
else
    print_none
fi

# EBS Snapshots
print_header "EBS Snapshots"
snapshots=$($AWS_CMD ec2 describe-snapshots --owner-ids self --query 'Snapshots[*].[SnapshotId,VolumeSize,State]' --output json 2>/dev/null)
count=$(echo "$snapshots" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    $AWS_CMD ec2 describe-snapshots --owner-ids self --query 'Snapshots[*].[SnapshotId,VolumeSize,State,Description]' --output table 2>/dev/null
else
    print_none
fi

# Elastic IPs
print_header "Elastic IPs (unattached cost money)"
eips=$($AWS_CMD ec2 describe-addresses --query 'Addresses[*].[PublicIp,AllocationId,InstanceId]' --output json 2>/dev/null)
count=$(echo "$eips" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    $AWS_CMD ec2 describe-addresses --query 'Addresses[*].[PublicIp,AllocationId,InstanceId,AssociationId]' --output table 2>/dev/null
else
    print_none
fi

# NAT Gateways
print_header "NAT Gateways"
nats=$($AWS_CMD ec2 describe-nat-gateways --query 'NatGateways[?State==`available`].[NatGatewayId]' --output json 2>/dev/null)
count=$(echo "$nats" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    $AWS_CMD ec2 describe-nat-gateways --query 'NatGateways[?State==`available`].[NatGatewayId,State,VpcId,SubnetId]' --output table 2>/dev/null
else
    print_none
fi

# VPC Endpoints (Interface endpoints cost money, Gateway endpoints are free)
print_header "VPC Endpoints (Interface type costs money)"
endpoints=$($AWS_CMD ec2 describe-vpc-endpoints --query 'VpcEndpoints[?VpcEndpointType==`Interface`].[VpcEndpointId]' --output json 2>/dev/null)
count=$(echo "$endpoints" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    $AWS_CMD ec2 describe-vpc-endpoints --query 'VpcEndpoints[?VpcEndpointType==`Interface`].[VpcEndpointId,ServiceName,State]' --output table 2>/dev/null
else
    print_none
fi

# RDS Instances
print_header "RDS Instances"
rds=$($AWS_CMD rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier]' --output json 2>/dev/null)
count=$(echo "$rds" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    $AWS_CMD rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,DBInstanceClass,DBInstanceStatus,Engine]' --output table 2>/dev/null
else
    print_none
fi

# RDS Snapshots
print_header "RDS Snapshots"
rds_snaps=$($AWS_CMD rds describe-db-snapshots --query 'DBSnapshots[?SnapshotType==`manual`].[DBSnapshotIdentifier]' --output json 2>/dev/null)
count=$(echo "$rds_snaps" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    $AWS_CMD rds describe-db-snapshots --query 'DBSnapshots[?SnapshotType==`manual`].[DBSnapshotIdentifier,AllocatedStorage,Status]' --output table 2>/dev/null
else
    print_none
fi

# S3 Buckets
print_header "S3 Buckets"
buckets=$($AWS_CMD s3api list-buckets --query 'Buckets[*].Name' --output json 2>/dev/null)
count=$(echo "$buckets" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    $AWS_CMD s3 ls 2>/dev/null
else
    print_none
fi

# Lambda Functions
print_header "Lambda Functions"
lambdas=$($AWS_CMD lambda list-functions --query 'Functions[*].[FunctionName]' --output json 2>/dev/null)
count=$(echo "$lambdas" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    $AWS_CMD lambda list-functions --query 'Functions[*].[FunctionName,Runtime,MemorySize,Timeout]' --output table 2>/dev/null
else
    print_none
fi

# Load Balancers (ALB/NLB)
print_header "Load Balancers (ALB/NLB)"
lbs=$($AWS_CMD elbv2 describe-load-balancers --query 'LoadBalancers[*].[LoadBalancerName]' --output json 2>/dev/null)
count=$(echo "$lbs" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    $AWS_CMD elbv2 describe-load-balancers --query 'LoadBalancers[*].[LoadBalancerName,Type,State.Code,DNSName]' --output table 2>/dev/null
else
    print_none
fi

# Classic Load Balancers
print_header "Classic Load Balancers"
clbs=$($AWS_CMD elb describe-load-balancers --query 'LoadBalancerDescriptions[*].[LoadBalancerName]' --output json 2>/dev/null)
count=$(echo "$clbs" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    $AWS_CMD elb describe-load-balancers --query 'LoadBalancerDescriptions[*].[LoadBalancerName,DNSName]' --output table 2>/dev/null
else
    print_none
fi

# EFS File Systems
print_header "EFS File Systems"
efs=$($AWS_CMD efs describe-file-systems --query 'FileSystems[*].[FileSystemId]' --output json 2>/dev/null)
count=$(echo "$efs" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    $AWS_CMD efs describe-file-systems --query 'FileSystems[*].[FileSystemId,Name,LifeCycleState,SizeInBytes.Value]' --output table 2>/dev/null
else
    print_none
fi

# ElastiCache Clusters
print_header "ElastiCache Clusters"
elasticache=$($AWS_CMD elasticache describe-cache-clusters --query 'CacheClusters[*].[CacheClusterId]' --output json 2>/dev/null)
count=$(echo "$elasticache" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    $AWS_CMD elasticache describe-cache-clusters --query 'CacheClusters[*].[CacheClusterId,CacheNodeType,Engine,CacheClusterStatus]' --output table 2>/dev/null
else
    print_none
fi

# OpenSearch/Elasticsearch Domains
print_header "OpenSearch Domains"
opensearch=$($AWS_CMD opensearch list-domain-names --query 'DomainNames[*].DomainName' --output json 2>/dev/null)
count=$(echo "$opensearch" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    echo "$opensearch" | jq -r '.[]'
else
    print_none
fi

# Secrets Manager
print_header "Secrets Manager Secrets"
secrets=$($AWS_CMD secretsmanager list-secrets --query 'SecretList[*].[Name]' --output json 2>/dev/null)
count=$(echo "$secrets" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    $AWS_CMD secretsmanager list-secrets --query 'SecretList[*].[Name,ARN]' --output table 2>/dev/null
else
    print_none
fi

# CloudWatch Log Groups (with retention - indefinite retention costs more)
print_header "CloudWatch Log Groups"
logs=$($AWS_CMD logs describe-log-groups --query 'logGroups[*].[logGroupName]' --output json 2>/dev/null)
count=$(echo "$logs" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    print_found "$count log groups"
    $AWS_CMD logs describe-log-groups --query 'logGroups[*].[logGroupName,storedBytes,retentionInDays]' --output table 2>/dev/null
else
    print_none
fi

# ECR Repositories
print_header "ECR Repositories"
ecr=$($AWS_CMD ecr describe-repositories --query 'repositories[*].[repositoryName]' --output json 2>/dev/null)
count=$(echo "$ecr" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    $AWS_CMD ecr describe-repositories --query 'repositories[*].[repositoryName,repositoryUri]' --output table 2>/dev/null
else
    print_none
fi

# ECS Clusters
print_header "ECS Clusters"
ecs=$($AWS_CMD ecs list-clusters --query 'clusterArns' --output json 2>/dev/null)
count=$(echo "$ecs" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    for cluster in $(echo "$ecs" | jq -r '.[]'); do
        echo "Cluster: $cluster"
        $AWS_CMD ecs list-services --cluster "$cluster" --query 'serviceArns' --output table 2>/dev/null
    done
else
    print_none
fi

# EKS Clusters
print_header "EKS Clusters"
eks=$($AWS_CMD eks list-clusters --query 'clusters' --output json 2>/dev/null)
count=$(echo "$eks" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    echo "$eks" | jq -r '.[]'
else
    print_none
fi

# DynamoDB Tables
print_header "DynamoDB Tables"
dynamo=$($AWS_CMD dynamodb list-tables --query 'TableNames' --output json 2>/dev/null)
count=$(echo "$dynamo" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    echo "$dynamo" | jq -r '.[]'
else
    print_none
fi

# Kinesis Streams
print_header "Kinesis Streams"
kinesis=$($AWS_CMD kinesis list-streams --query 'StreamNames' --output json 2>/dev/null)
count=$(echo "$kinesis" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    echo "$kinesis" | jq -r '.[]'
else
    print_none
fi

# SQS Queues
print_header "SQS Queues"
sqs=$($AWS_CMD sqs list-queues --query 'QueueUrls' --output json 2>/dev/null)
count=$(echo "$sqs" | jq 'length' 2>/dev/null || echo "0")
if [[ "$count" -gt 0 && "$sqs" != "null" ]]; then
    echo "$sqs" | jq -r '.[]'
else
    print_none
fi

# SNS Topics
print_header "SNS Topics"
sns=$($AWS_CMD sns list-topics --query 'Topics[*].TopicArn' --output json 2>/dev/null)
count=$(echo "$sns" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    echo "$sns" | jq -r '.[]'
else
    print_none
fi

# API Gateway REST APIs
print_header "API Gateway REST APIs"
apigw=$($AWS_CMD apigateway get-rest-apis --query 'items[*].[name,id]' --output json 2>/dev/null)
count=$(echo "$apigw" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    $AWS_CMD apigateway get-rest-apis --query 'items[*].[name,id,createdDate]' --output table 2>/dev/null
else
    print_none
fi

# API Gateway HTTP APIs
print_header "API Gateway HTTP APIs"
apigwv2=$($AWS_CMD apigatewayv2 get-apis --query 'Items[*].[Name,ApiId]' --output json 2>/dev/null)
count=$(echo "$apigwv2" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    $AWS_CMD apigatewayv2 get-apis --query 'Items[*].[Name,ApiId,ProtocolType]' --output table 2>/dev/null
else
    print_none
fi

# CloudFront Distributions
print_header "CloudFront Distributions"
cf=$($AWS_CMD cloudfront list-distributions --query 'DistributionList.Items[*].[Id]' --output json 2>/dev/null)
count=$(echo "$cf" | jq 'length' 2>/dev/null || echo "0")
if [[ "$count" -gt 0 && "$cf" != "null" ]]; then
    $AWS_CMD cloudfront list-distributions --query 'DistributionList.Items[*].[Id,DomainName,Status]' --output table 2>/dev/null
else
    print_none
fi

# Route53 Hosted Zones
print_header "Route53 Hosted Zones"
r53=$($AWS_CMD route53 list-hosted-zones --query 'HostedZones[*].[Id]' --output json 2>/dev/null)
count=$(echo "$r53" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    $AWS_CMD route53 list-hosted-zones --query 'HostedZones[*].[Name,Id,ResourceRecordSetCount]' --output table 2>/dev/null
else
    print_none
fi

# ACM Certificates
print_header "ACM Certificates"
acm=$($AWS_CMD acm list-certificates --query 'CertificateSummaryList[*].[CertificateArn]' --output json 2>/dev/null)
count=$(echo "$acm" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    $AWS_CMD acm list-certificates --query 'CertificateSummaryList[*].[DomainName,Status]' --output table 2>/dev/null
else
    print_none
fi

# KMS Keys (customer managed)
print_header "KMS Keys (Customer Managed)"
kms=$($AWS_CMD kms list-keys --query 'Keys[*].KeyId' --output json 2>/dev/null)
count=$(echo "$kms" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    for keyid in $(echo "$kms" | jq -r '.[]'); do
        key_info=$($AWS_CMD kms describe-key --key-id "$keyid" --query 'KeyMetadata.[KeyId,KeyManager,KeyState]' --output text 2>/dev/null)
        manager=$(echo "$key_info" | awk '{print $2}')
        if [[ "$manager" == "CUSTOMER" ]]; then
            echo "$key_info"
        fi
    done
else
    print_none
fi

# Glue Jobs
print_header "Glue Jobs"
glue=$($AWS_CMD glue get-jobs --query 'Jobs[*].Name' --output json 2>/dev/null)
count=$(echo "$glue" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    echo "$glue" | jq -r '.[]'
else
    print_none
fi

# SageMaker Endpoints
print_header "SageMaker Endpoints"
sm=$($AWS_CMD sagemaker list-endpoints --query 'Endpoints[*].[EndpointName,EndpointStatus]' --output json 2>/dev/null)
count=$(echo "$sm" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    $AWS_CMD sagemaker list-endpoints --query 'Endpoints[*].[EndpointName,EndpointStatus]' --output table 2>/dev/null
else
    print_none
fi

# Redshift Clusters
print_header "Redshift Clusters"
redshift=$($AWS_CMD redshift describe-clusters --query 'Clusters[*].[ClusterIdentifier]' --output json 2>/dev/null)
count=$(echo "$redshift" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    $AWS_CMD redshift describe-clusters --query 'Clusters[*].[ClusterIdentifier,NodeType,ClusterStatus]' --output table 2>/dev/null
else
    print_none
fi

# Transfer Family Servers
print_header "Transfer Family Servers"
transfer=$($AWS_CMD transfer list-servers --query 'Servers[*].[ServerId]' --output json 2>/dev/null)
count=$(echo "$transfer" | jq 'length')
if [[ "$count" -gt 0 ]]; then
    $AWS_CMD transfer list-servers --query 'Servers[*].[ServerId,State,EndpointType]' --output table 2>/dev/null
else
    print_none
fi

echo -e "\n${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}Scan Complete${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"

# Get current month costs
print_header "Current Month Costs (MTD)"
start_date=$(date -d "$(date +%Y-%m-01)" +%Y-%m-%d)
end_date=$(date +%Y-%m-%d)

costs=$($AWS_CMD ce get-cost-and-usage \
    --time-period Start="$start_date",End="$end_date" \
    --granularity MONTHLY \
    --metrics "UnblendedCost" \
    --group-by Type=DIMENSION,Key=SERVICE 2>/dev/null)

if [[ -n "$costs" ]]; then
    echo "$costs" | jq -r '
        .ResultsByTime[0].Groups
        | sort_by(.Metrics.UnblendedCost.Amount | tonumber)
        | reverse
        | .[]
        | select(.Metrics.UnblendedCost.Amount | tonumber > 0)
        | "\(.Keys[0]): $\(.Metrics.UnblendedCost.Amount | tonumber | . * 100 | round / 100)"'

    total=$($AWS_CMD ce get-cost-and-usage \
        --time-period Start="$start_date",End="$end_date" \
        --granularity MONTHLY \
        --metrics "UnblendedCost" 2>/dev/null | jq -r '.ResultsByTime[0].Total.UnblendedCost.Amount | tonumber | . * 100 | round / 100')

    echo -e "\n${YELLOW}Total MTD: \$${total}${NC}"
else
    print_error "Failed to get cost data"
fi
