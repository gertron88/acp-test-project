#!/usr/bin/env node
/**
 * ACP CLI - Main command line interface
 * Usage: acp <command> [options]
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { slotCommands } from './commands/slot.js';
import { agentCommands } from './commands/agent.js';
import { taskCommands } from './commands/task.js';
import { projectCommands } from './commands/project.js';
import { statusCommand } from './commands/status.js';

const program = new Command();

program
  .name('acp')
  .description('Agent Coordination Protocol - Manage multi-agent software engineering teams')
  .version('0.1.0')
  .option('-p, --project <path>', 'Project directory', process.cwd())
  .option('-c, --config <path>', 'Config file path')
  .option('-v, --verbose', 'Verbose output')
  .hook('preAction', (thisCommand) => {
    const options = thisCommand.opts();
    if (options.verbose) {
      console.log(chalk.gray(`Project: ${options.project}`));
    }
  });

// Slot management
program
  .command('slot')
  .description('Manage agent slots')
  .addCommand(slotCommands.list)
  .addCommand(slotCommands.create)
  .addCommand(slotCommands.show)
  .addCommand(slotCommands.delete);

// Agent management
program
  .command('agent')
  .description('Manage agents')
  .addCommand(agentCommands.list)
  .addCommand(agentCommands.spawn)
  .addCommand(agentCommands.kill)
  .addCommand(agentCommands.status);

// Task management
program
  .command('task')
  .description('Manage tasks')
  .addCommand(taskCommands.list)
  .addCommand(taskCommands.create)
  .addCommand(taskCommands.assign)
  .addCommand(taskCommands.show);

// Project management
program
  .command('init')
  .description('Initialize ACP in current directory')
  .action(projectCommands.init);

// Status
program
  .command('status')
  .description('Show overall status')
  .action(statusCommand);

program.parse();
