import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
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

  // Repository info routes - 枚举三种路径层级
  @Get(':part1/:part2/:part3')
  @ApiOperation({
    summary: 'Get repository by URL (3-part)',
    description: 'Get repository info for URL like github.com/user/repo',
  })
  async getRepo3Parts(
    @Param('part1') part1: string,
    @Param('part2') part2: string,
    @Param('part3') part3: string,
  ): Promise<V2Repo.RepoInfo> {
    const url = `${part1}/${part2}/${part3}`;
    return await this.reposService.getRepoByUrl(url);
  }

  @Get(':part1/:part2')
  @ApiOperation({
    summary: 'Get repository by URL (2-part)',
    description: 'Get repository info for URL like domain.com/repo',
  })
  async getRepo2Parts(
    @Param('part1') part1: string,
    @Param('part2') part2: string,
  ): Promise<V2Repo.RepoInfo> {
    const url = `${part1}/${part2}`;
    return await this.reposService.getRepoByUrl(url);
  }

  @Get(':part1')
  @ApiOperation({
    summary: 'Get repository by URL (1-part)',
    description: 'Get repository info for URL like localhost',
  })
  async getRepo1Part(@Param('part1') part1: string): Promise<V2Repo.RepoInfo> {
    const url = part1;
    return await this.reposService.getRepoByUrl(url);
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
