"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimSlot = claimSlot;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const yaml_1 = __importDefault(require("yaml"));
const project_js_1 = require("../../core/project.js");
async function claimSlot(options) {
    const { projectPath, slotId, provider, model, name } = options;
    // Load project and slots
    const project = await (0, project_js_1.loadProject)(projectPath);
    const slots = await (0, project_js_1.loadSlots)(projectPath);
    const slot = slots.find(s => s.id === slotId);
    if (!slot) {
        throw new Error(`Slot ${slotId} not found`);
    }
    if (slot.status === 'claimed' && slot.currentClaims.length >= slot.maxConcurrent) {
        throw new Error(`Slot ${slotId} is already claimed by ${slot.currentClaims.length} agent(s)`);
    }
    if (!slot.approvedProviders.includes(provider)) {
        throw new Error(`Provider ${provider} not approved for this slot. Allowed: ${slot.approvedProviders.join(', ')}`);
    }
    // Generate session key
    const sessionKey = `main-${slotId}-${Date.now().toString(36)}`;
    const agentId = name;
    // Select model
    const selectedModel = model || slot.approvedModels[0];
    if (!slot.approvedModels.includes(selectedModel)) {
        throw new Error(`Model ${selectedModel} not approved for this slot`);
    }
    // Create agent
    const agent = {
        id: agentId,
        name: name,
        slotId: slotId,
        role: slot.role,
        provider: provider,
        model: selectedModel,
        status: 'idle',
        sessionKey: sessionKey,
        capabilities: [], // Would be loaded from role definition
        joinedAt: new Date(),
        lastActive: new Date(),
        metrics: {
            tasksCompleted: 0,
            tasksAssigned: 0,
            avgResponseTime: '0s',
            uptime: '0%'
        }
    };
    await (0, project_js_1.saveAgent)(projectPath, agent);
    // Update slot
    const claim = {
        sessionKey,
        provider: provider,
        model: selectedModel,
        claimedAt: new Date(),
        tasksCompleted: 0,
        uptime: '0%'
    };
    slot.currentClaims.push(claim);
    slot.status = 'claimed';
    // Save updated slot
    const slotsPath = path_1.default.join(projectPath, '.acp', 'slots');
    const slotData = {
        slot: {
            ...slot,
            currentClaims: slot.currentClaims.map(c => ({
                ...c,
                claimedAt: c.claimedAt.toISOString()
            })),
            claimHistory: slot.claimHistory.map(c => ({
                ...c,
                claimedAt: c.claimedAt.toISOString(),
                releasedAt: c.releasedAt?.toISOString()
            }))
        }
    };
    await fs_1.promises.writeFile(path_1.default.join(slotsPath, `${slot.id}.yaml`), yaml_1.default.stringify(slotData));
    // Build role manifest
    const manifest = {
        manifestVersion: '1.0',
        agent: {
            id: agentId,
            slotId: slotId,
            sessionKey: sessionKey
        },
        role: {
            id: slot.role,
            title: slot.role.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            responsibilities: ['Execute assigned tasks', 'Communicate status', 'Request help when blocked'],
            permissions: ['submit_code', 'escalate'],
            escalationPath: ['team-lead']
        },
        team: {
            project: project.id,
            sprint: project.currentSprint?.id || 'none',
            reportsTo: 'team-lead', // Would be loaded from role definition
            teammates: slots.filter(s => s.status === 'claimed').map(s => s.id)
        },
        communication: {
            inbox: path_1.default.join(project.config.inboxPath, agentId),
            outbox: project.config.outboxPath,
            broadcast: path_1.default.join(projectPath, '.acp', 'messages', 'broadcast')
        },
        context: {
            loadFiles: [
                path_1.default.join(projectPath, 'README.md'),
                path_1.default.join(projectPath, '.acp', 'agents', agentId, 'context.md')
            ]
        },
        constraints: {
            maxTaskDuration: '4h',
            requiresReview: true,
            canDeployTo: ['dev']
        }
    };
    // Save manifest for agent
    await fs_1.promises.mkdir(path_1.default.join(projectPath, '.acp', 'agents', agentId), { recursive: true });
    await fs_1.promises.writeFile(path_1.default.join(projectPath, '.acp', 'agents', agentId, 'manifest.json'), JSON.stringify(manifest, null, 2));
    return {
        agentId,
        sessionKey,
        manifest
    };
}
//# sourceMappingURL=claim-slot.js.map