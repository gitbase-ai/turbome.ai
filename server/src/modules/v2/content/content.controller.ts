import { Controller, Get, Post, Put, Delete, Body, Param, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { V2ContentService } from './content.service';
import { V2Content } from '@shared/index';

@ApiTags('V2 Content')
@Controller('v2/repos')
export class V2ContentController {
  constructor(private readonly contentService: V2ContentService) {}

  @Get(':domain/:owner/:repo/contents/:path(*)')
  @ApiOperation({
    summary: 'Get file content (V2)',
    description: 'Read file content from repository. For markdown files, parses and returns frontmatter separately from content. V2 API uses repo URL in path.',
  })
  @ApiResponse({
    status: 200,
    description: 'File content retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path relative to repository root' },
            content: { type: 'string', description: 'File content (without frontmatter for markdown files)' },
            size: { type: 'number', description: 'File size in bytes' },
            encoding: { type: 'string', description: 'File encoding (utf8)' },
            frontmatter: {
              type: 'object',
              additionalProperties: true,
              description: 'Parsed frontmatter (only for markdown files)'
            }
          }
        },
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid file path' })
  @ApiResponse({ status: 404, description: 'Repository or file not found' })
  async getFileContent(
    @Param('domain') domain: string,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('path') filePath: string,
  ): Promise<V2Content.V2GetContentResponse> {
    try {
      const repoUrl = `${domain}/${owner}/${repo}`;
      const result = await this.contentService.getFileContent(repoUrl, filePath);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while reading file content';

      if (errorMessage.includes('does not exist') || errorMessage.includes('not found')) {
        throw new NotFoundException(errorMessage);
      }

      if (errorMessage.includes('Invalid') || errorMessage.includes('not a file')) {
        throw new BadRequestException(errorMessage);
      }

      throw new InternalServerErrorException('Failed to read file content');
    }
  }

  @Post(':domain/:owner/:repo/contents/:path(*)')
  @ApiOperation({
    summary: 'Create or update file content (V2)',
    description: 'Create a new file or update existing file content. For markdown files, can include frontmatter. V2 API uses repo URL in path.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['content', 'commitMessage'],
      properties: {
        content: {
          type: 'string',
          description: 'File content (without frontmatter for markdown files)',
          example: '# Hello World\n\nThis is a markdown file.'
        },
        frontmatter: {
          type: 'object',
          additionalProperties: true,
          description: 'Frontmatter object (only for markdown files)',
          example: { title: 'My Document', author: 'John Doe' }
        },
        commitMessage: {
          type: 'object',
          description: 'Git commit information',
          required: ['message'],
          properties: {
            authorName: {
              type: 'string',
              description: 'Git commit author name (optional, uses git config if not provided)',
              example: 'John Doe'
            },
            authorEmail: {
              type: 'string',
              description: 'Git commit author email (optional, uses git config if not provided)',
              example: 'john@example.com'
            },
            message: {
              type: 'string',
              description: 'Git commit message',
              example: 'Create new document'
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'File created or updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            size: { type: 'number' },
            created: { type: 'boolean', description: 'true if file was created, false if updated' },
            lastModified: { type: 'string', format: 'date-time' }
          }
        },
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 404, description: 'Repository not found' })
  async createOrUpdateFile(
    @Param('domain') domain: string,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('path') filePath: string,
    @Body() body: V2Content.V2CreateOrUpdateFileRequest
  ): Promise<V2Content.V2CreateOrUpdateFileResponse> {
    try {
      const repoUrl = `${domain}/${owner}/${repo}`;

      if (!body.content && body.content !== '') {
        throw new BadRequestException('content is required');
      }

      if (!body.commitMessage) {
        throw new BadRequestException('commitMessage is required');
      }

      if (!body.commitMessage.message) {
        throw new BadRequestException('commitMessage must include message');
      }

      const result = await this.contentService.createOrUpdateFile(
        repoUrl,
        filePath,
        body.content,
        body.frontmatter,
        {
          commitMessage: body.commitMessage.message,
          authorName: body.commitMessage.authorName,
          authorEmail: body.commitMessage.authorEmail
        }
      );

      return {
        success: true,
        data: result,
        message: result.created
          ? `Successfully created file ${filePath}`
          : `Successfully updated file ${filePath}`
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while creating/updating file';

      if (errorMessage.includes('not found')) {
        throw new NotFoundException(errorMessage);
      }

      if (errorMessage.includes('Invalid')) {
        throw new BadRequestException(errorMessage);
      }

      throw new InternalServerErrorException('Failed to create/update file');
    }
  }

  @Put(':domain/:owner/:repo/frontmatters/:path(*)')
  @ApiOperation({
    summary: 'Update markdown frontmatter (V2)',
    description: 'Update specific frontmatter keys in a markdown file without modifying content. Performs partial updates by merging provided keys with existing frontmatter. V2 API uses repo URL in path.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['frontmatterUpdates', 'commitMessage'],
      properties: {
        frontmatterUpdates: {
          type: 'object',
          additionalProperties: true,
          description: 'Object containing key-value pairs to update in frontmatter',
          example: { status: 'published', author: 'John Doe' }
        },
        commitMessage: {
          type: 'object',
          description: 'Git commit information',
          required: ['message'],
          properties: {
            authorName: {
              type: 'string',
              description: 'Git commit author name (optional, uses git config if not provided)',
              example: 'John Doe'
            },
            authorEmail: {
              type: 'string',
              description: 'Git commit author email (optional, uses git config if not provided)',
              example: 'john@example.com'
            },
            message: {
              type: 'string',
              description: 'Git commit message',
              example: 'Update document metadata'
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Frontmatter update processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            size: { type: 'number' },
            lastModified: { type: 'string', format: 'date-time' },
            updatedKeys: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of frontmatter keys that were updated'
            },
            currentFrontmatter: {
              type: 'object',
              additionalProperties: true,
              description: 'Complete frontmatter after updates'
            }
          }
        },
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid frontmatter update data' })
  @ApiResponse({ status: 404, description: 'Repository or markdown file not found' })
  async updateFrontmatter(
    @Param('domain') domain: string,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('path') filePath: string,
    @Body() body: V2Content.V2UpdateFrontmatterRequest
  ): Promise<V2Content.V2UpdateFrontmatterResponse> {
    try {
      const repoUrl = `${domain}/${owner}/${repo}`;

      if (!body.frontmatterUpdates || typeof body.frontmatterUpdates !== 'object' || Array.isArray(body.frontmatterUpdates)) {
        throw new BadRequestException('frontmatterUpdates must be an object with key-value pairs');
      }

      if (Object.keys(body.frontmatterUpdates).length === 0) {
        throw new BadRequestException('frontmatterUpdates must contain at least one key-value pair');
      }

      if (!body.commitMessage) {
        throw new BadRequestException('commitMessage is required');
      }

      if (!body.commitMessage.message) {
        throw new BadRequestException('commitMessage must include message');
      }

      const result = await this.contentService.updateFrontmatter(
        repoUrl,
        filePath,
        body.frontmatterUpdates,
        {
          commitMessage: body.commitMessage.message,
          authorName: body.commitMessage.authorName,
          authorEmail: body.commitMessage.authorEmail
        }
      );

      return {
        success: true,
        data: result,
        message: `Successfully updated ${result.updatedKeys.length} frontmatter key(s) in ${filePath}`
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating frontmatter';

      if (errorMessage.includes('does not exist') || errorMessage.includes('not found')) {
        throw new NotFoundException(errorMessage);
      }

      if (errorMessage.includes('Invalid') || errorMessage.includes('not a markdown file')) {
        throw new BadRequestException(errorMessage);
      }

      throw new InternalServerErrorException('Failed to update frontmatter');
    }
  }

  @Delete(':domain/:owner/:repo/contents/:path(*)')
  @ApiOperation({
    summary: 'Delete file (V2)',
    description: 'Delete a file from the repository and commit the change. V2 API uses repo URL in path.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['commitMessage'],
      properties: {
        commitMessage: {
          type: 'object',
          description: 'Git commit information',
          required: ['message'],
          properties: {
            authorName: {
              type: 'string',
              description: 'Git commit author name (optional, uses git config if not provided)',
              example: 'John Doe'
            },
            authorEmail: {
              type: 'string',
              description: 'Git commit author email (optional, uses git config if not provided)',
              example: 'john@example.com'
            },
            message: {
              type: 'string',
              description: 'Git commit message',
              example: 'Delete obsolete document'
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path of deleted file' },
            deleted: { type: 'boolean', description: 'Always true for successful deletion' }
          }
        },
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 404, description: 'Repository or file not found' })
  async deleteFile(
    @Param('domain') domain: string,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('path') filePath: string,
    @Body() body: V2Content.V2DeleteFileRequest
  ): Promise<V2Content.V2DeleteFileResponse> {
    try {
      const repoUrl = `${domain}/${owner}/${repo}`;

      if (!body.commitMessage) {
        throw new BadRequestException('commitMessage is required');
      }

      if (!body.commitMessage.message) {
        throw new BadRequestException('commitMessage must include message');
      }

      const result = await this.contentService.deleteFile(
        repoUrl,
        filePath,
        {
          commitMessage: body.commitMessage.message,
          authorName: body.commitMessage.authorName,
          authorEmail: body.commitMessage.authorEmail
        }
      );

      return {
        success: true,
        data: result,
        message: `Successfully deleted file ${filePath}`
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while deleting file';

      if (errorMessage.includes('does not exist') || errorMessage.includes('not found')) {
        throw new NotFoundException(errorMessage);
      }

      if (errorMessage.includes('Invalid')) {
        throw new BadRequestException(errorMessage);
      }

      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  @Delete(':domain/:owner/:repo/frontmatters/:path(*)')
  @ApiOperation({
    summary: 'Delete markdown frontmatter (V2)',
    description: 'Delete specific frontmatter keys or all frontmatter from a markdown file. Use ["*"] to delete all frontmatter. V2 API uses repo URL in path.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['frontmatterKeys', 'commitMessage'],
      properties: {
        frontmatterKeys: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of frontmatter keys to delete. Use ["*"] to delete all.',
          example: ['status', 'draft']
        },
        commitMessage: {
          type: 'object',
          description: 'Git commit information',
          required: ['authorName', 'authorEmail', 'message'],
          properties: {
            authorName: {
              type: 'string',
              description: 'Git commit author name',
              example: 'John Doe'
            },
            authorEmail: {
              type: 'string',
              description: 'Git commit author email',
              example: 'john@example.com'
            },
            message: {
              type: 'string',
              description: 'Git commit message',
              example: 'Remove draft status from document'
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Frontmatter deletion processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            size: { type: 'number' },
            lastModified: { type: 'string', format: 'date-time' },
            deletedKeys: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of frontmatter keys that were deleted'
            },
            remainingFrontmatter: {
              type: 'object',
              additionalProperties: true,
              description: 'Remaining frontmatter after deletions'
            }
          }
        },
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid frontmatter deletion data' })
  @ApiResponse({ status: 404, description: 'Repository or markdown file not found' })
  async deleteFrontmatter(
    @Param('domain') domain: string,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('path') filePath: string,
    @Body() body: V2Content.V2DeleteFrontmatterRequest
  ): Promise<V2Content.V2DeleteFrontmatterResponse> {
    try {
      const repoUrl = `${domain}/${owner}/${repo}`;

      if (!body.frontmatterKeys || !Array.isArray(body.frontmatterKeys) || body.frontmatterKeys.length === 0) {
        throw new BadRequestException('frontmatterKeys must be a non-empty array. Use ["*"] to delete all frontmatter.');
      }

      if (!body.commitMessage) {
        throw new BadRequestException('commitMessage is required');
      }

      if (!body.commitMessage.message) {
        throw new BadRequestException('commitMessage must include message');
      }

      const result = await this.contentService.deleteFrontmatter(
        repoUrl,
        filePath,
        body.frontmatterKeys,
        {
          commitMessage: body.commitMessage.message,
          authorName: body.commitMessage.authorName,
          authorEmail: body.commitMessage.authorEmail
        }
      );

      return {
        success: true,
        data: result,
        message: `Successfully deleted ${result.deletedKeys.length} frontmatter key(s) from ${filePath}`
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while deleting frontmatter';

      if (errorMessage.includes('does not exist') || errorMessage.includes('not found')) {
        throw new NotFoundException(errorMessage);
      }

      if (errorMessage.includes('Invalid') || errorMessage.includes('not a markdown file') || errorMessage.includes('has no frontmatter')) {
        throw new BadRequestException(errorMessage);
      }

      throw new InternalServerErrorException('Failed to delete frontmatter');
    }
  }
}
