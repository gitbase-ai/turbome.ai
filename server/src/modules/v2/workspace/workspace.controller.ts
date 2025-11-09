import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { V2WorkspaceService } from './workspace.service';
import { V1Workspace } from '@shared/index';

@ApiTags('V2 Workspaces')
@Controller('v2/repo')
export class V2WorkspaceController {
  constructor(private readonly workspaceService: V2WorkspaceService) {}

  @Get(':domain/:owner/:repo/workspaces')
  @ApiOperation({
    summary: 'Get workspaces for repository',
    description: 'Get workspaces for repository URL like github.com/user/repo',
  })
  async getWorkspaces(
    @Param('domain') domain: string,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Query('limit') limit?: string,
    @Query('include_hidden') includeHidden?: string,
    @Query('file_types') fileTypes?: string,
  ): Promise<V1Workspace.WorkspaceResponse> {
    const url = `${domain}/${owner}/${repo}`;
    return this.getWorkspacesInternal(url, limit, includeHidden, fileTypes);
  }

  // Internal helper method
  private async getWorkspacesInternal(
    url: string,
    limit?: string,
    includeHidden?: string,
    fileTypes?: string,
  ): Promise<V1Workspace.WorkspaceResponse> {
    try {
      const parsedLimit = limit ? parseInt(limit, 10) : 100;
      const parsedIncludeHidden = includeHidden === 'true';
      const parsedFileTypes = fileTypes
        ? fileTypes
            .split(',')
            .map((ext) => ext.trim())
            .filter((ext) => ext.length > 0)
        : [];

      const workspaceQuery: V1Workspace.WorkspaceQuery = {
        limit: parsedLimit,
        include_hidden: parsedIncludeHidden,
        file_types: parsedFileTypes,
      };

      return await this.workspaceService.getWorkspacesByRepoUrl(
        url,
        workspaceQuery,
      );
    } catch (error) {
      console.error('Error in V2 workspaces controller:', error);
      return {
        success: false,
        data: {
          workspaces: [],
          total_workspaces: 0,
          total_files: 0,
        },
        message:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve workspaces',
      };
    }
  }
}
