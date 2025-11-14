import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { TreeService } from './tree.service';
import { ReposService } from '../repos/repos.service';
import { V2Tree } from '@shared/index';

@ApiTags('V2 Tree')
@Controller('v2/repos')
export class TreeController {
  constructor(
    private readonly treeService: TreeService,
    private readonly reposService: ReposService,
  ) {}

  @Get(':domain/:owner/:repo/trees/:path(*)')
  @ApiOperation({
    summary: 'Get directory tree',
    description: 'Get file and directory tree for a specific path in the repository',
  })
  @ApiParam({
    name: 'domain',
    description: 'Git hosting domain (e.g., github.com)',
    example: 'github.com',
  })
  @ApiParam({
    name: 'owner',
    description: 'Repository owner',
    example: 'user',
  })
  @ApiParam({
    name: 'repo',
    description: 'Repository name',
    example: 'myrepo',
  })
  @ApiParam({
    name: 'path',
    description: 'Path within repository (optional, defaults to root)',
    required: false,
    example: 'src/components',
  })
  @ApiQuery({
    name: 'recursive',
    description: 'Load subdirectories recursively',
    required: false,
    type: Boolean,
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns directory tree',
  })
  @ApiResponse({
    status: 404,
    description: 'Repository or path not found',
  })
  async getTree(
    @Param('domain') domain: string,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('path') treePath: string = '',
    @Query('recursive') recursive?: string,
  ): Promise<V2Tree.TreeResponse> {
    try {
      // Get repository info
      const repoUrl = `${domain}/${owner}/${repo}`;
      const repoInfo = await this.reposService.getRepoByUrl(repoUrl);

      // Parse recursive parameter
      const isRecursive = recursive === 'true' || recursive === '1';

      // Get tree
      const entries = await this.treeService.getTree(
        repoInfo.localPath,
        treePath,
        isRecursive,
      );

      return {
        success: true,
        data: {
          path: treePath || '/',
          entries,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get directory tree',
      };
    }
  }

  @Post(':domain/:owner/:repo/trees')
  @ApiOperation({
    summary: 'Rename/move file or directory',
    description: 'Rename or move a file or directory in the repository using git mv',
  })
  @ApiParam({
    name: 'domain',
    description: 'Git hosting domain (e.g., github.com)',
    example: 'github.com',
  })
  @ApiParam({
    name: 'owner',
    description: 'Repository owner',
    example: 'user',
  })
  @ApiParam({
    name: 'repo',
    description: 'Repository name',
    example: 'myrepo',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['oldPath', 'newPath'],
      properties: {
        oldPath: {
          type: 'string',
          description: 'Source path (file or directory to rename/move)',
          example: 'src/old-name.ts',
        },
        newPath: {
          type: 'string',
          description: 'Destination path (new name or location)',
          example: 'src/new-name.ts',
        },
        commitMessage: {
          type: 'string',
          description: 'Git commit message (optional, defaults to auto-generated message)',
          example: 'Rename file to better reflect its purpose',
        },
        authorName: {
          type: 'string',
          description: 'Git commit author name (optional)',
        },
        authorEmail: {
          type: 'string',
          description: 'Git commit author email (optional)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'File/directory renamed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request (missing parameters, same paths, etc.)',
  })
  @ApiResponse({
    status: 404,
    description: 'Repository or source path not found',
  })
  async renameFile(
    @Param('domain') domain: string,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Body() body: V2Tree.RenameRequest,
  ): Promise<V2Tree.RenameResponse> {
    try {
      // Validate request body
      if (!body.oldPath || !body.newPath) {
        return {
          success: false,
          message: 'Both oldPath and newPath are required',
        };
      }

      // Get repository info
      const repoUrl = `${domain}/${owner}/${repo}`;
      const repoInfo = await this.reposService.getRepoByUrl(repoUrl);

      // Perform rename
      const result = await this.treeService.renameFile(
        repoInfo.localPath,
        body.oldPath,
        body.newPath,
        {
          commitMessage: body.commitMessage,
          authorName: body.authorName,
          authorEmail: body.authorEmail,
        },
      );

      return {
        success: true,
        data: result,
        message: `Successfully renamed ${result.oldPath} to ${result.newPath}`,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to rename file/directory',
      };
    }
  }
}
