"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskCommands = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const project_js_1 = require("../../core/project.js");
exports.taskCommands = {
    list: new commander_1.Command('list')
        .alias('ls')
        .description('List all tasks')
        .option('-s, --status <status>', 'Filter by status')
        .option('-a, --assigned <agent>', 'Filter by assignee')
        .action(async (options) => {
        try {
            const project = await (0, project_js_1.loadProject)(process.cwd());
            let tasks = await (0, project_js_1.loadTasks)(project.path);
            // Apply filters
            if (options.status) {
                tasks = tasks.filter(t => t.status === options.status);
            }
            if (options.assigned) {
                tasks = tasks.filter(t => t.assignee === options.assigned);
            }
            console.log(chalk_1.default.bold('\n📋 Tasks\n'));
            if (tasks.length === 0) {
                console.log(chalk_1.default.gray('No tasks found. Create one with:'));
                console.log(chalk_1.default.cyan('  acp task create --title="Fix bug"'));
                return;
            }
            // Header
            console.log(chalk_1.default.gray(`${'ID'.padEnd(10)} ${'STATUS'.padEnd(12)} ${'PRI'.padEnd(6)} ${'ASSIGNED'.padEnd(12)} TITLE`));
            console.log(chalk_1.default.gray('─'.repeat(80)));
            // Rows
            for (const task of tasks) {
                const statusIcon = getStatusIcon(task.status);
                const priorityIcon = getPriorityIcon(task.priority);
                const assignee = task.assignee || chalk_1.default.gray('unassigned');
                console.log(`${task.id.padEnd(10)} ` +
                    `${statusIcon} ${task.status.padEnd(8)} ` +
                    `${priorityIcon} ${task.priority.padEnd(4)} ` +
                    `${assignee.padEnd(12)} ` +
                    `${task.title.slice(0, 30)}`);
            }
            console.log();
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error instanceof Error ? error.message : error);
            process.exit(1);
        }
    }),
    create: new commander_1.Command('create')
        .description('Create a new task')
        .requiredOption('-t, --title <title>', 'Task title')
        .option('-d, --description <desc>', 'Task description')
        .option('--priority <priority>', 'Priority (critical, high, normal, low)', 'normal')
        .option('--assign <agent>', 'Assign to agent')
        .option('--depends <tasks>', 'Dependencies (comma-separated task IDs)')
        .action(async (options) => {
        try {
            const project = await (0, project_js_1.loadProject)(process.cwd());
            const task = {
                id: generateTaskId(),
                title: options.title,
                description: options.description,
                status: options.assign ? 'todo' : 'backlog',
                priority: options.priority,
                assignee: options.assign,
                reporter: 'cli-user',
                dependencies: options.depends ? options.depends.split(',').map((t) => t.trim()) : [],
                dependents: [],
                project: project.id,
                createdAt: new Date(),
                progress: 0,
                checkpoints: []
            };
            await (0, project_js_1.saveTask)(project.path, task);
            console.log(chalk_1.default.green('✓'), `Created task ${chalk_1.default.cyan(task.id)}`);
            console.log(chalk_1.default.gray(`  Title: ${task.title}`));
            console.log(chalk_1.default.gray(`  Priority: ${task.priority}`));
            if (task.assignee) {
                console.log(chalk_1.default.gray(`  Assigned to: ${task.assignee}`));
            }
            if (task.assignee) {
                console.log();
                console.log(chalk_1.default.gray(`Agent ${task.assignee} will be notified.`));
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error instanceof Error ? error.message : error);
            process.exit(1);
        }
    }),
    assign: new commander_1.Command('assign')
        .description('Assign a task to an agent')
        .argument('<task>', 'Task ID')
        .argument('<agent>', 'Agent ID')
        .action(async (_taskId, _agentId) => {
        console.log(chalk_1.default.yellow('Not implemented yet'));
    }),
    show: new commander_1.Command('show')
        .description('Show task details')
        .argument('<task>', 'Task ID')
        .action(async (_taskId) => {
        console.log(chalk_1.default.yellow('Not implemented yet'));
    })
};
function generateTaskId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    return `TASK-${timestamp.slice(-4)}`;
}
function getStatusIcon(status) {
    switch (status) {
        case 'backlog': return chalk_1.default.gray('📦');
        case 'todo': return chalk_1.default.white('📋');
        case 'in-progress': return chalk_1.default.blue('▶️');
        case 'review': return chalk_1.default.yellow('👁️');
        case 'testing': return chalk_1.default.magenta('🧪');
        case 'done': return chalk_1.default.green('✅');
        case 'blocked': return chalk_1.default.red('🚫');
        case 'cancelled': return chalk_1.default.gray('❌');
        default: return chalk_1.default.gray('?');
    }
}
function getPriorityIcon(priority) {
    switch (priority) {
        case 'critical': return chalk_1.default.red('🔴');
        case 'high': return chalk_1.default.yellow('🟡');
        case 'normal': return chalk_1.default.white('⚪');
        case 'low': return chalk_1.default.gray('🔵');
        default: return chalk_1.default.gray('?');
    }
}
//# sourceMappingURL=task.js.map