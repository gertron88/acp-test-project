/**
 * Core project management - file system operations
 */

import { promises as fs } from 'fs';
import path from 'path';
import YAML from 'yaml';
import { Project, Slot, Agent, Task } from '../types/index.js';

const ACP_DIR = '.acp';

export async function initProject(projectPath: string): Promise<Project> {
  const acpPath = path.join(projectPath, ACP_DIR);
  
  // Create directory structure
  await fs.mkdir(acpPath, { recursive: true });
  await fs.mkdir(path.join(acpPath, 'slots'), { recursive: true });
  await fs.mkdir(path.join(acpPath, 'agents'), { recursive: true });
  await fs.mkdir(path.join(acpPath, 'tasks'), { recursive: true });
  await fs.mkdir(path.join(acpPath, 'messages', 'inbox'), { recursive: true });
  await fs.mkdir(path.join(acpPath, 'messages', 'outbox'), { recursive: true });
  await fs.mkdir(path.join(acpPath, 'messages', 'broadcast'), { recursive: true });
  await fs.mkdir(path.join(acpPath, 'state'), { recursive: true });
  
  // Create project config
  const project: Project = {
    id: path.basename(projectPath),
    name: path.basename(projectPath),
    description: '',
    path: projectPath,
    status: 'active',
    agents: [],
    config: {
      inboxPath: path.join(acpPath, 'messages', 'inbox'),
      outboxPath: path.join(acpPath, 'messages', 'outbox'),
      repository: '',
      defaultBranch: 'main',
      autoAssign: false,
      requireApproval: true
    }
  };
  
  await fs.writeFile(
    path.join(acpPath, 'project.json'),
    JSON.stringify(project, null, 2)
  );
  
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
  
  await fs.writeFile(
    path.join(acpPath, 'slots', 'example-agent.yaml'),
    YAML.stringify(exampleSlot)
  );
  
  return project;
}

export async function loadProject(projectPath: string): Promise<Project> {
  const projectFile = path.join(projectPath, ACP_DIR, 'project.json');
  
  try {
    const data = await fs.readFile(projectFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`No ACP project found in ${projectPath}. Run 'acp init' first.`);
  }
}

export async function loadSlots(projectPath: string): Promise<Slot[]> {
  const slotsPath = path.join(projectPath, ACP_DIR, 'slots');
  const slots: Slot[] = [];
  
  try {
    const files = await fs.readdir(slotsPath);
    
    for (const file of files) {
      if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        const content = await fs.readFile(path.join(slotsPath, file), 'utf-8');
        const parsed = YAML.parse(content);
        
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
  } catch (error) {
    // Directory might not exist yet
  }
  
  return slots;
}

export async function saveSlot(projectPath: string, slot: Slot): Promise<void> {
  const slotsPath = path.join(projectPath, ACP_DIR, 'slots');
  await fs.mkdir(slotsPath, { recursive: true });
  
  const data = { slot };
  await fs.writeFile(
    path.join(slotsPath, `${slot.id}.yaml`),
    YAML.stringify(data)
  );
}

export async function loadAgents(projectPath: string): Promise<Agent[]> {
  const agentsPath = path.join(projectPath, ACP_DIR, 'agents');
  const agents: Agent[] = [];
  
  try {
    const files = await fs.readdir(agentsPath);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(agentsPath, file), 'utf-8');
        const agent = JSON.parse(content);
        agents.push({
          ...agent,
          joinedAt: new Date(agent.joinedAt),
          lastActive: new Date(agent.lastActive)
        });
      }
    }
  } catch (error) {
    // Directory might not exist
  }
  
  return agents;
}

export async function saveAgent(projectPath: string, agent: Agent): Promise<void> {
  const agentsPath = path.join(projectPath, ACP_DIR, 'agents');
  await fs.mkdir(agentsPath, { recursive: true });
  
  await fs.writeFile(
    path.join(agentsPath, `${agent.id}.json`),
    JSON.stringify(agent, null, 2)
  );
}

export async function loadTasks(projectPath: string): Promise<Task[]> {
  const tasksPath = path.join(projectPath, ACP_DIR, 'tasks');
  const tasks: Task[] = [];
  
  try {
    const files = await fs.readdir(tasksPath);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(tasksPath, file), 'utf-8');
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
  } catch (error) {
    // Directory might not exist
  }
  
  return tasks;
}

export async function saveTask(projectPath: string, task: Task): Promise<void> {
  const tasksPath = path.join(projectPath, ACP_DIR, 'tasks');
  await fs.mkdir(tasksPath, { recursive: true });
  
  await fs.writeFile(
    path.join(tasksPath, `${task.id}.json`),
    JSON.stringify(task, null, 2)
  );
}
