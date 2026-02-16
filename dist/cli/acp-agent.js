#!/usr/bin/env node
"use strict";
/**
 * ACP Agent Daemon - Agent-side CLI
 * Usage: acp-agent claim-slot <slot> --provider=openclaw
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const claim_slot_js_1 = require("./commands/claim-slot.js");
const release_slot_js_1 = require("./commands/release-slot.js");
const worker_js_1 = require("./commands/worker.js");
const program = new commander_1.Command();
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
        console.log(chalk_1.default.blue('🤖'), `Claiming slot ${chalk_1.default.cyan(slot)}...`);
        const result = await (0, claim_slot_js_1.claimSlot)({
            projectPath: program.opts().project,
            slotId: slot,
            provider: options.provider,
            model: options.model,
            name: options.name || slot
        });
        console.log(chalk_1.default.green('✓'), 'Slot claimed successfully');
        console.log(chalk_1.default.gray(`  Agent ID: ${result.agentId}`));
        console.log(chalk_1.default.gray(`  Session: ${result.sessionKey}`));
        console.log(chalk_1.default.gray(`  Role: ${result.manifest.role.title}`));
        console.log();
        console.log(chalk_1.default.gray('Starting worker loop...'));
        // Start worker
        await (0, worker_js_1.startWorker)({
            projectPath: program.opts().project,
            agentId: result.agentId,
            sessionKey: result.sessionKey,
            manifest: result.manifest
        });
    }
    catch (error) {
        console.error(chalk_1.default.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
program
    .command('release-slot')
    .description('Release a claimed slot')
    .argument('<slot>', 'Slot ID to release')
    .action(async (slot) => {
    try {
        await (0, release_slot_js_1.releaseSlot)({
            projectPath: program.opts().project,
            slotId: slot
        });
        console.log(chalk_1.default.green('✓'), `Released slot ${chalk_1.default.cyan(slot)}`);
    }
    catch (error) {
        console.error(chalk_1.default.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
program.parse();
//# sourceMappingURL=acp-agent.js.map