import chalk from 'chalk';
import Table from 'cli-table3';

export function printHeader(title: string): void {
  console.log();
  console.log(chalk.blue.bold(title));
  console.log(chalk.blue('─'.repeat(title.length)));
}

export function printError(message: string): void {
  console.log(chalk.red(`  ✗ ${message}`));
}

export function printTable(headers: string[], rows: string[][]): void {
  const table = new Table({
    head: headers.map((h) => chalk.white.bold(h)),
    style: {
      head: [],
      border: ['gray'],
    },
  });

  rows.forEach((row) => table.push(row));
  console.log(table.toString());
}

export function printAccountInfo(accountId: string, arn: string): void {
  console.log(chalk.gray(`Account: ${chalk.white(accountId)} (${arn})`));
}

export function printEmptyResourcesTree(
  emptyByCategory: Map<string, string[]>
): void {
  if (emptyByCategory.size === 0) return;

  console.log();
  console.log(chalk.green.bold('Empty Resources'));
  console.log(chalk.green('───────────────'));

  const categories = Array.from(emptyByCategory.keys()).sort();
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    const resources = emptyByCategory.get(category)!;
    const isLast = i === categories.length - 1;
    const prefix = isLast ? '└── ' : '├── ';

    console.log(chalk.gray(prefix) + chalk.white(category));

    for (let j = 0; j < resources.length; j++) {
      const resource = resources[j];
      const childPrefix = isLast ? '    ' : '│   ';
      const childMarker = j === resources.length - 1 ? '└── ' : '├── ';
      console.log(chalk.gray(childPrefix + childMarker) + chalk.gray(resource));
    }
  }
}

export function printCostSummary(
  totalCost: number,
  serviceBreakdown: { service: string; cost: number }[]
): void {
  printHeader(`Cost (MTD): $${totalCost.toFixed(2)}`);

  const nonZero = serviceBreakdown
    .filter(({ cost }) => cost > 0.01)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10);

  if (nonZero.length > 0) {
    const table = new Table({
      head: [chalk.white.bold('Service'), chalk.white.bold('Cost')],
      style: {
        head: [],
        border: ['gray'],
      },
    });

    nonZero.forEach(({ service, cost }) => {
      table.push([service, `$${cost.toFixed(2)}`]);
    });

    console.log(table.toString());
  }
}
