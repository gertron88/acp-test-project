import { Command } from 'commander';
import chalk from 'chalk';
import { GitHubClient } from '../../core/github.js';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export const githubCommands = {
  setup: new Command('setup')
    .description('Configure GitHub integration')
    .requiredOption('-t, --token <token>', 'GitHub Personal Access Token')
    .option('-o, --owner <owner>', 'Repository owner (username or org)')
    .option('-r, --repo <repo>', 'Repository name')
    .option('--create-repo <name>', 'Create a new repository')
    .action(async (options) => {
      try {
        console.log(chalk.blue('🔧'), 'Setting up GitHub integration...\n');
        
        // Validate token
        const tempClient = new GitHubClient(options.token, 'test', 'test');
        const user = await tempClient.getAuthenticatedUser();
        
        console.log(chalk.green('✓'), `Authenticated as ${chalk.cyan(user.login)}`);
        console.log(chalk.gray(`  Name: ${user.name || 'N/A'}`));
        console.log(chalk.gray(`  Email: ${user.email || 'N/A'}`));
        
        let owner = options.owner || user.login;
        let repo = options.repo;
        
        // Create repo if requested
        if (options.createRepo) {
          console.log(chalk.blue('\n📦'), `Creating repository: ${chalk.cyan(options.createRepo)}`);
          
          const repoData = await tempClient.createRepo(
            options.createRepo,
            'ACP - Agent Coordination Protocol project',
            false // public
          );
          
          console.log(chalk.green('✓'), `Repository created: ${chalk.cyan(repoData.html_url)}`);
          repo = options.createRepo;
          
          // Wait a moment for repo to be ready
          console.log(chalk.gray('  Waiting for repository to be ready...'));
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Initialize with ACP structure
          console.log(chalk.blue('\n📁'), 'Initializing ACP structure...');
          
          const client = new GitHubClient(options.token, owner, repo);
          
          try {
            await client.createOrUpdateFile(
              'README.md',
              'Initial commit: Add README',
              `# ${repo}\n\nAgent Coordination Protocol project.\n\n## Getting Started\n\n1. Install ACP CLI\n2. Run \`acp init\`\n3. Create slots and assign agents\n`
            );
            console.log(chalk.green('✓'), 'Created README.md');
          } catch (e) {
            console.log(chalk.yellow('⚠'), 'README.md may already exist');
          }
          
          try {
            await client.createOrUpdateFile(
              '.acp/project.json',
              'Add ACP project configuration',
              JSON.stringify({
                id: repo,
                name: repo,
                description: 'ACP managed project',
                github: {
                  owner: owner,
                  repo: repo
                }
              }, null, 2)
            );
            console.log(chalk.green('✓'), 'Created .acp/project.json');
          } catch (e) {
            console.log(chalk.yellow('⚠'), 'Project config may already exist');
          }
          
          console.log(chalk.green('✓'), 'ACP structure initialized');
        }
        
        // Save credentials locally
        const configDir = path.join(os.homedir(), '.acp');
        await fs.mkdir(configDir, { recursive: true });
        
        const config = {
          github: {
            token: options.token,
            owner: owner,
            repo: repo
          }
        };
        
        const configPath = path.join(configDir, 'credentials.json');
        await fs.writeFile(
          configPath,
          JSON.stringify(config, null, 2),
          { mode: 0o600 }
        );
        
        console.log(chalk.green('✓'), `Credentials saved to ${chalk.gray(configPath)}`);
        console.log(chalk.yellow('\n⚠️'), 'Keep your token secure!');
        
        if (repo) {
          console.log(chalk.bold('\n🎉 Setup complete!'));
          console.log(chalk.gray(`Repository: https://github.com/${owner}/${repo}`));
        } else {
          console.log(chalk.bold('\n🎉 Token validated and saved!'));
          console.log(chalk.gray('Use --create-repo or --owner/--repo to specify a repository'));
        }
        
      } catch (error: any) {
        console.error(chalk.red('✗'), 'Setup failed:', error.response?.data?.message || error.message);
        process.exit(1);
      }
    }),

  status: new Command('status')
    .description('Check GitHub integration status')
    .action(async () => {
      try {
        const configPath = path.join(os.homedir(), '.acp', 'credentials.json');
        const configData = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(configData);
        
        const client = new GitHubClient(config.github.token, config.github.owner, config.github.repo);
        
        console.log(chalk.blue('🔍'), 'Checking GitHub integration...\n');
        
        const user = await client.getAuthenticatedUser();
        console.log(chalk.green('✓'), `Authenticated: ${chalk.cyan(user.login)}`);
        
        if (config.github.repo) {
          const repo = await client.getRepo();
          console.log(chalk.green('✓'), `Repository: ${chalk.cyan(repo.full_name)}`);
          console.log(chalk.gray(`  URL: ${repo.html_url}`));
          console.log(chalk.gray(`  Stars: ${repo.stargazers_count}`));
          console.log(chalk.gray(`  Open issues: ${repo.open_issues_count}`));
        }
        
        const rateLimit = await client.getRateLimit();
        console.log(chalk.gray(`\nAPI Rate limit: ${rateLimit.rate.remaining}/${rateLimit.rate.limit} remaining`));
        console.log(chalk.gray(`Resets at: ${new Date(rateLimit.rate.reset * 1000).toLocaleString()}`));
        
      } catch (error: any) {
        console.error(chalk.red('✗'), 'Not configured:', error.message);
        console.log(chalk.gray('Run: acp github setup --token=YOUR_TOKEN --create-repo=repo-name'));
      }
    }),

  sync: new Command('sync')
    .description('Sync ACP tasks to GitHub issues')
    .action(async () => {
      console.log(chalk.yellow('Coming soon: Sync tasks to GitHub issues'));
    })
};
