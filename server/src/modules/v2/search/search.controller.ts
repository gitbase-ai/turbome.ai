import { Controller, Get, Query, Param, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { V2SearchService } from './search.service';
import { V2Search } from '@shared/index';

@ApiTags('V2 Search')
@Controller('v2/repos')
export class V2SearchController {
  constructor(private readonly v2SearchService: V2SearchService) {}

  @Get(':domain/:owner/:repo/search')
  @ApiOperation({
    summary: 'Search files and content (V2)',
    description: 'Search for files by name or content in a specific repository using find and grep commands. V2 API uses camelCase and repo-based routing.'
  })
  @ApiParam({ name: 'domain', description: 'Git domain (e.g., github.com)', type: String })
  @ApiParam({ name: 'owner', description: 'Repository owner', type: String })
  @ApiParam({ name: 'repo', description: 'Repository name', type: String })
  @ApiQuery({ name: 'q', description: 'Search query (required)', required: true, type: String })
  @ApiQuery({ name: 'type', description: 'Search type: filename, content, or both (default: both)', required: false, enum: ['filename', 'content', 'both'] })
  @ApiQuery({ name: 'limit', description: 'Maximum number of results (default: 20, max: 50)', required: false, type: Number })
  @ApiQuery({ name: 'includeHidden', description: 'Include hidden files and directories (default: false)', required: false, type: Boolean })
  @ApiQuery({ name: 'fileTypes', description: 'Comma-separated file extensions to include (e.g., "js,ts,md")', required: false, type: String })
  @SwaggerApiResponse({
    status: 200,
    description: 'Search completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['file', 'content'] },
                  path: { type: 'string' },
                  filename: { type: 'string' },
                  line: { type: 'number' },
                  content: { type: 'string' },
                  matchedText: { type: 'string' },
                  score: { type: 'number' }
                }
              }
            },
            totalCount: { type: 'number' },
            query: { type: 'string' },
            searchType: { type: 'string' }
          }
        },
        message: { type: 'string' }
      }
    }
  })
  @SwaggerApiResponse({ status: 400, description: 'Invalid search parameters' })
  async search(
    @Param('domain') domain: string,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Query('q') q?: string,
    @Query('type') type?: 'filename' | 'content' | 'both',
    @Query('limit') limit?: string,
    @Query('includeHidden') includeHidden?: string,
    @Query('fileTypes') fileTypes?: string
  ): Promise<V2Search.V2SearchResponse> {
    try {
      // Validate required parameters
      if (!q || q.trim().length === 0) {
        throw new BadRequestException('Search query (q) is required');
      }

      // Parse and validate limit
      const parsedLimit = limit ? parseInt(limit, 10) : 20;
      if (parsedLimit < 1 || parsedLimit > 50) {
        throw new BadRequestException('Limit must be between 1 and 50');
      }

      // Parse includeHidden
      const parsedIncludeHidden = includeHidden === 'true';

      // Parse fileTypes
      const parsedFileTypes = fileTypes ?
        fileTypes.split(',').map(ext => ext.trim()).filter(ext => ext.length > 0) :
        [];

      // Validate search type
      if (type && !['filename', 'content', 'both'].includes(type)) {
        throw new BadRequestException('Search type must be one of: filename, content, both');
      }

      const searchQuery: V2Search.V2SearchQuery = {
        q: q.trim(),
        type: type || 'both',
        limit: parsedLimit,
        includeHidden: parsedIncludeHidden,
        fileTypes: parsedFileTypes
      };

      // Build repo URL
      const repoUrl = `${domain}/${owner}/${repo}`;

      return await this.v2SearchService.search(repoUrl, searchQuery);

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Error in V2 search controller:', error);
      throw new BadRequestException('Failed to perform search');
    }
  }
}
