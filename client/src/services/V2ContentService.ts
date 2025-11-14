import { V2Content } from '@shared/index';

/**
 * V2 Content Service
 * Handles all API calls related to content management (markdown, frontmatter, etc.)
 */
export class V2ContentService {
  private static readonly BASE_URL = '/api/v2';

  /**
   * Get file content
   * @param domain - Git hosting domain (e.g., github.com)
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param path - File path within repository
   * @returns Content response
   */
  static async getFileContent(
    domain: string,
    owner: string,
    repo: string,
    path: string
  ): Promise<V2Content.V2GetContentResponse> {
    const url = `${this.BASE_URL}/repos/${domain}/${owner}/${repo}/contents/${path}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch file content');
    }
    return await response.json();
  }

  /**
   * Update frontmatter in a markdown file
   */
  static async updateFrontmatter(
    domain: string,
    owner: string,
    repo: string,
    filePath: string,
    request: {
      frontmatterUpdates: Record<string, unknown>;
      commitMessage: string;
      authorName?: string;
      authorEmail?: string;
    }
  ): Promise<V2Content.V2UpdateFrontmatterResponse> {
    const url = `${this.BASE_URL}/repos/${domain}/${owner}/${repo}/frontmatters/${filePath}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to update frontmatter');
    }

    return await response.json();
  }

  /**
   * Delete frontmatter from a markdown file
   */
  static async deleteFrontmatter(
    domain: string,
    owner: string,
    repo: string,
    filePath: string,
    request: {
      frontmatterKeys: string[];
      commitMessage: string;
      authorName?: string;
      authorEmail?: string;
    }
  ): Promise<V2Content.V2DeleteFrontmatterResponse> {
    const url = `${this.BASE_URL}/repos/${domain}/${owner}/${repo}/frontmatters/${filePath}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to delete frontmatter');
    }

    return await response.json();
  }
}
