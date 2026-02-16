"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.slotCommands = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const project_js_1 = require("../../core/project.js");
exports.slotCommands = {
    list: new commander_1.Command('list')
        .alias('ls')
        .description('List all slots')
        .option('-a, --all', 'Include inactive slots')
        .action(async (_options) => {
        try {
            const project = await (0, project_js_1.loadProject)(process.cwd());
            const slots = await (0, project_js_1.loadSlots)(project.path);
            console.log(chalk_1.default.bold('\n🎰 Slots\n'));
            if (slots.length === 0) {
                console.log(chalk_1.default.gray('No slots found. Create one with:'));
                console.log(chalk_1.default.cyan('  acp slot create <name>'));
                return;
            }
            // Header
            console.log(chalk_1.default.gray(`${'ID'.padEnd(16)} ${'ROLE'.padEnd(18)} ${'STATUS'.padEnd(12)} CLAIMED BY`));
            console.log(chalk_1.default.gray('─'.repeat(70)));
            // Rows
            for (const slot of slots) {
                const statusIcon = getStatusIcon(slot.status);
                const claimedBy = slot.currentClaims.length > 0
                    ? `${slot.currentClaims[0].provider}/${slot.currentClaims[0].model}`
                    : chalk_1.default.gray('-');
                console.log(`${slot.id.padEnd(16)} ` +
                    `${slot.role.padEnd(18)} ` +
                    `${statusIcon} ${slot.status.padEnd(8)} ` +
                    `${claimedBy}`);
            }
            console.log();
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error instanceof Error ? error.message : error);
            process.exit(1);
        }
    }),
    create: new commander_1.Command('create')
        .description('Create a new slot')
        .argument('<name>', 'Slot ID (e.g., backend-dev-1)')
        .requiredOption('-r, --role <role>', 'Agent role (e.g., backend-developer)')
        .option('-p, --providers <providers>', 'Approved providers (comma-separated)', 'openclaw')
        .option('-m, --models <models>', 'Approved models (comma-separated)', 'kimi-coding/k2p5')
        .option('--max <n>', 'Max concurrent agents', '1')
        .action(async (name, options) => {
        try {
            const project = await (0, project_js_1.loadProject)(process.cwd());
            const slot = {
                id: name,
                name: name,
                role: options.role,
                status: 'available',
                approvedProviders: options.providers.split(',').map((p) => p.trim()),
                approvedModels: options.models.split(',').map((m) => m.trim()),
                maxConcurrent: parseInt(options.max),
                approved: true,
                approvedBy: 'cli',
                approvedAt: new Date(),
                currentClaims: [],
                claimHistory: []
            };
            await (0, project_js_1.saveSlot)(project.path, slot);
            console.log(chalk_1.default.green('✓'), `Created slot ${chalk_1.default.cyan(name)}`);
            console.log(chalk_1.default.gray(`  Role: ${slot.role}`));
            console.log(chalk_1.default.gray(`  Providers: ${slot.approvedProviders.join(', ')}`));
            console.log(chalk_1.default.gray(`  Models: ${slot.approvedModels.join(', ')}`));
            console.log();
            console.log(chalk_1.default.gray('Next: Commit this slot and an agent can claim it with:'));
            console.log(chalk_1.default.cyan(`  acp-agent claim-slot ${name} --provider=openclaw`));
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error instanceof Error ? error.message : error);
            process.exit(1);
        }
    }),
    show: new commander_1.Command('show')
        .description('Show slot details')
        .argument('<name>', 'Slot ID')
        .action(async (name) => {
        try {
            const project = await (0, project_js_1.loadProject)(process.cwd());
            const slots = await (0, project_js_1.loadSlots)(project.path);
            const slot = slots.find(s => s.id === name);
            if (!slot) {
                console.error(chalk_1.default.red(`Slot ${name} not found`));
                process.exit(1);
            }
            console.log(chalk_1.default.bold(`\n🎰 Slot: ${slot.id}\n`));
            console.log(`  Role: ${chalk_1.default.cyan(slot.role)}`);
            console.log(`  Status: ${getStatusIcon(slot.status)} ${slot.status}`);
            console.log(`  Approved: ${slot.approved ? chalk_1.default.green('Yes') : chalk_1.default.red('No')}`);
            console.log(`  Max Concurrent: ${slot.maxConcurrent}`);
            console.log(`  Providers: ${slot.approvedProviders.join(', ')}`);
            console.log(`  Models: ${slot.approvedModels.join(', ')}`);
            if (slot.currentClaims.length > 0) {
                console.log(chalk_1.default.bold('\n  Current Claims:'));
                for (const claim of slot.currentClaims) {
                    console.log(`    • ${claim.provider}/${claim.model}`);
                    console.log(`      Session: ${claim.sessionKey}`);
                    console.log(`      Claimed: ${claim.claimedAt.toISOString()}`);
                }
            }
            console.log();
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error instanceof Error ? error.message : error);
            process.exit(1);
        }
    }),
    delete: new commander_1.Command('delete')
        .alias('rm')
        .description('Delete a slot')
        .argument('<name>', 'Slot ID')
        .option('-f, --force', 'Force delete even if claimed')
        .action(async (_name, _options) => {
        console.log(chalk_1.default.yellow('Not implemented yet'));
    })
};
function getStatusIcon(status) {
    switch (status) {
        case 'available': return chalk_1.default.green('⚪');
        case 'claimed': return chalk_1.default.green('🟢');
        case 'suspended': return chalk_1.default.yellow('🟡');
        case 'expired': return chalk_1.default.red('🔴');
        default: return chalk_1.default.gray('⚫');
    }
}
//# sourceMappingURL=slot.js.map