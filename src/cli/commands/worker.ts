import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import { RoleManifest, Message } from '../../types/index.js';

interface WorkerOptions {
  projectPath: string;
  agentId: string;
  sessionKey: string;
  manifest: RoleManifest;
}

export async function startWorker(options: WorkerOptions): Promise<void> {
  const { projectPath, agentId, manifest } = options;
  
  console.log(chalk.blue('🔄'), 'Worker started');
  console.log(chalk.gray(`  Inbox: ${manifest.communication.inbox}`));
  console.log(chalk.gray(`  Outbox: ${manifest.communication.outbox}`));
  
  // Ensure inbox exists
  await fs.mkdir(manifest.communication.inbox, { recursive: true });
  
  // Worker loop
  let running = true;
  
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n⚠️'), 'Shutting down worker...');
    running = false;
  });
  
  process.on('SIGTERM', () => {
    running = false;
  });
  
  console.log(chalk.gray('  Waiting for messages... (Ctrl+C to stop)'));
  
  while (running) {
    try {
      // Check for messages
      const messages = await checkInbox(manifest.communication.inbox);
      
      for (const message of messages) {
        console.log(chalk.cyan('📨'), `Received ${message.type} from ${message.from}`);
        
        // Process message
        await processMessage(message, options);
        
        // Mark as read (move to .read/)
        await fs.rename(
          path.join(manifest.communication.inbox, `${message.id}.json`),
          path.join(manifest.communication.inbox, '.read', `${message.id}.json`)
        );
      }
      
      // Heartbeat
      await updateHeartbeat(projectPath, agentId);
      
    } catch (error) {
      console.error(chalk.red('Worker error:'), error);
    }
    
    // Sleep 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.log(chalk.green('✓'), 'Worker stopped');
}

async function checkInbox(inboxPath: string): Promise<Message[]> {
  const messages: Message[] = [];
  
  try {
    const files = await fs.readdir(inboxPath);
    
    for (const file of files) {
      if (file.endsWith('.json') && !file.startsWith('.')) {
        const content = await fs.readFile(path.join(inboxPath, file), 'utf-8');
        const message = JSON.parse(content);
        messages.push({
          ...message,
          timestamp: new Date(message.timestamp)
        });
      }
    }
  } catch (error) {
    // Inbox might not exist yet
  }
  
  // Sort by timestamp
  return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

async function processMessage(message: Message, _options: WorkerOptions): Promise<void> {
  // const agentId = _options.agentId;
  // const manifest = _options.manifest;
  
  switch (message.type) {
    case 'TASK_ASSIGN':
      console.log(chalk.green('📋'), `New task assigned: ${message.task}`);
      // TODO: Spawn LLM session to work on task
      break;
      
    case 'SYNC':
      console.log(chalk.gray('🔄'), 'Sync request received');
      break;
      
    default:
      console.log(chalk.gray('❓'), `Unknown message type: ${message.type}`);
  }
}

async function updateHeartbeat(projectPath: string, agentId: string): Promise<void> {
  const agentPath = path.join(projectPath, '.acp', 'agents', `${agentId}.json`);
  
  try {
    const content = await fs.readFile(agentPath, 'utf-8');
    const agent = JSON.parse(content);
    agent.lastActive = new Date().toISOString();
    await fs.writeFile(agentPath, JSON.stringify(agent, null, 2));
  } catch (error) {
    // Agent file might not exist
  }
}
