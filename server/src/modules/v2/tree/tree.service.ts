import { Injectable } from '@nestjs/common';
import { V2Tree } from '@shared/index';
import { GitUtil } from '../../../utils/git.util';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class TreeService {
  /**
   * Get directory tree for a specific path in a repository
   * @param repoPath - Local path to the repository
   * @param treePath - Path within the repository (relative to repo root)
   * @param recursive - Whether to recursively load subdirectories
   * @returns Tree entries
   */
  async getTree(
    repoPath: string,
    treePath: string = '',
    recursive: boolean = false,
  ): Promise<V2Tree.TreeEntry[]> {
    // Normalize and validate the path
    const normalizedTreePath = treePath.replace(/^\/+|\/+$/g, '');
    const fullPath = path.join(repoPath, normalizedTreePath);

    // Security check: ensure the resolved path is still within the repo
    const resolvedPath = path.resolve(fullPath);
    const resolvedRepoPath = path.resolve(repoPath);
    if (!resolvedPath.startsWith(resolvedRepoPath)) {
      throw new Error('Invalid path: outside repository bounds');
    }

    // Check if path exists
    try {
      const stats = await fs.stat(resolvedPath);
      if (!stats.isDirectory()) {
        throw new Error('Path is not a directory');
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Path doesn't exist - try prefix matching in parent directory
        return this.getTreeWithPrefixMatch(repoPath, normalizedTreePath, recursive);
      }
      throw error;
    }

    // Read directory entries
    const entries = await fs.readdir(resolvedPath, { withFileTypes: true });

    // Build tree entries
    const treeEntries: V2Tree.TreeEntry[] = [];

    for (const entry of entries) {
      // Skip hidden files and .git directory
      if (entry.name.startsWith('.')) {
        continue;
      }

      const entryFullPath = path.join(resolvedPath, entry.name);
      const entryRelativePath = path.join(normalizedTreePath, entry.name);

      if (entry.isDirectory()) {
        const dirEntry: V2Tree.TreeEntry = {
          name: entry.name,
          path: entryRelativePath,
          type: 'directory',
        };

        // If recursive, load children
        if (recursive) {
          dirEntry.children = await this.getTree(
            repoPath,
            entryRelativePath,
            true,
          );
        }

        treeEntries.push(dirEntry);
      } else if (entry.isFile()) {
        const stats = await fs.stat(entryFullPath);
        const fileEntry: V2Tree.TreeEntry = {
          name: entry.name,
          path: entryRelativePath,
          type: 'file',
          size: stats.size,
        };

        treeEntries.push(fileEntry);
      }
    }

    // Sort: directories first, then files, alphabetically
    treeEntries.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'directory' ? -1 : 1;
    });

    return treeEntries;
  }

  /**
   * Get tree entries with prefix matching when exact path doesn't exist
   * Falls back to parent directory and filters by prefix
   */
  private async getTreeWithPrefixMatch(
    repoPath: string,
    treePath: string,
    recursive: boolean = false,
  ): Promise<V2Tree.TreeEntry[]> {
    // Extract parent directory and prefix
    const lastSlashIndex = treePath.lastIndexOf('/');
    let parentPath: string;
    let prefix: string;

    if (lastSlashIndex > 0) {
      // Has parent directory: "dir1/draf" -> parent = "dir1", prefix = "draf"
      parentPath = treePath.substring(0, lastSlashIndex);
      prefix = treePath.substring(lastSlashIndex + 1);
    } else {
      // At root level: "draf" -> parent = "", prefix = "draf"
      parentPath = '';
      prefix = treePath;
    }

    // Get parent directory entries
    const parentEntries = await this.getTree(repoPath, parentPath, recursive);

    // Filter by prefix (case-insensitive)
    const lowerPrefix = prefix.toLowerCase();
    const filteredEntries = parentEntries.filter(entry =>
      entry.name.toLowerCase().startsWith(lowerPrefix)
    );

    return filteredEntries;
  }

  /**
   * Rename/move a file or directory
   * @param repoPath - Local path to the repository
   * @param oldPath - Old path (source)
   * @param newPath - New path (destination)
   * @param commitOptions - Git commit options
   * @returns Rename result
   */
  async renameFile(
    repoPath: string,
    oldPath: string,
    newPath: string,
    commitOptions: {
      commitMessage?: string;
      authorName?: string;
      authorEmail?: string;
    } = {},
  ): Promise<{ oldPath: string; newPath: string }> {
    // Normalize paths
    const normalizedOldPath = oldPath.replace(/^\/+|\/+$/g, '');
    const normalizedNewPath = newPath.replace(/^\/+|\/+$/g, '');

    // Validate paths
    if (!normalizedOldPath || !normalizedNewPath) {
      throw new Error('Both oldPath and newPath are required');
    }

    if (normalizedOldPath === normalizedNewPath) {
      throw new Error('Old path and new path cannot be the same');
    }

    // Security check: ensure paths are within repository
    const fullOldPath = path.resolve(repoPath, normalizedOldPath);
    const fullNewPath = path.resolve(repoPath, normalizedNewPath);
    const resolvedRepoPath = path.resolve(repoPath);

    if (!fullOldPath.startsWith(resolvedRepoPath) || !fullNewPath.startsWith(resolvedRepoPath)) {
      throw new Error('Invalid path: outside repository bounds');
    }

    // Check if old path exists
    try {
      await fs.stat(fullOldPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Source path does not exist: ${normalizedOldPath}`);
      }
      throw error;
    }

    // Check if new path already exists
    try {
      await fs.stat(fullNewPath);
      throw new Error(`Destination path already exists: ${normalizedNewPath}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // ENOENT is expected - new path should not exist
    }

    // Ensure parent directory of new path exists
    const newPathDir = path.dirname(fullNewPath);
    await fs.mkdir(newPathDir, { recursive: true });

    // Initialize GitUtil
    const gitUtil = new GitUtil(repoPath);

    // Use git mv to rename/move
    await gitUtil.moveFile(normalizedOldPath, normalizedNewPath);

    // Create commit
    const defaultMessage = `Rename ${normalizedOldPath} to ${normalizedNewPath}`;
    await gitUtil.commit({
      commitMessage: commitOptions.commitMessage || defaultMessage,
      authorName: commitOptions.authorName,
      authorEmail: commitOptions.authorEmail,
    });

    return {
      oldPath: normalizedOldPath,
      newPath: normalizedNewPath,
    };
  }
}
