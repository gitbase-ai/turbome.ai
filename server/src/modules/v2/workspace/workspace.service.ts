import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { V2Workspace } from '@shared/index';
import * as path from 'path';
import { ConfigService } from '../config/config.service';

const execAsync = promisify(exec);

@Injectable()
export class V2WorkspaceService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Get workspaces by repository URL
   * 通过 repo URL 从配置中找到 localPath，然后在该目录下扫描
   */
  async getWorkspacesByRepoUrl(
    repoUrl: string,
    query: V2Workspace.V2WorkspaceQuery = {},
  ): Promise<V2Workspace.V2WorkspaceResponse> {
    try {
      // 读取配置文件
      const config = await this.configService.readLocalConfig();
      const repos = config.repos || [];

      // 根据 URL 查找对应的 repo
      const repo = repos.find((r) => r.url === repoUrl);

      if (!repo) {
        return {
          success: false,
          data: {
            workspaces: [],
            totalWorkspaces: 0,
            totalFiles: 0,
          },
          message: `Repository with URL "${repoUrl}" not found in config`,
        };
      }

      // 使用该 repo 的 localPath 作为扫描目录
      return await this.scanWorkspaces(repo.localPath, query);
    } catch (error) {
      console.error('Error in getWorkspacesByRepoUrl:', error);
      return {
        success: false,
        data: {
          workspaces: [],
          totalWorkspaces: 0,
          totalFiles: 0,
        },
        message:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve workspaces',
      };
    }
  }

  /**
   * 在指定目录下扫描 workspace 元数据
   * 逻辑完全同 V1WorkspaceService
   */
  private async scanWorkspaces(
    storageDir: string,
    query: V2Workspace.V2WorkspaceQuery = {},
  ): Promise<V2Workspace.V2WorkspaceResponse> {
    try {
      const { limit = 100, includeHidden = false, fileTypes = [] } = query;

      // Build grep command to find workspace: metadata in first 10 lines
      let grepCommand = `grep -rn "^workspace:" "${storageDir}"`;

      // Exclude hidden directories and files if not requested
      if (!includeHidden) {
        grepCommand += ' --exclude-dir=".*"';
      }

      // Add file type includes
      if (fileTypes.length > 0) {
        const includes = fileTypes.map((ext) => `--include="*.${ext}"`).join(' ');
        grepCommand += ` ${includes}`;
      }

      // Limit results to prevent overwhelming output
      grepCommand += ' | head -500';

      const { stdout } = await execAsync(grepCommand, {
        cwd: storageDir,
        timeout: 10000,
      });

      const lines = stdout.split('\n').filter((line) => line.trim());
      const workspaceFiles: V2Workspace.V2WorkspaceFile[] = [];

      for (const line of lines) {
        if (!line) continue;

        // Parse grep output: filename:line_number:content
        const match = line.match(/^([^:]+):(\d+):(.*)$/);
        if (!match) continue;

        const [, filePath, lineNumber, content] = match;
        const lineNum = parseInt(lineNumber);

        // Only process if the match is in the first 10 lines
        if (lineNum > 10) continue;

        // Extract workspace value from "workspace: value"
        const workspaceMatch = content.match(/^workspace:\s*(.+)$/);
        if (!workspaceMatch) continue;

        // Remove quotes and trim the workspace value
        const workspace = workspaceMatch[1].trim().replace(/^["']|["']$/g, '');
        const relativePath = path.relative(storageDir, filePath);
        const filename = path.basename(filePath);

        workspaceFiles.push({
          path: relativePath,
          filename,
          workspace,
          line: lineNum,
        });
      }

      // Group files by workspace
      const workspaceMap = new Map<string, V2Workspace.V2WorkspaceFile[]>();

      for (const file of workspaceFiles) {
        if (!workspaceMap.has(file.workspace)) {
          workspaceMap.set(file.workspace, []);
        }
        workspaceMap.get(file.workspace)!.push(file);
      }

      // Convert to workspace groups
      const workspaces: V2Workspace.V2WorkspaceGroup[] = Array.from(
        workspaceMap.entries(),
      )
        .map(([workspace, files]) => ({
          workspace,
          files: files.slice(0, limit), // Limit files per workspace
          count: files.length,
        }))
        .sort((a, b) => a.workspace.localeCompare(b.workspace)); // Sort by workspace name alphabetically

      return {
        success: true,
        data: {
          workspaces,
          totalWorkspaces: workspaces.length,
          totalFiles: workspaceFiles.length,
        },
      };
    } catch (error) {
      console.error('Error in workspace scan:', error);
      return {
        success: false,
        data: {
          workspaces: [],
          totalWorkspaces: 0,
          totalFiles: 0,
        },
        message:
          error instanceof Error ? error.message : 'Workspace search failed',
      };
    }
  }
}
