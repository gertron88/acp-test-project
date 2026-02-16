import { Command } from 'commander';
import chalk from 'chalk';
import { loadProject, loadSlots, saveSlot } from '../../core/project.js';
import { Slot } from '../../types/index.js';

export const slotCommands = {
  list: new Command('list')
    .alias('ls')
    .description('List all slots')
    .option('-a, --all', 'Include inactive slots')
    .action(async (_options) => {
      try {
        const project = await loadProject(process.cwd());
        const slots = await loadSlots(project.path);
        
        console.log(chalk.bold('\n🎰 Slots\n'));
        
        if (slots.length === 0) {
          console.log(chalk.gray('No slots found. Create one with:'));
          console.log(chalk.cyan('  acp slot create <name>'));
          return;
        }
        
        // Header
        console.log(
          chalk.gray(
            `${'ID'.padEnd(16)} ${'ROLE'.padEnd(18)} ${'STATUS'.padEnd(12)} CLAIMED BY`
          )
        );
        console.log(chalk.gray('─'.repeat(70)));
        
        // Rows
        for (const slot of slots) {
          const statusIcon = getStatusIcon(slot.status);
          const claimedBy = slot.currentClaims.length > 0 
            ? `${slot.currentClaims[0].provider}/${slot.currentClaims[0].model}`
            : chalk.gray('-');
          
          console.log(
            `${slot.id.padEnd(16)} ` +
            `${slot.role.padEnd(18)} ` +
            `${statusIcon} ${slot.status.padEnd(8)} ` +
            `${claimedBy}`
          );
        }
        
        console.log();
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    }),

  create: new Command('create')
    .description('Create a new slot')
    .argument('<name>', 'Slot ID (e.g., backend-dev-1)')
    .requiredOption('-r, --role <role>', 'Agent role (e.g., backend-developer)')
    .option('-p, --providers <providers>', 'Approved providers (comma-separated)', 'openclaw')
    .option('-m, --models <models>', 'Approved models (comma-separated)', 'kimi-coding/k2p5')
    .option('--max <n>', 'Max concurrent agents', '1')
    .action(async (name, options) => {
      try {
        const project = await loadProject(process.cwd());
        
        const slot: Slot = {
          id: name,
          name: name,
          role: options.role,
          status: 'available',
          approvedProviders: options.providers.split(',').map((p: string) => p.trim()),
          approvedModels: options.models.split(',').map((m: string) => m.trim()),
          maxConcurrent: parseInt(options.max),
          approved: true,
          approvedBy: 'cli',
          approvedAt: new Date(),
          currentClaims: [],
          claimHistory: []
        };
        
        await saveSlot(project.path, slot);
        
        console.log(chalk.green('✓'), `Created slot ${chalk.cyan(name)}`);
        console.log(chalk.gray(`  Role: ${slot.role}`));
        console.log(chalk.gray(`  Providers: ${slot.approvedProviders.join(', ')}`));
        console.log(chalk.gray(`  Models: ${slot.approvedModels.join(', ')}`));
        console.log();
        console.log(chalk.gray('Next: Commit this slot and an agent can claim it with:'));
        console.log(chalk.cyan(`  acp-agent claim-slot ${name} --provider=openclaw`));
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    }),

  show: new Command('show')
    .description('Show slot details')
    .argument('<name>', 'Slot ID')
    .action(async (name) => {
      try {
        const project = await loadProject(process.cwd());
        const slots = await loadSlots(project.path);
        const slot = slots.find(s => s.id === name);
        
        if (!slot) {
          console.error(chalk.red(`Slot ${name} not found`));
          process.exit(1);
        }
        
        console.log(chalk.bold(`\n🎰 Slot: ${slot.id}\n`));
        console.log(`  Role: ${chalk.cyan(slot.role)}`);
        console.log(`  Status: ${getStatusIcon(slot.status)} ${slot.status}`);
        console.log(`  Approved: ${slot.approved ? chalk.green('Yes') : chalk.red('No')}`);
        console.log(`  Max Concurrent: ${slot.maxConcurrent}`);
        console.log(`  Providers: ${slot.approvedProviders.join(', ')}`);
        console.log(`  Models: ${slot.approvedModels.join(', ')}`);
        
        if (slot.currentClaims.length > 0) {
          console.log(chalk.bold('\n  Current Claims:'));
          for (const claim of slot.currentClaims) {
            console.log(`    • ${claim.provider}/${claim.model}`);
            console.log(`      Session: ${claim.sessionKey}`);
            console.log(`      Claimed: ${claim.claimedAt.toISOString()}`);
          }
        }
        
        console.log();
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    }),

  delete: new Command('delete')
    .alias('rm')
    .description('Delete a slot')
    .argument('<name>', 'Slot ID')
    .option('-f, --force', 'Force delete even if claimed')
    .action(async (_name, _options) => {
      console.log(chalk.yellow('Not implemented yet'));
    })
};

function getStatusIcon(status: string): string {
  switch (status) {
    case 'available': return chalk.green('⚪');
    case 'claimed': return chalk.green('🟢');
    case 'suspended': return chalk.yellow('🟡');
    case 'expired': return chalk.red('🔴');
    default: return chalk.gray('⚫');
  }
}
