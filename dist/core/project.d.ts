/**
 * Core project management - file system operations
 */
import { Project, Slot, Agent, Task } from '../types/index.js';
export declare function initProject(projectPath: string): Promise<Project>;
export declare function loadProject(projectPath: string): Promise<Project>;
export declare function loadSlots(projectPath: string): Promise<Slot[]>;
export declare function saveSlot(projectPath: string, slot: Slot): Promise<void>;
export declare function loadAgents(projectPath: string): Promise<Agent[]>;
export declare function saveAgent(projectPath: string, agent: Agent): Promise<void>;
export declare function loadTasks(projectPath: string): Promise<Task[]>;
export declare function saveTask(projectPath: string, task: Task): Promise<void>;
//# sourceMappingURL=project.d.ts.map