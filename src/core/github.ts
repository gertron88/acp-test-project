/**
 * GitHub API integration for ACP
 * Handles repository operations, issues, PRs, and webhooks
 */

import axios, { AxiosInstance } from 'axios';

export class GitHubClient {
  private client: AxiosInstance;
  private _token: string;
  private owner: string;
  private repo: string;

  constructor(token: string, owner: string, repo: string) {
    this._token = token;
    this.owner = owner;
    this.repo = repo;
    
    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        'Authorization': `Bearer ${this._token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
  }

  // Repository operations
  async getRepo() {
    const response = await this.client.get(`/repos/${this.owner}/${this.repo}`);
    return response.data;
  }

  async createRepo(name: string, description?: string, isPrivate = false) {
    const response = await this.client.post('/user/repos', {
      name,
      description,
      private: isPrivate,
      auto_init: true
    });
    return response.data;
  }

  // Issue operations
  async createIssue(title: string, body?: string, labels?: string[], assignees?: string[]) {
    const response = await this.client.post(`/repos/${this.owner}/${this.repo}/issues`, {
      title,
      body,
      labels,
      assignees
    });
    return response.data;
  }

  async listIssues(state: 'open' | 'closed' | 'all' = 'open') {
    const response = await this.client.get(`/repos/${this.owner}/${this.repo}/issues`, {
      params: { state }
    });
    return response.data;
  }

  async updateIssue(number: number, updates: { title?: string; body?: string; state?: string; labels?: string[] }) {
    const response = await this.client.patch(`/repos/${this.owner}/${this.repo}/issues/${number}`, updates);
    return response.data;
  }

  async addIssueComment(issueNumber: number, body: string) {
    const response = await this.client.post(`/repos/${this.owner}/${this.repo}/issues/${issueNumber}/comments`, {
      body
    });
    return response.data;
  }

  // Pull Request operations
  async createPullRequest(title: string, head: string, base: string, body?: string) {
    const response = await this.client.post(`/repos/${this.owner}/${this.repo}/pulls`, {
      title,
      head,
      base,
      body
    });
    return response.data;
  }

  async listPullRequests(state: 'open' | 'closed' | 'all' = 'open') {
    const response = await this.client.get(`/repos/${this.owner}/${this.repo}/pulls`, {
      params: { state }
    });
    return response.data;
  }

  async requestReview(pullNumber: number, reviewers: string[]) {
    const response = await this.client.post(`/repos/${this.owner}/${this.repo}/pulls/${pullNumber}/requested_reviewers`, {
      reviewers
    });
    return response.data;
  }

  async mergePullRequest(pullNumber: number, commitTitle?: string) {
    const response = await this.client.put(`/repos/${this.owner}/${this.repo}/pulls/${pullNumber}/merge`, {
      commit_title: commitTitle
    });
    return response.data;
  }

  // Project operations
  async listProjects() {
    const response = await this.client.get(`/repos/${this.owner}/${this.repo}/projects`, {
      headers: {
        'Accept': 'application/vnd.github.inertia-preview+json'
      }
    });
    return response.data;
  }

  // File operations
  async getFileContent(path: string, ref?: string) {
    const response = await this.client.get(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
      params: ref ? { ref } : {}
    });
    return response.data;
  }

  async createOrUpdateFile(path: string, message: string, content: string, sha?: string, branch?: string) {
    const data: any = {
      message,
      content: Buffer.from(content).toString('base64')
    };
    if (sha) data.sha = sha;
    if (branch) data.branch = branch;

    const response = await this.client.put(`/repos/${this.owner}/${this.repo}/contents/${path}`, data);
    return response.data;
  }

  // Branch operations
  async listBranches() {
    const response = await this.client.get(`/repos/${this.owner}/${this.repo}/branches`);
    return response.data;
  }

  async createBranch(branchName: string, fromBranch: string = 'main') {
    // Get the SHA of the from branch
    const branchResponse = await this.client.get(`/repos/${this.owner}/${this.repo}/git/refs/heads/${fromBranch}`);
    const sha = branchResponse.data.object.sha;

    // Create new branch
    const response = await this.client.post(`/repos/${this.owner}/${this.repo}/git/refs`, {
      ref: `refs/heads/${branchName}`,
      sha
    });
    return response.data;
  }

  // Webhook operations
  async createWebhook(config: { url: string; secret?: string; events?: string[] }) {
    const response = await this.client.post(`/repos/${this.owner}/${this.repo}/hooks`, {
      name: 'web',
      active: true,
      events: config.events || ['push', 'pull_request', 'issues'],
      config: {
        url: config.url,
        content_type: 'json',
        secret: config.secret
      }
    });
    return response.data;
  }

  // User operations
  async getAuthenticatedUser() {
    const response = await this.client.get('/user');
    return response.data;
  }

  // Rate limit check
  async getRateLimit() {
    const response = await this.client.get('/rate_limit');
    return response.data;
  }
}

// Helper function to parse GitHub URL
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }
  return null;
}

// Helper to create ACP-specific issue body
export function createTaskIssueBody(task: {
  id: string;
  title: string;
  description?: string;
  assignee?: string;
  priority?: string;
  dependencies?: string[];
}): string {
  const deps = task.dependencies?.length 
    ? `\n## Dependencies\n${task.dependencies.map(d => `- [ ] ${d}`).join('\n')}`
    : '';

  return `## ACP Task

**Task ID:** ${task.id}
**Priority:** ${task.priority || 'normal'}
**Assigned to:** ${task.assignee || 'unassigned'}

### Description
${task.description || 'No description provided.'}
${deps}

### Progress
- [ ] Started
- [ ] In Progress
- [ ] Review
- [ ] Done

---
*This issue was created by ACP (Agent Coordination Protocol)*
`;
}
