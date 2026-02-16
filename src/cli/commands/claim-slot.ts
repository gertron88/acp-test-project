import { promises as fs } from 'fs';
import path from 'path';
import YAML from 'yaml';
import { loadProject, loadSlots, saveAgent } from '../../core/project.js';
import { Agent, AgentStatus, RoleManifest } from '../../types/index.js';

interface ClaimSlotOptions {
  projectPath: string;
  slotId: string;
  provider: string;
  model?: string;
  name: string;
}

interface ClaimSlotResult {
  agentId: string;
  sessionKey: string;
  manifest: RoleManifest;
}

export async function claimSlot(options: ClaimSlotOptions): Promise<ClaimSlotResult> {
  const { projectPath, slotId, provider, model, name } = options;
  
  // Load project and slots
  const project = await loadProject(projectPath);
  const slots = await loadSlots(projectPath);
  const slot = slots.find(s => s.id === slotId);
  
  if (!slot) {
    throw new Error(`Slot ${slotId} not found`);
  }
  
  if (slot.status === 'claimed' && slot.currentClaims.length >= slot.maxConcurrent) {
    throw new Error(`Slot ${slotId} is already claimed by ${slot.currentClaims.length} agent(s)`);
  }
  
  if (!slot.approvedProviders.includes(provider as any)) {
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
  const agent: Agent = {
    id: agentId,
    name: name,
    slotId: slotId,
    role: slot.role,
    provider: provider as any,
    model: selectedModel,
    status: 'idle' as AgentStatus,
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
  
  await saveAgent(projectPath, agent);
  
  // Update slot
  const claim = {
    sessionKey,
    provider: provider as any,
    model: selectedModel,
    claimedAt: new Date(),
    tasksCompleted: 0,
    uptime: '0%'
  };
  
  slot.currentClaims.push(claim);
  slot.status = 'claimed';
  
  // Save updated slot
  const slotsPath = path.join(projectPath, '.acp', 'slots');
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
  await fs.writeFile(
    path.join(slotsPath, `${slot.id}.yaml`),
    YAML.stringify(slotData)
  );
  
  // Build role manifest
  const manifest: RoleManifest = {
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
      permissions: ['submit_code', 'escalate'] as any,
      escalationPath: ['team-lead']
    },
    team: {
      project: project.id,
      sprint: project.currentSprint?.id || 'none',
      reportsTo: 'team-lead', // Would be loaded from role definition
      teammates: slots.filter(s => s.status === 'claimed').map(s => s.id)
    },
    communication: {
      inbox: path.join(project.config.inboxPath, agentId),
      outbox: project.config.outboxPath,
      broadcast: path.join(projectPath, '.acp', 'messages', 'broadcast')
    },
    context: {
      loadFiles: [
        path.join(projectPath, 'README.md'),
        path.join(projectPath, '.acp', 'agents', agentId, 'context.md')
      ]
    },
    constraints: {
      maxTaskDuration: '4h',
      requiresReview: true,
      canDeployTo: ['dev']
    }
  };
  
  // Save manifest for agent
  await fs.mkdir(path.join(projectPath, '.acp', 'agents', agentId), { recursive: true });
  await fs.writeFile(
    path.join(projectPath, '.acp', 'agents', agentId, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  return {
    agentId,
    sessionKey,
    manifest
  };
}
