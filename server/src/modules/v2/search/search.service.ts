import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { V2Search } from '@shared/index';
import * as path from 'path';
import { ConfigService } from '../config/config.service';

const execAsync = promisify(exec);

@Injectable()
export class V2SearchService {
  private readonly maxResults = 20;

  constructor(private readonly configService: ConfigService) {}

  async search(
    repoUrl: string,
    query: V2Search.V2SearchQuery
  ): Promise<V2Search.V2SearchResponse> {
    try {
      const {
        q,
        type = 'both',
        limit = this.maxResults,
        includeHidden = false,
        fileTypes = []
      } = query;

      if (!q || q.trim().length === 0) {
        return {
          success: false,
          data: {
            results: [],
            totalCount: 0,
            query: q,
            searchType: type
          },
          message: 'Search query is required'
        };
      }

      // Get repository local path
      const repoLocalPath = await this.getRepoLocalPath(repoUrl);

      const results: V2Search.V2SearchResult[] = [];

      // Search by filename
      if (type === 'filename' || type === 'both') {
        const filenameResults = await this.searchByFilename(
          repoLocalPath,
          q,
          includeHidden,
          fileTypes
        );
        results.push(...filenameResults);
      }

      // Search by content
      if (type === 'content' || type === 'both') {
        const contentResults = await this.searchByContent(
          repoLocalPath,
          q,
          includeHidden,
          fileTypes
        );
        results.push(...contentResults);
      }

      // Sort by score (higher is better) and limit results
      results.sort((a, b) => b.score - a.score);
      const limitedResults = results.slice(0, limit);

      return {
        success: true,
        data: {
          results: limitedResults,
          totalCount: results.length,
          query: q,
          searchType: type
        }
      };

    } catch (error) {
      console.error('Error in V2 search:', error);
      return {
        success: false,
        data: {
          results: [],
          totalCount: 0,
          query: query.q,
          searchType: query.type || 'both'
        },
        message: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  private async getRepoLocalPath(repoUrl: string): Promise<string> {
    const repos = await this.configService.getRepos();
    const repo = repos.find(r => r.url === repoUrl);

    if (!repo) {
      throw new Error(`Repository not found: ${repoUrl}`);
    }

    return repo.localPath;
  }

  private async searchByFilename(
    repoPath: string,
    query: string,
    includeHidden: boolean,
    fileTypes: string[]
  ): Promise<V2Search.V2SearchResult[]> {
    try {
      // Build find command
      let findCommand = `find "${repoPath}" -type f`;

      // Exclude hidden files if not requested
      if (!includeHidden) {
        findCommand += ' -not -path "*/.*"';
      }

      // Add file type filters
      if (fileTypes.length > 0) {
        const typeConditions = fileTypes.map(ext => `-name "*.${ext}"`).join(' -o ');
        findCommand += ` \\( ${typeConditions} \\)`;
      }

      // Add case-insensitive name search
      findCommand += ` -iname "*${query}*"`;

      // Limit results to prevent overwhelming output
      findCommand += ' | head -50';

      const { stdout } = await execAsync(findCommand, {
        cwd: repoPath,
        timeout: 5000
      });

      const files = stdout.split('\n').filter(line => line.trim());
      const results: V2Search.V2SearchResult[] = [];

      for (const filePath of files) {
        if (!filePath) continue;

        const relativePath = path.relative(repoPath, filePath);
        const filename = path.basename(filePath);

        // Calculate relevance score based on query match
        const score = this.calculateFilenameScore(filename, query);

        results.push({
          type: 'file',
          path: relativePath,
          filename,
          score
        });
      }

      return results;

    } catch (error) {
      console.error('Error searching by filename:', error);
      return [];
    }
  }

  private async searchByContent(
    repoPath: string,
    query: string,
    includeHidden: boolean,
    fileTypes: string[]
  ): Promise<V2Search.V2SearchResult[]> {
    try {
      // Build grep command
      let grepCommand = `grep -r -n -i`;

      // Exclude hidden directories and files if not requested
      if (!includeHidden) {
        grepCommand += ' --exclude-dir=".*"';
      }

      // Add file type includes
      if (fileTypes.length > 0) {
        const includes = fileTypes.map(ext => `--include="*.${ext}"`).join(' ');
        grepCommand += ` ${includes}`;
      }

      // Add the search pattern and directory
      grepCommand += ` "${query}" "${repoPath}"`;

      // Limit results
      grepCommand += ' | head -100';

      const { stdout } = await execAsync(grepCommand, {
        cwd: repoPath,
        timeout: 10000
      });

      const lines = stdout.split('\n').filter(line => line.trim());
      const results: V2Search.V2SearchResult[] = [];

      for (const line of lines) {
        if (!line) continue;

        // Parse grep output: filename:line_number:content
        const match = line.match(/^([^:]+):(\d+):(.*)$/);
        if (!match) continue;

        const [, filePath, lineNumber, content] = match;
        const relativePath = path.relative(repoPath, filePath);
        const filename = path.basename(filePath);

        // Extract the matched text with some context
        const matchedText = this.extractMatchedText(content, query);

        // Calculate relevance score
        const score = this.calculateContentScore(content, query, filename);

        results.push({
          type: 'content',
          path: relativePath,
          filename,
          line: parseInt(lineNumber),
          content: content.trim(),
          matchedText,
          score
        });
      }

      return results;

    } catch (error) {
      console.error('Error searching by content:', error);
      return [];
    }
  }

  private calculateFilenameScore(filename: string, query: string): number {
    const lowerFilename = filename.toLowerCase();
    const lowerQuery = query.toLowerCase();

    let score = 0;

    // Exact match gets highest score
    if (lowerFilename === lowerQuery) {
      score += 100;
    }
    // Starts with query gets high score
    else if (lowerFilename.startsWith(lowerQuery)) {
      score += 80;
    }
    // Contains query gets medium score
    else if (lowerFilename.includes(lowerQuery)) {
      score += 60;
    }

    // Shorter filenames with matches score higher
    score += Math.max(0, 50 - filename.length);

    return score;
  }

  private calculateContentScore(content: string, query: string, filename: string): number {
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();

    let score = 0;

    // Count occurrences of query in content
    const matches = (lowerContent.match(new RegExp(lowerQuery, 'g')) || []).length;
    score += matches * 20;

    // Bonus for matches in filename
    if (filename.toLowerCase().includes(lowerQuery)) {
      score += 30;
    }

    // Bonus for exact word matches
    if (lowerContent.includes(` ${lowerQuery} `)) {
      score += 15;
    }

    // Penalty for very long lines
    if (content.length > 200) {
      score -= 5;
    }

    return score;
  }

  private extractMatchedText(content: string, query: string): string {
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();

    const index = lowerContent.indexOf(lowerQuery);
    if (index === -1) return content.slice(0, 100);

    // Extract with context around the match
    const start = Math.max(0, index - 30);
    const end = Math.min(content.length, index + query.length + 30);

    let result = content.slice(start, end);

    // Add ellipsis if truncated
    if (start > 0) result = '...' + result;
    if (end < content.length) result = result + '...';

    return result;
  }
}
