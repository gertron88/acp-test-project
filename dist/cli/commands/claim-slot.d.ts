import { RoleManifest } from '../../types/index.js';
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
export declare function claimSlot(options: ClaimSlotOptions): Promise<ClaimSlotResult>;
export {};
//# sourceMappingURL=claim-slot.d.ts.map