import chalk from 'chalk';
import Table from 'cli-table3';

export function printBanner(): void {
  console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   █████╗ ██╗    ██╗███████╗    ███████╗ ██████╗██████╗  ██████╗   ║
║  ██╔══██╗██║    ██║██╔════╝    ██╔════╝██╔════╝██╔══██╗██╔═══██╗  ║
║  ███████║██║ █╗ ██║███████╗    ███████╗██║     ██████╔╝██║   ██║  ║
║  ██╔══██║██║███╗██║╚════██║    ╚════██║██║     ██╔══██╗██║   ██║  ║
║  ██║  ██║╚███╔███╔╝███████║    ███████║╚██████╗██║  ██║╚██████╔╝  ║
║  ╚═╝  ╚═╝ ╚══╝╚══╝ ╚══════╝    ╚══════╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝   ║
║                     O G E                                         ║
║                                                                   ║
║            AWS Resource Scanner - Find Your Cloud Spend           ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
`));
}

export function printHeader(title: string): void {
  const line = '='.repeat(60);
  console.log();
  console.log(chalk.blue(line));
  console.log(chalk.blue.bold(`  ${title}`));
  console.log(chalk.blue(line));
}

export function printSubHeader(title: string): void {
  console.log();
  console.log(chalk.cyan(`--- ${title} ---`));
}

export function printFound(message: string): void {
  console.log(chalk.yellow(`⚠ ${message}`));
}

export function printNone(): void {
  console.log(chalk.green('✓ None found'));
}

export function printError(message: string): void {
  console.log(chalk.red(`✗ Error: ${message}`));
}

export function printInfo(message: string): void {
  console.log(chalk.gray(`  ${message}`));
}

export function printSuccess(message: string): void {
  console.log(chalk.green(`✓ ${message}`));
}

export function printTable(headers: string[], rows: string[][]): void {
  if (rows.length === 0) {
    printNone();
    return;
  }

  const table = new Table({
    head: headers.map(h => chalk.white.bold(h)),
    style: {
      head: [],
      border: ['gray']
    }
  });

  rows.forEach(row => table.push(row));
  console.log(table.toString());
}

export function printAccountInfo(accountId: string, arn: string): void {
  console.log();
  console.log(chalk.white.bold('Account Information:'));
  console.log(chalk.gray(`  Account ID: ${chalk.white(accountId)}`));
  console.log(chalk.gray(`  ARN: ${chalk.white(arn)}`));
}

export function printCostSummary(totalCost: number, serviceBreakdown: { service: string; cost: number }[]): void {
  printHeader('Cost Summary (Month-to-Date)');

  console.log();
  console.log(chalk.white.bold(`Total MTD Cost: ${chalk.green(`$${totalCost.toFixed(2)}`)}`));

  if (serviceBreakdown.length > 0) {
    console.log();
    console.log(chalk.white.bold('Top Services by Cost:'));

    const table = new Table({
      head: [chalk.white.bold('Service'), chalk.white.bold('Cost')],
      style: {
        head: [],
        border: ['gray']
      }
    });

    serviceBreakdown
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10)
      .forEach(({ service, cost }) => {
        if (cost > 0) {
          table.push([service, `$${cost.toFixed(2)}`]);
        }
      });

    console.log(table.toString());
  }
}

export function printScanComplete(): void {
  console.log();
  console.log(chalk.green.bold('═'.repeat(60)));
  console.log(chalk.green.bold('  Scan Complete!'));
  console.log(chalk.green.bold('═'.repeat(60)));
  console.log();
}
