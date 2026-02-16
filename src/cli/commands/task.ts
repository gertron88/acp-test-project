import { Command } from 'commander';
import chalk from 'chalk';
import { loadProject, loadTasks, saveTask } from '../../core/project.js';
import { Task, TaskStatus, TaskPriority } from '../../types/index.js';

export const taskCommands = {
  list: new Command('list')
    .alias('ls')
    .description('List all tasks')
    .option('-s, --status <status>', 'Filter by status')
    .option('-a, --assigned <agent>', 'Filter by assignee')
    .action(async (options) => {
      try {
        const project = await loadProject(process.cwd());
        let tasks = await loadTasks(project.path);
        
        // Apply filters
        if (options.status) {
          tasks = tasks.filter(t => t.status === options.status);
        }
        if (options.assigned) {
          tasks = tasks.filter(t => t.assignee === options.assigned);
        }
        
        console.log(chalk.bold('\n📋 Tasks\n'));
        
        if (tasks.length === 0) {
          console.log(chalk.gray('No tasks found. Create one with:'));
          console.log(chalk.cyan('  acp task create --title="Fix bug"'));
          return;
        }
        
        // Header
        console.log(
          chalk.gray(
            `${'ID'.padEnd(10)} ${'STATUS'.padEnd(12)} ${'PRI'.padEnd(6)} ${'ASSIGNED'.padEnd(12)} TITLE`
          )
        );
        console.log(chalk.gray('─'.repeat(80)));
        
        // Rows
        for (const task of tasks) {
          const statusIcon = getStatusIcon(task.status);
          const priorityIcon = getPriorityIcon(task.priority);
          const assignee = task.assignee || chalk.gray('unassigned');
          
          console.log(
            `${task.id.padEnd(10)} ` +
            `${statusIcon} ${task.status.padEnd(8)} ` +
            `${priorityIcon} ${task.priority.padEnd(4)} ` +
            `${assignee.padEnd(12)} ` +
            `${task.title.slice(0, 30)}`
          );
        }
        
        console.log();
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    }),

  create: new Command('create')
    .description('Create a new task')
    .requiredOption('-t, --title <title>', 'Task title')
    .option('-d, --description <desc>', 'Task description')
    .option('--priority <priority>', 'Priority (critical, high, normal, low)', 'normal')
    .option('--assign <agent>', 'Assign to agent')
    .option('--depends <tasks>', 'Dependencies (comma-separated task IDs)')
    .action(async (options) => {
      try {
        const project = await loadProject(process.cwd());
        
        const task: Task = {
          id: generateTaskId(),
          title: options.title,
          description: options.description,
          status: options.assign ? 'todo' : 'backlog',
          priority: options.priority as TaskPriority,
          assignee: options.assign,
          reporter: 'cli-user',
          dependencies: options.depends ? options.depends.split(',').map((t: string) => t.trim()) : [],
          dependents: [],
          project: project.id,
          createdAt: new Date(),
          progress: 0,
          checkpoints: []
        };
        
        await saveTask(project.path, task);
        
        console.log(chalk.green('✓'), `Created task ${chalk.cyan(task.id)}`);
        console.log(chalk.gray(`  Title: ${task.title}`));
        console.log(chalk.gray(`  Priority: ${task.priority}`));
        if (task.assignee) {
          console.log(chalk.gray(`  Assigned to: ${task.assignee}`));
        }
        
        if (task.assignee) {
          console.log();
          console.log(chalk.gray(`Agent ${task.assignee} will be notified.`));
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    }),

  assign: new Command('assign')
    .description('Assign a task to an agent')
    .argument('<task>', 'Task ID')
    .argument('<agent>', 'Agent ID')
    .action(async (_taskId, _agentId) => {
      console.log(chalk.yellow('Not implemented yet'));
    }),

  show: new Command('show')
    .description('Show task details')
    .argument('<task>', 'Task ID')
    .action(async (_taskId) => {
      console.log(chalk.yellow('Not implemented yet'));
    })
};

function generateTaskId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  return `TASK-${timestamp.slice(-4)}`;
}

function getStatusIcon(status: TaskStatus): string {
  switch (status) {
    case 'backlog': return chalk.gray('📦');
    case 'todo': return chalk.white('📋');
    case 'in-progress': return chalk.blue('▶️');
    case 'review': return chalk.yellow('👁️');
    case 'testing': return chalk.magenta('🧪');
    case 'done': return chalk.green('✅');
    case 'blocked': return chalk.red('🚫');
    case 'cancelled': return chalk.gray('❌');
    default: return chalk.gray('?');
  }
}

function getPriorityIcon(priority: TaskPriority): string {
  switch (priority) {
    case 'critical': return chalk.red('🔴');
    case 'high': return chalk.yellow('🟡');
    case 'normal': return chalk.white('⚪');
    case 'low': return chalk.gray('🔵');
    default: return chalk.gray('?');
  }
}
