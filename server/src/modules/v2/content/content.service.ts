import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { V2Content } from '@shared/index';
import { ConfigService } from '../config/config.service';
import { GitUtil } from '../../../utils/git.util';

interface SaveMarkdownOptions {
  commitMessage: string;
  authorName?: string;
  authorEmail?: string;
}

@Injectable()
export class V2ContentService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Get repository local path by URL
   */
  private async getRepoLocalPath(repoUrl: string): Promise<string> {
    const config = await this.configService.readLocalConfig();
    const repos = config.repos || [];
    const repo = repos.find((r) => r.url === repoUrl);

    if (!repo) {
      throw new Error(`Repository with URL "${repoUrl}" not found in config`);
    }

    return repo.localPath;
  }

  // Check if file path is safe (prevent directory traversal)
  private isSafePath(filePath: string): boolean {
    const normalizedPath = path.normalize(filePath);
    return !normalizedPath.includes('../') && !path.isAbsolute(normalizedPath);
  }

  // Check if file is a markdown file
  private isMarkdownFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ['.md', '.markdown'].includes(ext);
  }

  // Parse frontmatter from markdown content
  private parseFrontmatter(content: string): { frontmatter?: Record<string, any>, content: string } {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return { content };
    }

    try {
      const frontmatterText = match[1];
      const markdownContent = match[2];

      // Parse YAML frontmatter manually (simple key-value parsing)
      const frontmatter: Record<string, any> = {};
      const lines = frontmatterText.split('\n');

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) continue;

        const colonIndex = trimmedLine.indexOf(':');
        if (colonIndex === -1) continue;

        const key = trimmedLine.substring(0, colonIndex).trim();
        const value = trimmedLine.substring(colonIndex + 1).trim();

        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '');

        // Try to parse as number or boolean
        if (cleanValue === 'true') {
          frontmatter[key] = true;
        } else if (cleanValue === 'false') {
          frontmatter[key] = false;
        } else if (!isNaN(Number(cleanValue)) && cleanValue !== '') {
          frontmatter[key] = Number(cleanValue);
        } else {
          frontmatter[key] = cleanValue;
        }
      }

      return { frontmatter, content: markdownContent };
    } catch (error) {
      console.warn(`Failed to parse frontmatter for content: ${error}`);
      return { content };
    }
  }

  // Combine frontmatter and content into markdown format
  private combineMarkdownContent(content: string, frontmatter?: Record<string, any>): string {
    if (!frontmatter || Object.keys(frontmatter).length === 0) {
      return content;
    }

    // Build YAML frontmatter
    const frontmatterLines = ['---'];
    for (const [key, value] of Object.entries(frontmatter)) {
      if (typeof value === 'string') {
        frontmatterLines.push(`${key}: "${value}"`);
      } else if (typeof value === 'boolean') {
        frontmatterLines.push(`${key}: ${value}`);
      } else if (typeof value === 'number') {
        frontmatterLines.push(`${key}: ${value}`);
      } else {
        // For complex types, convert to string
        frontmatterLines.push(`${key}: "${String(value)}"`);
      }
    }
    frontmatterLines.push('---');

    return frontmatterLines.join('\n') + '\n' + content;
  }

  async updateFrontmatter(
    repoUrl: string,
    filePath: string,
    frontmatterUpdates: Record<string, any>,
    options: SaveMarkdownOptions
  ): Promise<V2Content.V2UpdateFrontmatterResult> {
    // Security check: prevent directory traversal
    if (!this.isSafePath(filePath)) {
      throw new Error('Invalid file path: contains invalid characters or attempts directory traversal');
    }

    // Check if it's a markdown file
    if (!this.isMarkdownFile(filePath)) {
      throw new Error(`File '${filePath}' is not a markdown file`);
    }

    // Get repository local path
    const repoLocalPath = await this.getRepoLocalPath(repoUrl);
    const fullPath = path.join(repoLocalPath, filePath);

    try {
      // Check if file exists
      let fileStats;
      try {
        fileStats = await fs.stat(fullPath);
      } catch (error) {
        throw new Error(`File '${filePath}' does not exist`);
      }

      if (!fileStats.isFile()) {
        throw new Error(`Path '${filePath}' is not a file`);
      }

      // Read current file content
      const currentContent = await fs.readFile(fullPath, 'utf8');

      // Parse current frontmatter and content
      const { frontmatter: currentFrontmatter, content: markdownContent } = this.parseFrontmatter(currentContent);

      // Merge frontmatter updates with current frontmatter
      const updatedFrontmatter = { ...currentFrontmatter, ...frontmatterUpdates };

      // Get the list of updated keys
      const updatedKeys = Object.keys(frontmatterUpdates);

      // Combine updated frontmatter with content
      const newMarkdownContent = this.combineMarkdownContent(markdownContent, updatedFrontmatter);

      // Write updated file
      await fs.writeFile(fullPath, newMarkdownContent, 'utf8');

      // Get updated file stats
      const newStats = await fs.stat(fullPath);

      // Git operations
      const gitUtil = new GitUtil(repoLocalPath);

      // Add file to git
      await gitUtil.addFiles(filePath);

      // Create commit
      await gitUtil.commit({
        commitMessage: options.commitMessage,
        authorName: options.authorName,
        authorEmail: options.authorEmail,
        filePath: filePath
      });

      return {
        path: filePath,
        size: newStats.size,
        lastModified: newStats.mtime.toISOString(),
        updatedKeys: updatedKeys,
        currentFrontmatter: updatedFrontmatter
      };

    } catch (error) {
      throw new Error(`Failed to update frontmatter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteFrontmatter(
    repoUrl: string,
    filePath: string,
    frontmatterKeys: string[],
    options: SaveMarkdownOptions
  ): Promise<V2Content.V2DeleteFrontmatterResult> {
    // Security check: prevent directory traversal
    if (!this.isSafePath(filePath)) {
      throw new Error('Invalid file path: contains invalid characters or attempts directory traversal');
    }

    // Check if it's a markdown file
    if (!this.isMarkdownFile(filePath)) {
      throw new Error(`File '${filePath}' is not a markdown file`);
    }

    // Get repository local path
    const repoLocalPath = await this.getRepoLocalPath(repoUrl);
    const fullPath = path.join(repoLocalPath, filePath);

    try {
      // Check if file exists
      let fileStats;
      try {
        fileStats = await fs.stat(fullPath);
      } catch (error) {
        throw new Error(`File '${filePath}' does not exist`);
      }

      if (!fileStats.isFile()) {
        throw new Error(`Path '${filePath}' is not a file`);
      }

      // Read current file content
      const currentContent = await fs.readFile(fullPath, 'utf8');

      // Parse current frontmatter and content
      const { frontmatter: currentFrontmatter, content: markdownContent } = this.parseFrontmatter(currentContent);

      if (!currentFrontmatter || Object.keys(currentFrontmatter).length === 0) {
        throw new Error(`File '${filePath}' has no frontmatter to delete`);
      }

      let updatedFrontmatter = { ...currentFrontmatter };
      let deletedKeys: string[] = [];

      // Check if user wants to delete all frontmatter
      if (frontmatterKeys.length === 1 && frontmatterKeys[0] === '*') {
        // Delete all frontmatter
        deletedKeys = Object.keys(currentFrontmatter);
        updatedFrontmatter = {};
      } else {
        // Delete specific keys
        for (const key of frontmatterKeys) {
          if (key === '*') {
            throw new Error(`Wildcard "*" must be used alone to delete all frontmatter in file '${filePath}'`);
          }
          if (key in updatedFrontmatter) {
            delete updatedFrontmatter[key];
            deletedKeys.push(key);
          }
        }
      }

      if (deletedKeys.length === 0) {
        throw new Error(`No matching frontmatter keys found to delete in file '${filePath}'`);
      }

      // Combine updated frontmatter with content
      const newMarkdownContent = Object.keys(updatedFrontmatter).length > 0
        ? this.combineMarkdownContent(markdownContent, updatedFrontmatter)
        : markdownContent; // No frontmatter left, just content

      // Write updated file
      await fs.writeFile(fullPath, newMarkdownContent, 'utf8');

      // Get updated file stats
      const newStats = await fs.stat(fullPath);

      // Git operations
      const gitUtil = new GitUtil(repoLocalPath);

      // Add file to git
      await gitUtil.addFiles(filePath);

      // Create commit
      await gitUtil.commit({
        commitMessage: options.commitMessage,
        authorName: options.authorName,
        authorEmail: options.authorEmail,
        filePath: filePath
      });

      return {
        path: filePath,
        size: newStats.size,
        lastModified: newStats.mtime.toISOString(),
        deletedKeys: deletedKeys,
        remainingFrontmatter: updatedFrontmatter
      };

    } catch (error) {
      throw new Error(`Failed to delete frontmatter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file content
   * @param repoUrl - Repository URL
   * @param filePath - File path relative to repository root
   * @returns File content with optional frontmatter
   */
  async getFileContent(
    repoUrl: string,
    filePath: string
  ): Promise<V2Content.V2GetContentResult> {
    // Security check: prevent directory traversal
    if (!this.isSafePath(filePath)) {
      throw new Error('Invalid file path: contains invalid characters or attempts directory traversal');
    }

    // Get repository local path
    const repoLocalPath = await this.getRepoLocalPath(repoUrl);
    const fullPath = path.join(repoLocalPath, filePath);

    try {
      // Check if file exists
      let fileStats;
      try {
        fileStats = await fs.stat(fullPath);
      } catch (error) {
        throw new Error(`File '${filePath}' does not exist`);
      }

      if (!fileStats.isFile()) {
        throw new Error(`Path '${filePath}' is not a file`);
      }

      // Read file content
      const content = await fs.readFile(fullPath, 'utf8');

      // Parse frontmatter if it's a markdown file
      let frontmatter: Record<string, any> | undefined;
      let actualContent = content;

      if (this.isMarkdownFile(filePath)) {
        const parsed = this.parseFrontmatter(content);
        frontmatter = parsed.frontmatter;
        actualContent = parsed.content;
      }

      return {
        path: filePath,
        content: actualContent,
        size: fileStats.size,
        encoding: 'utf8',
        frontmatter,
      };
    } catch (error) {
      throw new Error(`Failed to read file content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create or update file content
   * @param repoUrl - Repository URL
   * @param filePath - File path relative to repository root
   * @param content - File content
   * @param frontmatter - Optional frontmatter for markdown files
   * @param options - Commit options
   * @returns Result with file information
   */
  async createOrUpdateFile(
    repoUrl: string,
    filePath: string,
    content: string,
    frontmatter: Record<string, any> | undefined,
    options: SaveMarkdownOptions
  ): Promise<V2Content.V2CreateOrUpdateFileResult> {
    // Security check: prevent directory traversal
    if (!this.isSafePath(filePath)) {
      throw new Error('Invalid file path: contains invalid characters or attempts directory traversal');
    }

    // Get repository local path
    const repoLocalPath = await this.getRepoLocalPath(repoUrl);
    const fullPath = path.join(repoLocalPath, filePath);

    try {
      // Check if file exists
      let fileExists = false;
      try {
        const stats = await fs.stat(fullPath);
        fileExists = stats.isFile();
      } catch (error) {
        // File doesn't exist, will create it
        fileExists = false;
      }

      // Prepare content to write
      let finalContent = content;

      // If it's a markdown file and frontmatter is provided, combine them
      if (this.isMarkdownFile(filePath) && frontmatter) {
        finalContent = this.combineMarkdownContent(content, frontmatter);
      }

      // Ensure parent directory exists
      const parentDir = path.dirname(fullPath);
      await fs.mkdir(parentDir, { recursive: true });

      // Write file
      await fs.writeFile(fullPath, finalContent, 'utf8');

      // Get file stats
      const newStats = await fs.stat(fullPath);

      // Git operations
      const gitUtil = new GitUtil(repoLocalPath);

      // Add file to git
      await gitUtil.addFiles(filePath);

      // Create commit
      await gitUtil.commit({
        commitMessage: options.commitMessage,
        authorName: options.authorName,
        authorEmail: options.authorEmail,
        filePath: filePath
      });

      return {
        path: filePath,
        size: newStats.size,
        created: !fileExists,
        lastModified: newStats.mtime.toISOString(),
      };

    } catch (error) {
      throw new Error(`Failed to create/update file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
