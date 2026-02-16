/**
 * Codex (Kimi Code) Provider Adapter
 * Integrates with GitHub Copilot/Codex CLI
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { AgentProvider, RoleManifest, Task } from '../types/index.js';

export interface CodexConfig {
  model?: string;
  workingDir?: string;
  acceptAll?: boolean;
}

export class CodexProvider {
  private config: CodexConfig;
  
  constructor(config: CodexConfig = {}) {
    this.config = {
      model: config.model || 'gpt-4o',
      workingDir: config.workingDir || process.cwd(),
      acceptAll: config.acceptAll ?? false
    };
  }

  getProviderInfo(): AgentProvider {
    return 'codex';
  }

  /**
   * Execute a task using Codex CLI
   */
  async executeTask(task: Task, manifest: RoleManifest): Promise<{
    success: boolean;
    output: string;
    filesChanged: string[];
  }> {
    const prompt = this.buildPrompt(task, manifest);
    
    try {
      // Check if codex CLI is available
      const result = await this.runCodex(prompt);
      
      return {
        success: true,
        output: result,
        filesChanged: await this.detectFileChanges()
      };
    } catch (error) {
      return {
        success: false,
        output: `Error: ${error}`,
        filesChanged: []
      };
    }
  }

  /**
   * Review code using Codex
   */
  async reviewCode(code: string, context?: string): Promise<{
    approved: boolean;
    comments: string[];
    suggestions: string[];
  }> {
    const prompt = `Review this code${context ? ` for ${context}` : ''}:

\`\`\`
${code}
\`\`\`

Provide:
1. Approval status (approve/request changes)
2. Comments on issues found
3. Specific suggestions for improvement`;

    const result = await this.runCodex(prompt);
    
    // Parse the review result
    return this.parseReviewResult(result);
  }

  /**
   * Generate code using Codex
   */
  async generateCode(specification: string, outputPath: string): Promise<{
    success: boolean;
    filePath: string;
    content: string;
  }> {
    const prompt = `Generate code based on this specification:

${specification}

Output the complete code file.`;

    const result = await this.runCodex(prompt);
    
    // Write the generated code to file
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, result);
    
    return {
      success: true,
      filePath: outputPath,
      content: result
    };
  }

  /**
   * Run Codex CLI with a prompt
   */
  private runCodex(prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = [prompt];
      
      if (this.config.acceptAll) {
        args.push('--accept-all');
      }
      
      if (this.config.model) {
        args.push('--model', this.config.model);
      }

      const codex = spawn('codex', args, {
        cwd: this.config.workingDir,
        env: {
          ...process.env,
          // Ensure GitHub token is available for Codex
          GITHUB_TOKEN: process.env.GITHUB_TOKEN || process.env.ACP_GITHUB_TOKEN
        }
      });

      let output = '';
      let error = '';

      codex.stdout.on('data', (data) => {
        output += data.toString();
      });

      codex.stderr.on('data', (data) => {
        error += data.toString();
      });

      codex.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Codex exited with code ${code}: ${error}`));
        }
      });

      codex.on('error', (err) => {
        if (err.message.includes('ENOENT')) {
          reject(new Error('Codex CLI not found. Install with: npm install -g @anthropic-ai/codex'));
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * Build a prompt for task execution
   */
  private buildPrompt(task: Task, manifest: RoleManifest): string {
    return `You are ${manifest.agent.id}, a ${manifest.role.title}.

TASK: ${task.title}
${task.description ? `\nDescription: ${task.description}` : ''}

Your responsibilities:
${manifest.role.responsibilities.map(r => `- ${r}`).join('\n')}

Project context:
- Project: ${manifest.team.project}
- Sprint: ${manifest.team.sprint}
- Reports to: ${manifest.team.reportsTo}

Complete this task by:
1. Understanding the requirements
2. Implementing the solution
3. Writing tests if needed
4. Following project conventions

Start working on the task.`;
  }

  /**
   * Parse review result from Codex output
   */
  private parseReviewResult(output: string): {
    approved: boolean;
    comments: string[];
    suggestions: string[];
  } {
    const approved = output.toLowerCase().includes('approve') && 
                    !output.toLowerCase().includes('request changes');
    
    const comments: string[] = [];
    const suggestions: string[] = [];
    
    // Simple parsing - could be improved with structured output
    const lines = output.split('\n');
    let currentSection: 'comments' | 'suggestions' | null = null;
    
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('comment') || lower.includes('issue')) {
        currentSection = 'comments';
      } else if (lower.includes('suggestion') || lower.includes('improvement')) {
        currentSection = 'suggestions';
      } else if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
        if (currentSection === 'comments') {
          comments.push(line.trim().replace(/^[-*]\s*/, ''));
        } else if (currentSection === 'suggestions') {
          suggestions.push(line.trim().replace(/^[-*]\s*/, ''));
        }
      }
    }
    
    return { approved, comments, suggestions };
  }

  /**
   * Detect which files were changed by Codex
   */
  private async detectFileChanges(): Promise<string[]> {
    // This would integrate with git to detect changes
    // For now, return empty array
    return [];
  }

  /**
   * Check if Codex CLI is installed
   */
  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const check = spawn('codex', ['--version']);
      check.on('close', (code) => resolve(code === 0));
      check.on('error', () => resolve(false));
    });
  }
}

/**
 * Factory function to create Codex provider
 */
export function createCodexProvider(config?: CodexConfig): CodexProvider {
  return new CodexProvider(config);
}
