import {
  CostExplorerClient,
  GetCostAndUsageCommand,
} from '@aws-sdk/client-cost-explorer';
import type { CostByService } from './types.js';

export async function getCostAndUsage(): Promise<{
  totalCost: number;
  serviceBreakdown: CostByService[];
}> {
  const client = new CostExplorerClient({});

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  try {
    const response = await client.send(
      new GetCostAndUsageCommand({
        TimePeriod: {
          Start: formatDate(startOfMonth),
          End: formatDate(tomorrow),
        },
        Granularity: 'MONTHLY',
        Metrics: ['UnblendedCost'],
        GroupBy: [
          {
            Type: 'DIMENSION',
            Key: 'SERVICE',
          },
        ],
      })
    );

    let totalCost = 0;
    const serviceBreakdown: CostByService[] = [];

    response.ResultsByTime?.forEach((result) => {
      result.Groups?.forEach((group) => {
        const service = group.Keys?.[0] || 'Unknown';
        const cost = parseFloat(group.Metrics?.UnblendedCost?.Amount || '0');
        totalCost += cost;
        serviceBreakdown.push({ service, cost });
      });
    });

    return { totalCost, serviceBreakdown };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to get cost data: ${message}`);
    return { totalCost: 0, serviceBreakdown: [] };
  }
}
