"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWorker = startWorker;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
async function startWorker(options) {
    const { projectPath, agentId, manifest } = options;
    console.log(chalk_1.default.blue('🔄'), 'Worker started');
    console.log(chalk_1.default.gray(`  Inbox: ${manifest.communication.inbox}`));
    console.log(chalk_1.default.gray(`  Outbox: ${manifest.communication.outbox}`));
    // Ensure inbox exists
    await fs_1.promises.mkdir(manifest.communication.inbox, { recursive: true });
    // Worker loop
    let running = true;
    process.on('SIGINT', () => {
        console.log(chalk_1.default.yellow('\n⚠️'), 'Shutting down worker...');
        running = false;
    });
    process.on('SIGTERM', () => {
        running = false;
    });
    console.log(chalk_1.default.gray('  Waiting for messages... (Ctrl+C to stop)'));
    while (running) {
        try {
            // Check for messages
            const messages = await checkInbox(manifest.communication.inbox);
            for (const message of messages) {
                console.log(chalk_1.default.cyan('📨'), `Received ${message.type} from ${message.from}`);
                // Process message
                await processMessage(message, options);
                // Mark as read (move to .read/)
                await fs_1.promises.rename(path_1.default.join(manifest.communication.inbox, `${message.id}.json`), path_1.default.join(manifest.communication.inbox, '.read', `${message.id}.json`));
            }
            // Heartbeat
            await updateHeartbeat(projectPath, agentId);
        }
        catch (error) {
            console.error(chalk_1.default.red('Worker error:'), error);
        }
        // Sleep 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    console.log(chalk_1.default.green('✓'), 'Worker stopped');
}
async function checkInbox(inboxPath) {
    const messages = [];
    try {
        const files = await fs_1.promises.readdir(inboxPath);
        for (const file of files) {
            if (file.endsWith('.json') && !file.startsWith('.')) {
                const content = await fs_1.promises.readFile(path_1.default.join(inboxPath, file), 'utf-8');
                const message = JSON.parse(content);
                messages.push({
                    ...message,
                    timestamp: new Date(message.timestamp)
                });
            }
        }
    }
    catch (error) {
        // Inbox might not exist yet
    }
    // Sort by timestamp
    return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}
async function processMessage(message, _options) {
    // const agentId = _options.agentId;
    // const manifest = _options.manifest;
    switch (message.type) {
        case 'TASK_ASSIGN':
            console.log(chalk_1.default.green('📋'), `New task assigned: ${message.task}`);
            // TODO: Spawn LLM session to work on task
            break;
        case 'SYNC':
            console.log(chalk_1.default.gray('🔄'), 'Sync request received');
            break;
        default:
            console.log(chalk_1.default.gray('❓'), `Unknown message type: ${message.type}`);
    }
}
async function updateHeartbeat(projectPath, agentId) {
    const agentPath = path_1.default.join(projectPath, '.acp', 'agents', `${agentId}.json`);
    try {
        const content = await fs_1.promises.readFile(agentPath, 'utf-8');
        const agent = JSON.parse(content);
        agent.lastActive = new Date().toISOString();
        await fs_1.promises.writeFile(agentPath, JSON.stringify(agent, null, 2));
    }
    catch (error) {
        // Agent file might not exist
    }
}
//# sourceMappingURL=worker.js.map