import { Controller, Get, Post, Delete, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReposService } from './repos.service';
import { V2Repo } from '@shared/index';

@ApiTags('V2 Repos')
@Controller('v2/repos')
export class ReposController {
  constructor(private readonly reposService: ReposService) {}

  @Get()
  @ApiOperation({ summary: 'Get all repos' })
  @ApiResponse({ status: 200, description: 'Returns list of repos' })
  async getRepos(): Promise<V2Repo.ReposListResponse> {
    const repos = await this.reposService.getReposList();
    return { repos };
  }

  @Post()
  @ApiOperation({ summary: 'Add a new repo' })
  @ApiResponse({ status: 201, description: 'Repo added successfully' })
  async addRepo(@Body('path') path: string): Promise<V2Repo.ReposListResponse> {
    const repos = await this.reposService.addRepo(path);
    return { repos };
  }

  @Delete()
  @ApiOperation({ summary: 'Remove a repo' })
  @ApiResponse({ status: 200, description: 'Repo removed successfully' })
  async removeRepo(@Body('path') path: string): Promise<V2Repo.ReposListResponse> {
    const repos = await this.reposService.removeRepo(path);
    return { repos };
  }
}
