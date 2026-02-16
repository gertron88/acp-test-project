import { Command } from 'commander';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';

export const codexCommands = {
  /**
   * Use Codex to generate code for ACP
   */
  generate: new Command('generate')
    .alias('gen')
    .description('Use Kimi Code (Codex) to generate code')
    .argument('<prompt>', 'What to generate (e.g., "Create a webhook handler")')
    .option('-o, --output <file>', 'Output file path')
    .option('--accept-all', 'Accept all changes without review', false)
    .action(async (prompt, options) => {
      try {
        console.log(chalk.blue('🤖'), 'Using Kimi Code (Codex)...\n');
        console.log(chalk.gray('Prompt:'), prompt);
        
        if (options.output) {
          console.log(chalk.gray('Output:'), options.output);
        }
        
        console.log();
        
        // Check if codex is available
        const check = spawn('codex', ['--version']);
        let codexAvailable = false;
        
        await new Promise((resolve) => {
          check.on('close', (code) => {
            codexAvailable = code === 0;
            resolve(null);
          });
          check.on('error', () => resolve(null));
        });
        
        if (!codexAvailable) {
          console.error(chalk.red('✗'), 'Codex CLI not found');
          console.log(chalk.gray('Install with: npm install -g @anthropic-ai/codex'));
          console.log(chalk.gray('Or use GitHub Copilot Chat in your editor'));
          process.exit(1);
        }
        
        // Build the full prompt
        const fullPrompt = options.output 
          ? `${prompt}\n\nSave the output to: ${options.output}`
          : prompt;
        
        // Run codex
        const args = [fullPrompt];
        if (options.acceptAll) args.push('--accept-all');
        
        const codex = spawn('codex', args, {
          stdio: 'inherit',
          env: process.env
        });
        
        await new Promise((resolve, reject) => {
          codex.on('close', (code) => {
            if (code === 0) {
              console.log(chalk.green('\n✓'), 'Generation complete');
              resolve(null);
            } else {
              reject(new Error(`Codex exited with code ${code}`));
            }
          });
        });
        
      } catch (error: any) {
        console.error(chalk.red('✗'), 'Error:', error.message);
        process.exit(1);
      }
    }),

  /**
   * Use Codex to review code
   */
  review: new Command('review')
    .description('Use Kimi Code (Codex) to review code')
    .argument('<file>', 'File to review')
    .option('-c, --context <context>', 'Review context (e.g., "security", "performance")')
    .action(async (file, options) => {
      try {
        const content = await fs.readFile(file, 'utf-8');
        
        console.log(chalk.blue('👁️'), `Reviewing ${chalk.cyan(file)} with Kimi Code...\n`);
        
        const context = options.context ? ` for ${options.context}` : '';
        const prompt = `Review this code${context}:

File: ${file}

\`\`\`
${content}
\`\`\`

Provide:
1. Overall assessment (approve/request changes)
2. Issues found (if any)
3. Specific suggestions for improvement`;

        const codex = spawn('codex', [prompt], {
          stdio: 'inherit',
          env: process.env
        });
        
        await new Promise((resolve, reject) => {
          codex.on('close', (code) => {
            if (code === 0) {
              resolve(null);
            } else {
              reject(new Error(`Codex exited with code ${code}`));
            }
          });
        });
        
      } catch (error: any) {
        console.error(chalk.red('✗'), 'Error:', error.message);
        process.exit(1);
      }
    }),

  /**
   * Check Codex availability and credits
   */
  status: new Command('status')
    .description('Check Kimi Code (Codex) status')
    .action(async () => {
      console.log(chalk.blue('🔍'), 'Checking Kimi Code (Codex) status...\n');
      
      // Check if codex is installed
      const check = spawn('codex', ['--version']);
      let codexAvailable = false;
      let version = '';
      
      check.stdout.on('data', (data) => {
        version = data.toString().trim();
      });
      
      await new Promise((resolve) => {
        check.on('close', (code) => {
          codexAvailable = code === 0;
          resolve(null);
        });
        check.on('error', () => resolve(null));
      });
      
      if (codexAvailable) {
        console.log(chalk.green('✓'), `Kimi Code (Codex) installed: ${chalk.cyan(version)}`);
        console.log();
        console.log(chalk.gray('You have 3x credits available for Kimi Code.'));
        console.log(chalk.gray('Use them to accelerate ACP development:'));
        console.log(chalk.cyan('  acp codex generate "Create a webhook handler"'));
        console.log(chalk.cyan('  acp codex review src/core/github.ts --context=security'));
      } else {
        console.log(chalk.red('✗'), 'Kimi Code (Codex) not found');
        console.log();
        console.log(chalk.gray('To use Kimi Code:'));
        console.log(chalk.gray('1. Install Codex CLI: npm install -g @anthropic-ai/codex'));
        console.log(chalk.gray('2. Or use GitHub Copilot Chat in VS Code/Cursor'));
        console.log(chalk.gray('3. Your 3x credits apply to both'));
      }
    })
};
