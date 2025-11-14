import { exec } from 'child_process';
import { promisify } from 'util';
import { GitCommit, GitCommitsQuery, GitStats } from '@shared/types/git';

const execAsync = promisify(exec);

export interface GitCommitOptions {
  commitMessage: string;
  authorName?: string;
  authorEmail?: string;
  filePath?: string;
}

export interface GitCommitsResult {
  commits: GitCommit[];
  totalCount: number;
}

export class GitUtil {
  private readonly workingDirectory: string;

  constructor(workingDirectory: string) {
    this.workingDirectory = workingDirectory;
  }

  /**
   * Execute git command in the working directory
   */
  private async executeGitCommand(command: string): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.workingDirectory,
        timeout: 10000 // 10 second timeout
      });
      
      if (stderr && !stderr.includes('warning:')) {
        console.warn(`Git warning/error: ${stderr}`);
      }
      
      return stdout.trim();
    } catch (error: any) {
      throw new Error(`Git command failed: ${error.message}`);
    }
  }

  /**
   * Check if the current directory is a git repository
   */
  async isGitRepository(): Promise<boolean> {
    try {
      await this.executeGitCommand('git rev-parse --git-dir');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Initialize a git repository if it doesn't exist
   */
  async initRepository(): Promise<void> {
    const isRepo = await this.isGitRepository();
    if (!isRepo) {
      console.log('Initializing git repository...');
      await this.executeGitCommand('git init');
      
      // Set default branch to main if not already set
      try {
        await this.executeGitCommand('git symbolic-ref HEAD refs/heads/main');
      } catch {
        // Ignore if already set or git version doesn't support it
      }
    }
  }

  /**
   * Add file(s) to git staging area
   */
  async addFiles(filePaths: string | string[]): Promise<void> {
    const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
    
    for (const filePath of paths) {
      try {
        await this.executeGitCommand(`git add "${filePath}"`);
      } catch (error) {
        console.warn(`Failed to add file ${filePath} to git: ${error}`);
        // Continue with other files even if one fails
      }
    }
  }

  /**
   * Remove file(s) from git tracking
   */
  async removeFiles(filePaths: string | string[]): Promise<void> {
    const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
    
    for (const filePath of paths) {
      try {
        await this.executeGitCommand(`git rm "${filePath}"`);
      } catch (error) {
        console.warn(`Failed to remove file ${filePath} from git: ${error}`);
        // Continue with other files even if one fails
      }
    }
  }

  /**
   * Check if there are any changes to commit
   */
  async hasChangesToCommit(): Promise<boolean> {
    try {
      const output = await this.executeGitCommand('git diff --cached --name-only');
      return output.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Create a git commit
   */
  async commit(options: GitCommitOptions): Promise<string> {
    // Ensure we have a git repository
    await this.initRepository();

    // Add file if specified
    if (options.filePath) {
      await this.addFiles(options.filePath);
    }

    // Check if there are changes to commit
    const hasChanges = await this.hasChangesToCommit();
    if (!hasChanges) {
      console.log('No changes to commit');
      return 'No changes to commit';
    }

    // Build commit command
    let commitCommand = 'git commit';
    
    // Add author information if provided
    if (options.authorName || options.authorEmail) {
      const author = `"${options.authorName || 'Unknown'} <${options.authorEmail || 'unknown@example.com'}>"`;
      commitCommand += ` --author=${author}`;
    }
    
    // Add commit message
    commitCommand += ` -m "${options.commitMessage.replace(/"/g, '\\"')}"`;

    try {
      const result = await this.executeGitCommand(commitCommand);
      console.log(`Git commit successful: ${options.commitMessage}`);
      return result;
    } catch (error) {
      console.error(`Git commit failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get current git status
   */
  async getStatus(): Promise<string> {
    try {
      return await this.executeGitCommand('git status --porcelain');
    } catch (error) {
      return `Git status unavailable: ${error}`;
    }
  }

  /**
   * Get last commit hash
   */
  async getLastCommitHash(): Promise<string | null> {
    try {
      return await this.executeGitCommand('git rev-parse HEAD');
    } catch {
      return null;
    }
  }

  /**
   * Get commits with pagination and filtering
   */
  async getCommits(query: GitCommitsQuery = {}): Promise<GitCommitsResult> {
    const {
      page = 1,
      per_page = 20,
      ref_name = 'HEAD',
      since,
      until,
      path,
      author,
      search
    } = query;

    // Build git log command
    let gitCommand = 'git log';
    
    // Add format for structured output
    gitCommand += ' --pretty=format:"%H|%h|%s|%an|%ae|%ad|%cn|%ce|%cd|%P"';
    gitCommand += ' --date=iso-strict';
    
    // Add branch/ref
    gitCommand += ` ${ref_name}`;
    
    // Add date filters
    if (since) {
      gitCommand += ` --since="${since}"`;
    }
    if (until) {
      gitCommand += ` --until="${until}"`;
    }
    
    // Add author filter
    if (author) {
      gitCommand += ` --author="${author}"`;
    }
    
    // Add search in commit message
    if (search) {
      gitCommand += ` --grep="${search}"`;
    }
    
    // Add path filter
    if (path) {
      gitCommand += ` -- "${path}"`;
    }

    try {
      // Get total count first
      let countCommand = gitCommand.replace(
        '--pretty=format:"%H|%h|%s|%an|%ae|%ad|%cn|%ce|%cd|%P"',
        '--oneline'
      );
      const countOutput = await this.executeGitCommand(countCommand);
      const totalCount = countOutput ? countOutput.split('\n').length : 0;

      // Add pagination
      const skip = (page - 1) * per_page;
      gitCommand += ` --skip=${skip} --max-count=${per_page}`;

      const output = await this.executeGitCommand(gitCommand);
      
      if (!output) {
        return { commits: [], totalCount: 0 };
      }

      const commits = this.parseGitLogOutput(output);
      return { commits, totalCount };

    } catch (error) {
      console.error('Error getting commits:', error);
      return { commits: [], totalCount: 0 };
    }
  }

  /**
   * Parse git log output into GitCommit objects
   */
  private parseGitLogOutput(output: string): GitCommit[] {
    const commits: GitCommit[] = [];
    const lines = output.split('\n').filter(line => line.trim());

    for (const line of lines) {
      const parts = line.split('|');
      if (parts.length >= 10) {
        const [
          id,
          short_id,
          title,
          author_name,
          author_email,
          authored_date,
          committer_name,
          committer_email,
          committed_date,
          parentIds
        ] = parts;

        commits.push({
          id: id,
          short_id: short_id,
          title: title,
          message: title, // Use title as message since we removed %B
          author_name: author_name,
          author_email: author_email,
          authored_date: authored_date,
          committer_name: committer_name,
          committer_email: committer_email,
          committed_date: committed_date,
          created_at: authored_date,
          parent_ids: parentIds ? parentIds.split(' ').filter(id => id) : []
        });
      }
    }

    return commits;
  }

  /**
   * Get commit statistics (additions, deletions)
   */
  async getCommitStats(commitId: string): Promise<GitStats | null> {
    try {
      const command = `git show --numstat --format="" ${commitId}`;
      const output = await this.executeGitCommand(command);
      
      if (!output) {
        return null;
      }

      let additions = 0;
      let deletions = 0;

      const lines = output.split('\n').filter(line => line.trim());
      for (const line of lines) {
        const parts = line.split('\t');
        if (parts.length >= 2) {
          const add = parseInt(parts[0]) || 0;
          const del = parseInt(parts[1]) || 0;
          additions += add;
          deletions += del;
        }
      }

      return {
        additions,
        deletions,
        total: additions + deletions
      };
    } catch (error) {
      console.error('Error getting commit stats:', error);
      return null;
    }
  }

  /**
   * Get branches list
   */
  async getBranches(): Promise<string[]> {
    try {
      const output = await this.executeGitCommand('git branch -a --format="%(refname:short)"');
      return output.split('\n').filter(branch => branch.trim() && !branch.startsWith('origin/'));
    } catch (error) {
      console.error('Error getting branches:', error);
      return ['main'];
    }
  }

  /**
   * Get current branch name
   */
  async getCurrentBranch(): Promise<string> {
    try {
      return await this.executeGitCommand('git branch --show-current');
    } catch (error) {
      console.error('Error getting current branch:', error);
      return 'main';
    }
  }

  /**
   * Get git configuration list
   */
  async getGitConfig(): Promise<{ [key: string]: string }> {
    try {
      const output = await this.executeGitCommand('git config --list');
      const config: { [key: string]: string } = {};
      
      const lines = output.split('\n').filter(line => line.trim());
      for (const line of lines) {
        const equalIndex = line.indexOf('=');
        if (equalIndex > 0) {
          const key = line.substring(0, equalIndex);
          const value = line.substring(equalIndex + 1);
          config[key] = value;
        }
      }
      
      return config;
    } catch (error) {
      console.error('Error getting git config:', error);
      return {};
    }
  }

  /**
   * Get specific git config value
   */
  async getGitConfigValue(key: string): Promise<string | null> {
    try {
      return await this.executeGitCommand(`git config --get ${key}`);
    } catch (error) {
      console.error(`Error getting git config for ${key}:`, error);
      return null;
    }
  }

  /**
   * Rename/move file or directory in git
   */
  async moveFile(oldPath: string, newPath: string): Promise<void> {
    try {
      // Use git mv command to rename/move the file or directory
      await this.executeGitCommand(`git mv "${oldPath}" "${newPath}"`);
    } catch (error) {
      throw new Error(`Failed to rename/move ${oldPath} to ${newPath}: ${error.message}`);
    }
  }
}