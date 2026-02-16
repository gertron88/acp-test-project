import { Command } from 'commander';
import chalk from 'chalk';
import { loadProject, loadAgents } from '../../core/project.js';

export const agentCommands = {
  list: new Command('list')
    .alias('ls')
    .description('List all agents')
    .option('-a, --all', 'Include offline agents')
    .action(async (_options) => {
      try {
        const project = await loadProject(process.cwd());
        const agents = await loadAgents(project.path);
        
        console.log(chalk.bold('\n🤖 Agents\n'));
        
        if (agents.length === 0) {
          console.log(chalk.gray('No agents found. Spawn one with:'));
          console.log(chalk.cyan('  acp-agent claim-slot <slot> --provider=openclaw'));
          return;
        }
        
        // Header
        console.log(
          chalk.gray(
            `${'ID'.padEnd(16)} ${'ROLE'.padEnd(18)} ${'STATUS'.padEnd(12)} TASK`
          )
        );
        console.log(chalk.gray('─'.repeat(70)));
        
        // Rows
        for (const agent of agents) {
          const statusIcon = getStatusIcon(agent.status);
          const task = agent.currentTask || chalk.gray('-');
          
          console.log(
            `${agent.id.padEnd(16)} ` +
            `${agent.role.padEnd(18)} ` +
            `${statusIcon} ${agent.status.padEnd(8)} ` +
            `${task}`
          );
        }
        
        console.log();
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    }),

  spawn: new Command('spawn')
    .description('Spawn an agent (manual slot claim)')
    .argument('<slot>', 'Slot ID to claim')
    .requiredOption('-p, --provider <provider>', 'Provider (openclaw, claude, codex)')
    .option('-m, --model <model>', 'Model to use')
    .action(async (slot, options) => {
      console.log(chalk.yellow('Use acp-agent claim-slot instead:'));
      console.log(chalk.cyan(`  acp-agent claim-slot ${slot} --provider=${options.provider}`));
    }),

  kill: new Command('kill')
    .description('Kill an agent session')
    .argument('<agent>', 'Agent ID')
    .option('-f, --force', 'Force kill without graceful shutdown')
    .action(async (_agent, _options) => {
      console.log(chalk.yellow('Not implemented yet'));
    }),

  status: new Command('status')
    .description('Show agent status')
    .argument('<agent>', 'Agent ID')
    .action(async (_agent) => {
      console.log(chalk.yellow('Not implemented yet'));
    })
};

function getStatusIcon(status: string): string {
  switch (status) {
    case 'idle': return chalk.gray('⚪');
    case 'active': return chalk.green('🟢');
    case 'busy': return chalk.blue('🔵');
    case 'blocked': return chalk.red('🔴');
    case 'offline': return chalk.gray('⚫');
    case 'error': return chalk.red('❌');
    default: return chalk.gray('?');
  }
}
