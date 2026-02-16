"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusCommand = statusCommand;
const chalk_1 = __importDefault(require("chalk"));
const project_js_1 = require("../../core/project.js");
async function statusCommand() {
    try {
        const project = await (0, project_js_1.loadProject)(process.cwd());
        const slots = await (0, project_js_1.loadSlots)(project.path);
        const agents = await (0, project_js_1.loadAgents)(project.path);
        const tasks = await (0, project_js_1.loadTasks)(project.path);
        console.log(chalk_1.default.bold('\n🦞 ACP Status\n'));
        console.log(chalk_1.default.gray(`Project: ${project.name}`));
        console.log(chalk_1.default.gray(`Path: ${project.path}`));
        console.log();
        // Summary
        const claimedSlots = slots.filter(s => s.status === 'claimed').length;
        const activeAgents = agents.filter(a => a.status === 'active' || a.status === 'busy').length;
        const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
        const blockedTasks = tasks.filter(t => t.status === 'blocked').length;
        console.log(chalk_1.default.bold('Summary'));
        console.log(`  Slots: ${chalk_1.default.cyan(claimedSlots)}/${slots.length} claimed`);
        console.log(`  Agents: ${chalk_1.default.cyan(activeAgents)}/${agents.length} active`);
        console.log(`  Tasks: ${chalk_1.default.cyan(inProgressTasks)} in progress, ${chalk_1.default.red(blockedTasks)} blocked`);
        console.log();
        // Active agents
        if (agents.length > 0) {
            console.log(chalk_1.default.bold('Active Agents'));
            for (const agent of agents.filter(a => a.status !== 'offline')) {
                const statusIcon = agent.status === 'busy' ? '🔵' : agent.status === 'blocked' ? '🔴' : '🟢';
                const task = agent.currentTask || 'idle';
                console.log(`  ${statusIcon} ${chalk_1.default.cyan(agent.id)} (${agent.role}) - ${task}`);
            }
            console.log();
        }
        // In-progress tasks
        const activeTasks = tasks.filter(t => t.status === 'in-progress' || t.status === 'blocked');
        if (activeTasks.length > 0) {
            console.log(chalk_1.default.bold('Active Tasks'));
            for (const task of activeTasks) {
                const icon = task.status === 'blocked' ? '🔴' : '▶️';
                const assignee = task.assignee || 'unassigned';
                console.log(`  ${icon} ${chalk_1.default.cyan(task.id)}: ${task.title.slice(0, 40)} (${assignee})`);
            }
            console.log();
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
//# sourceMappingURL=status.js.map