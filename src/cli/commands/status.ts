import chalk from 'chalk';
import { loadProject, loadSlots, loadAgents, loadTasks } from '../../core/project.js';

export async function statusCommand() {
  try {
    const project = await loadProject(process.cwd());
    const slots = await loadSlots(project.path);
    const agents = await loadAgents(project.path);
    const tasks = await loadTasks(project.path);
    
    console.log(chalk.bold('\n🦞 ACP Status\n'));
    console.log(chalk.gray(`Project: ${project.name}`));
    console.log(chalk.gray(`Path: ${project.path}`));
    console.log();
    
    // Summary
    const claimedSlots = slots.filter(s => s.status === 'claimed').length;
    const activeAgents = agents.filter(a => a.status === 'active' || a.status === 'busy').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
    const blockedTasks = tasks.filter(t => t.status === 'blocked').length;
    
    console.log(chalk.bold('Summary'));
    console.log(`  Slots: ${chalk.cyan(claimedSlots)}/${slots.length} claimed`);
    console.log(`  Agents: ${chalk.cyan(activeAgents)}/${agents.length} active`);
    console.log(`  Tasks: ${chalk.cyan(inProgressTasks)} in progress, ${chalk.red(blockedTasks)} blocked`);
    console.log();
    
    // Active agents
    if (agents.length > 0) {
      console.log(chalk.bold('Active Agents'));
      for (const agent of agents.filter(a => a.status !== 'offline')) {
        const statusIcon = agent.status === 'busy' ? '🔵' : agent.status === 'blocked' ? '🔴' : '🟢';
        const task = agent.currentTask || 'idle';
        console.log(`  ${statusIcon} ${chalk.cyan(agent.id)} (${agent.role}) - ${task}`);
      }
      console.log();
    }
    
    // In-progress tasks
    const activeTasks = tasks.filter(t => t.status === 'in-progress' || t.status === 'blocked');
    if (activeTasks.length > 0) {
      console.log(chalk.bold('Active Tasks'));
      for (const task of activeTasks) {
        const icon = task.status === 'blocked' ? '🔴' : '▶️';
        const assignee = task.assignee || 'unassigned';
        console.log(`  ${icon} ${chalk.cyan(task.id)}: ${task.title.slice(0, 40)} (${assignee})`);
      }
      console.log();
    }
    
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
