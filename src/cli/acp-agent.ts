#!/usr/bin/env node
/**
 * ACP Agent Daemon - Agent-side CLI
 * Usage: acp-agent claim-slot <slot> --provider=openclaw
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { claimSlot } from './commands/claim-slot.js';
import { releaseSlot } from './commands/release-slot.js';
import { startWorker } from './commands/worker.js';

const program = new Command();

program
  .name('acp-agent')
  .description('ACP Agent Daemon - Claim slots and execute tasks')
  .version('0.1.0')
  .option('-p, --project <path>', 'Project directory', process.cwd())
  .option('-v, --verbose', 'Verbose output');

program
  .command('claim-slot')
  .description('Claim a slot and start agent session')
  .argument('<slot>', 'Slot ID to claim')
  .requiredOption('--provider <provider>', 'Provider (openclaw, claude, codex)')
  .option('--model <model>', 'Model to use')
  .option('--name <name>', 'Agent name (defaults to slot ID)')
  .action(async (slot, options) => {
    try {
      console.log(chalk.blue('🤖'), `Claiming slot ${chalk.cyan(slot)}...`);
      
      const result = await claimSlot({
        projectPath: program.opts().project,
        slotId: slot,
        provider: options.provider,
        model: options.model,
        name: options.name || slot
      });
      
      console.log(chalk.green('✓'), 'Slot claimed successfully');
      console.log(chalk.gray(`  Agent ID: ${result.agentId}`));
      console.log(chalk.gray(`  Session: ${result.sessionKey}`));
      console.log(chalk.gray(`  Role: ${result.manifest.role.title}`));
      console.log();
      console.log(chalk.gray('Starting worker loop...'));
      
      // Start worker
      await startWorker({
        projectPath: program.opts().project,
        agentId: result.agentId,
        sessionKey: result.sessionKey,
        manifest: result.manifest
      });
      
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('release-slot')
  .description('Release a claimed slot')
  .argument('<slot>', 'Slot ID to release')
  .action(async (slot) => {
    try {
      await releaseSlot({
        projectPath: program.opts().project,
        slotId: slot
      });
      console.log(chalk.green('✓'), `Released slot ${chalk.cyan(slot)}`);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
