/**
 * ACP Core Types
 * Agent Coordination Protocol type definitions
 */

// ============================================================================
// AGENT TYPES
// ============================================================================

export type AgentStatus = 'idle' | 'active' | 'busy' | 'blocked' | 'offline' | 'error';

export type AgentProvider = 'openclaw' | 'claude' | 'codex' | 'openai' | 'custom';

export interface Agent {
  id: string;
  name: string;
  slotId: string;
  role: string;
  provider: AgentProvider;
  model: string;
  status: AgentStatus;
  currentTask?: string;
  sessionKey?: string;
  capabilities: string[];
  joinedAt: Date;
  lastActive: Date;
  metrics: AgentMetrics;
}

export interface AgentMetrics {
  tasksCompleted: number;
  tasksAssigned: number;
  avgResponseTime: string;
  uptime: string;
}

// ============================================================================
// SLOT TYPES
// ============================================================================

export type SlotStatus = 'available' | 'claimed' | 'suspended' | 'expired';

export interface Slot {
  id: string;
  name: string;
  role: string;
  status: SlotStatus;
  
  // Constraints (human-defined)
  approvedProviders: AgentProvider[];
  approvedModels: string[];
  maxConcurrent: number;
  minAgents?: number;
  
  // Lifecycle
  expiresAt?: Date;
  autoRenew?: boolean;
  
  // Approval
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  
  // Runtime state
  currentClaims: SlotClaim[];
  claimHistory: SlotClaim[];
}

export interface SlotClaim {
  sessionKey: string;
  provider: AgentProvider;
  model: string;
  claimedAt: Date;
  releasedAt?: Date;
  tasksCompleted: number;
  uptime: string;
}

// ============================================================================
// ROLE TYPES
// ============================================================================

export interface Role {
  id: string;
  title: string;
  description: string;
  responsibilities: string[];
  permissions: Permission[];
  escalationPath: string[];
  reportsTo: string[];
  canHaveDirectReports: boolean;
  maxDirectReports?: number;
}

export type Permission = 
  | 'assign_tasks'
  | 'approve_changes'
  | 'submit_code'
  | 'review_code'
  | 'deploy_to_dev'
  | 'deploy_to_staging'
  | 'deploy_to_prod'
  | 'escalate'
  | 'override_decisions'
  | 'manage_agents'
  | 'view_all_tasks';

// ============================================================================
// TASK TYPES
// ============================================================================

export type TaskStatus = 
  | 'backlog'
  | 'todo'
  | 'in-progress'
  | 'review'
  | 'testing'
  | 'done'
  | 'blocked'
  | 'cancelled';

export type TaskPriority = 'critical' | 'high' | 'normal' | 'low';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  reporter: string;
  
  // Dependencies
  dependencies: string[];
  dependents: string[];
  
  // Estimation
  estimatedHours?: number;
  actualHours?: number;
  
  // Timeline
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  dueDate?: Date;
  
  // Context
  project: string;
  sprint?: string;
  epic?: string;
  
  // Links
  pullRequest?: string;
  branch?: string;
  
  // Progress
  progress: number; // 0-100
  checkpoints: Checkpoint[];
}

export interface Checkpoint {
  id: string;
  description: string;
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export type MessageType =
  | 'TASK_ASSIGN'
  | 'TASK_COMPLETE'
  | 'TASK_BLOCKED'
  | 'REVIEW_REQUEST'
  | 'REVIEW_COMPLETE'
  | 'DEPENDENCY_MET'
  | 'DEPENDENCY_NEEDED'
  | 'CHANGE_PROPOSAL'
  | 'CHANGE_APPROVED'
  | 'CHANGE_REJECTED'
  | 'QUERY'
  | 'RESPONSE'
  | 'DECISION_REQUEST'
  | 'DECISION_MADE'
  | 'SYNC'
  | 'HANDOFF'
  | 'HEARTBEAT';

export interface Message {
  id: string;
  timestamp: Date;
  from: string;
  to: string;
  cc?: string[];
  type: MessageType;
  project: string;
  task?: string;
  priority: TaskPriority;
  payload: unknown;
  requiresAck: boolean;
  deadline?: Date;
  threadId?: string;
  inReplyTo?: string;
}

// ============================================================================
// PROJECT TYPES
// ============================================================================

export interface Project {
  id: string;
  name: string;
  description: string;
  path: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  
  // Current state
  currentSprint?: Sprint;
  agents: string[];
  
  // Configuration
  config: ProjectConfig;
}

export interface ProjectConfig {
  // Communication
  inboxPath: string;
  outboxPath: string;
  
  // Git
  repository: string;
  defaultBranch: string;
  
  // Coordination
  coordinatorUrl?: string;
  autoAssign: boolean;
  requireApproval: boolean;
}

export interface Sprint {
  id: string;
  number: number;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'planning' | 'active' | 'completed';
  goals: string[];
}

// ============================================================================
// ROLE MANIFEST (Given to agent on claim)
// ============================================================================

export interface RoleManifest {
  manifestVersion: string;
  agent: {
    id: string;
    slotId: string;
    sessionKey: string;
  };
  role: {
    id: string;
    title: string;
    responsibilities: string[];
    permissions: Permission[];
    escalationPath: string[];
  };
  team: {
    project: string;
    sprint: string;
    reportsTo: string;
    teammates: string[];
  };
  communication: {
    inbox: string;
    outbox: string;
    broadcast: string;
  };
  context: {
    loadFiles: string[];
  };
  constraints: {
    maxTaskDuration: string;
    requiresReview: boolean;
    canDeployTo: string[];
  };
}

// ============================================================================
// COORDINATOR TYPES
// ============================================================================

export interface CoordinatorState {
  version: string;
  startedAt: Date;
  projects: Record<string, Project>;
  agents: Record<string, Agent>;
  slots: Record<string, Slot>;
  tasks: Record<string, Task>;
}

export interface CoordinatorConfig {
  port: number;
  host: string;
  dataDir: string;
  github?: {
    token: string;
    webhookSecret: string;
  };
  providers: Record<AgentProvider, ProviderConfig>;
}

export interface ProviderConfig {
  enabled: boolean;
  apiKey?: string;
  endpoint?: string;
  defaultModel?: string;
}
