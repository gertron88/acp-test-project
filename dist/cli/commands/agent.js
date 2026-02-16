"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentCommands = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const project_js_1 = require("../../core/project.js");
exports.agentCommands = {
    list: new commander_1.Command('list')
        .alias('ls')
        .description('List all agents')
        .option('-a, --all', 'Include offline agents')
        .action(async (_options) => {
        try {
            const project = await (0, project_js_1.loadProject)(process.cwd());
            const agents = await (0, project_js_1.loadAgents)(project.path);
            console.log(chalk_1.default.bold('\n🤖 Agents\n'));
            if (agents.length === 0) {
                console.log(chalk_1.default.gray('No agents found. Spawn one with:'));
                console.log(chalk_1.default.cyan('  acp-agent claim-slot <slot> --provider=openclaw'));
                return;
            }
            // Header
            console.log(chalk_1.default.gray(`${'ID'.padEnd(16)} ${'ROLE'.padEnd(18)} ${'STATUS'.padEnd(12)} TASK`));
            console.log(chalk_1.default.gray('─'.repeat(70)));
            // Rows
            for (const agent of agents) {
                const statusIcon = getStatusIcon(agent.status);
                const task = agent.currentTask || chalk_1.default.gray('-');
                console.log(`${agent.id.padEnd(16)} ` +
                    `${agent.role.padEnd(18)} ` +
                    `${statusIcon} ${agent.status.padEnd(8)} ` +
                    `${task}`);
            }
            console.log();
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error instanceof Error ? error.message : error);
            process.exit(1);
        }
    }),
    spawn: new commander_1.Command('spawn')
        .description('Spawn an agent (manual slot claim)')
        .argument('<slot>', 'Slot ID to claim')
        .requiredOption('-p, --provider <provider>', 'Provider (openclaw, claude, codex)')
        .option('-m, --model <model>', 'Model to use')
        .action(async (slot, options) => {
        console.log(chalk_1.default.yellow('Use acp-agent claim-slot instead:'));
        console.log(chalk_1.default.cyan(`  acp-agent claim-slot ${slot} --provider=${options.provider}`));
    }),
    kill: new commander_1.Command('kill')
        .description('Kill an agent session')
        .argument('<agent>', 'Agent ID')
        .option('-f, --force', 'Force kill without graceful shutdown')
        .action(async (_agent, _options) => {
        console.log(chalk_1.default.yellow('Not implemented yet'));
    }),
    status: new commander_1.Command('status')
        .description('Show agent status')
        .argument('<agent>', 'Agent ID')
        .action(async (_agent) => {
        console.log(chalk_1.default.yellow('Not implemented yet'));
    })
};
function getStatusIcon(status) {
    switch (status) {
        case 'idle': return chalk_1.default.gray('⚪');
        case 'active': return chalk_1.default.green('🟢');
        case 'busy': return chalk_1.default.blue('🔵');
        case 'blocked': return chalk_1.default.red('🔴');
        case 'offline': return chalk_1.default.gray('⚫');
        case 'error': return chalk_1.default.red('❌');
        default: return chalk_1.default.gray('?');
    }
}
//# sourceMappingURL=agent.js.map