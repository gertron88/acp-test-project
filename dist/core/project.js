"use strict";
/**
 * Core project management - file system operations
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initProject = initProject;
exports.loadProject = loadProject;
exports.loadSlots = loadSlots;
exports.saveSlot = saveSlot;
exports.loadAgents = loadAgents;
exports.saveAgent = saveAgent;
exports.loadTasks = loadTasks;
exports.saveTask = saveTask;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const yaml_1 = __importDefault(require("yaml"));
const ACP_DIR = '.acp';
async function initProject(projectPath) {
    const acpPath = path_1.default.join(projectPath, ACP_DIR);
    // Create directory structure
    await fs_1.promises.mkdir(acpPath, { recursive: true });
    await fs_1.promises.mkdir(path_1.default.join(acpPath, 'slots'), { recursive: true });
    await fs_1.promises.mkdir(path_1.default.join(acpPath, 'agents'), { recursive: true });
    await fs_1.promises.mkdir(path_1.default.join(acpPath, 'tasks'), { recursive: true });
    await fs_1.promises.mkdir(path_1.default.join(acpPath, 'messages', 'inbox'), { recursive: true });
    await fs_1.promises.mkdir(path_1.default.join(acpPath, 'messages', 'outbox'), { recursive: true });
    await fs_1.promises.mkdir(path_1.default.join(acpPath, 'messages', 'broadcast'), { recursive: true });
    await fs_1.promises.mkdir(path_1.default.join(acpPath, 'state'), { recursive: true });
    // Create project config
    const project = {
        id: path_1.default.basename(projectPath),
        name: path_1.default.basename(projectPath),
        description: '',
        path: projectPath,
        status: 'active',
        agents: [],
        config: {
            inboxPath: path_1.default.join(acpPath, 'messages', 'inbox'),
            outboxPath: path_1.default.join(acpPath, 'messages', 'outbox'),
            repository: '',
            defaultBranch: 'main',
            autoAssign: false,
            requireApproval: true
        }
    };
    await fs_1.promises.writeFile(path_1.default.join(acpPath, 'project.json'), JSON.stringify(project, null, 2));
    // Create example slot
    const exampleSlot = {
        slot: {
            id: 'example-agent',
            name: 'Example Agent',
            role: 'backend-developer',
            approvedProviders: ['openclaw'],
            approvedModels: ['kimi-coding/k2p5'],
            maxConcurrent: 1,
            approved: false // Must be approved by human
        }
    };
    await fs_1.promises.writeFile(path_1.default.join(acpPath, 'slots', 'example-agent.yaml'), yaml_1.default.stringify(exampleSlot));
    return project;
}
async function loadProject(projectPath) {
    const projectFile = path_1.default.join(projectPath, ACP_DIR, 'project.json');
    try {
        const data = await fs_1.promises.readFile(projectFile, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        throw new Error(`No ACP project found in ${projectPath}. Run 'acp init' first.`);
    }
}
async function loadSlots(projectPath) {
    const slotsPath = path_1.default.join(projectPath, ACP_DIR, 'slots');
    const slots = [];
    try {
        const files = await fs_1.promises.readdir(slotsPath);
        for (const file of files) {
            if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                const content = await fs_1.promises.readFile(path_1.default.join(slotsPath, file), 'utf-8');
                const parsed = yaml_1.default.parse(content);
                if (parsed.slot) {
                    slots.push({
                        ...parsed.slot,
                        status: parsed.slot.status || 'available',
                        currentClaims: parsed.slot.currentClaims || [],
                        claimHistory: parsed.slot.claimHistory || []
                    });
                }
            }
        }
    }
    catch (error) {
        // Directory might not exist yet
    }
    return slots;
}
async function saveSlot(projectPath, slot) {
    const slotsPath = path_1.default.join(projectPath, ACP_DIR, 'slots');
    await fs_1.promises.mkdir(slotsPath, { recursive: true });
    const data = { slot };
    await fs_1.promises.writeFile(path_1.default.join(slotsPath, `${slot.id}.yaml`), yaml_1.default.stringify(data));
}
async function loadAgents(projectPath) {
    const agentsPath = path_1.default.join(projectPath, ACP_DIR, 'agents');
    const agents = [];
    try {
        const files = await fs_1.promises.readdir(agentsPath);
        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = await fs_1.promises.readFile(path_1.default.join(agentsPath, file), 'utf-8');
                const agent = JSON.parse(content);
                agents.push({
                    ...agent,
                    joinedAt: new Date(agent.joinedAt),
                    lastActive: new Date(agent.lastActive)
                });
            }
        }
    }
    catch (error) {
        // Directory might not exist
    }
    return agents;
}
async function saveAgent(projectPath, agent) {
    const agentsPath = path_1.default.join(projectPath, ACP_DIR, 'agents');
    await fs_1.promises.mkdir(agentsPath, { recursive: true });
    await fs_1.promises.writeFile(path_1.default.join(agentsPath, `${agent.id}.json`), JSON.stringify(agent, null, 2));
}
async function loadTasks(projectPath) {
    const tasksPath = path_1.default.join(projectPath, ACP_DIR, 'tasks');
    const tasks = [];
    try {
        const files = await fs_1.promises.readdir(tasksPath);
        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = await fs_1.promises.readFile(path_1.default.join(tasksPath, file), 'utf-8');
                const task = JSON.parse(content);
                tasks.push({
                    ...task,
                    createdAt: new Date(task.createdAt),
                    startedAt: task.startedAt ? new Date(task.startedAt) : undefined,
                    completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
                    dueDate: task.dueDate ? new Date(task.dueDate) : undefined
                });
            }
        }
    }
    catch (error) {
        // Directory might not exist
    }
    return tasks;
}
async function saveTask(projectPath, task) {
    const tasksPath = path_1.default.join(projectPath, ACP_DIR, 'tasks');
    await fs_1.promises.mkdir(tasksPath, { recursive: true });
    await fs_1.promises.writeFile(path_1.default.join(tasksPath, `${task.id}.json`), JSON.stringify(task, null, 2));
}
//# sourceMappingURL=project.js.map