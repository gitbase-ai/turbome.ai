import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReposService } from './repos.service';
import { V2Repo } from '@shared/index';

@ApiTags('V2 Repo')
@Controller('v2/repo')
export class RepoController {
  constructor(private readonly reposService: ReposService) {}

  @Get()
  @ApiOperation({
    summary: 'Get current active repository',
    description:
      'Get repository info from config file based on the "repo" field',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns current active repository information',
    schema: {
      type: 'object',
      properties: {
        origin: {
          type: 'string',
          description: 'Original git remote origin URL',
          example: 'git@github.com:user/repo.git',
        },
        url: {
          type: 'string',
          description: 'Normalized URL without protocol',
          example: 'github.com/user/repo',
        },
        localPath: {
          type: 'string',
          description: 'Local directory path of the git repository',
          example: '/home/user/projects/repo',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'No current repository set or repository not found',
  })
  async getCurrentRepo(): Promise<V2Repo.RepoInfo> {
    return await this.reposService.getCurrentRepo();
  }

  @Get('local')
  @ApiOperation({
    summary: 'Get local repository info',
    description: 'Get git remote origin URL from current working directory',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns local repository information',
    schema: {
      type: 'object',
      properties: {
        origin: {
          type: 'string',
          description: 'Original git remote origin URL',
          example: 'git@github.com:user/repo.git',
        },
        url: {
          type: 'string',
          description: 'Normalized URL without protocol',
          example: 'github.com/user/repo',
        },
        localPath: {
          type: 'string',
          description: 'Local directory path of the git repository',
          example: '/home/user/projects/repo',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Not a git repository or no remote origin found',
  })
  async getLocalRepo(): Promise<V2Repo.RepoInfo> {
    return await this.reposService.getLocalRepo();
  }
}
