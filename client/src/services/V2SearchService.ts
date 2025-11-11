import { V2Search } from '@shared/index';

/**
 * V2 Search Service
 * Handles all API calls related to search functionality
 */
export class V2SearchService {
  private static readonly BASE_URL = '/api/v2';

  /**
   * Search files and content in a repository
   */
  static async search(
    domain: string,
    owner: string,
    repo: string,
    query: V2Search.V2SearchQuery
  ): Promise<V2Search.V2SearchResponse> {
    const url = `${this.BASE_URL}/repos/${domain}/${owner}/${repo}/search`;

    const params = new URLSearchParams();
    params.append('q', query.q);

    if (query.type) {
      params.append('type', query.type);
    }
    if (query.limit !== undefined) {
      params.append('limit', query.limit.toString());
    }
    if (query.includeHidden !== undefined) {
      params.append('includeHidden', query.includeHidden.toString());
    }
    if (query.fileTypes && query.fileTypes.length > 0) {
      params.append('fileTypes', query.fileTypes.join(','));
    }

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to perform search');
    }

    return await response.json();
  }
}
