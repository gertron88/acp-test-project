import chalk from 'chalk';
import { initProject } from '../../core/project.js';

export const projectCommands = {
  init: async () => {
    try {
      const projectPath = process.cwd();
      await initProject(projectPath);
      
      console.log(chalk.green('✓'), 'Initialized ACP in current directory\n');
      console.log(chalk.bold('Next steps:'));
      console.log(chalk.gray('  1. Create a slot:'), chalk.cyan('acp slot create backend-dev-1 --role=backend-developer'));
      console.log(chalk.gray('  2. Commit the slot:'), chalk.cyan('git add .acp/ && git commit -m "Add ACP config"'));
      console.log(chalk.gray('  3. Agent claims slot:'), chalk.cyan('acp-agent claim-slot backend-dev-1 --provider=openclaw'));
      console.log(chalk.gray('  4. Create a task:'), chalk.cyan('acp task create --title="Implement auth" --assign=backend-dev-1'));
      console.log();
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
};
