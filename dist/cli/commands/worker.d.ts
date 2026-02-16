import { RoleManifest } from '../../types/index.js';
interface WorkerOptions {
    projectPath: string;
    agentId: string;
    sessionKey: string;
    manifest: RoleManifest;
}
export declare function startWorker(options: WorkerOptions): Promise<void>;
export {};
//# sourceMappingURL=worker.d.ts.map