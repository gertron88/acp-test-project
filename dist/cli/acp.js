#!/usr/bin/env node
"use strict";
/**
 * ACP CLI - Main command line interface
 * Usage: acp <command> [options]
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const slot_js_1 = require("./commands/slot.js");
const agent_js_1 = require("./commands/agent.js");
const task_js_1 = require("./commands/task.js");
const project_js_1 = require("./commands/project.js");
const status_js_1 = require("./commands/status.js");
const github_js_1 = require("./commands/github.js");
const program = new commander_1.Command();
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
        console.log(chalk_1.default.gray(`Project: ${options.project}`));
    }
});
// Slot management
program
    .command('slot')
    .description('Manage agent slots')
    .addCommand(slot_js_1.slotCommands.list)
    .addCommand(slot_js_1.slotCommands.create)
    .addCommand(slot_js_1.slotCommands.show)
    .addCommand(slot_js_1.slotCommands.delete);
// Agent management
program
    .command('agent')
    .description('Manage agents')
    .addCommand(agent_js_1.agentCommands.list)
    .addCommand(agent_js_1.agentCommands.spawn)
    .addCommand(agent_js_1.agentCommands.kill)
    .addCommand(agent_js_1.agentCommands.status);
// Task management
program
    .command('task')
    .description('Manage tasks')
    .addCommand(task_js_1.taskCommands.list)
    .addCommand(task_js_1.taskCommands.create)
    .addCommand(task_js_1.taskCommands.assign)
    .addCommand(task_js_1.taskCommands.show);
// GitHub integration
program
    .command('github')
    .description('GitHub integration')
    .addCommand(github_js_1.githubCommands.setup)
    .addCommand(github_js_1.githubCommands.status)
    .addCommand(github_js_1.githubCommands.sync);
// Project management
program
    .command('init')
    .description('Initialize ACP in current directory')
    .action(project_js_1.projectCommands.init);
// Status
program
    .command('status')
    .description('Show overall status')
    .action(status_js_1.statusCommand);
program.parse();
//# sourceMappingURL=acp.js.map