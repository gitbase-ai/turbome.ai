import { V2Workspace } from '@shared/index';

/**
 * V2 Workspace Service
 * Handles all API calls related to workspace management
 */
export class V2WorkspaceService {
  private static readonly BASE_URL = '/api/v2';

  /**
   * Get workspaces for a specific repository
   */
  static async getWorkspacesByRepoUrl(
    domain: string,
    owner: string,
    repo: string,
    query?: V2Workspace.V2WorkspaceQuery
  ): Promise<V2Workspace.V2WorkspaceResponse> {
    const url = `${this.BASE_URL}/repos/${domain}/${owner}/${repo}/workspaces`;

    // Build query parameters
    const params = new URLSearchParams();
    if (query?.limit) {
      params.append('limit', query.limit.toString());
    }
    if (query?.includeHidden !== undefined) {
      params.append('includeHidden', query.includeHidden.toString());
    }
    if (query?.fileTypes && query.fileTypes.length > 0) {
      params.append('fileTypes', query.fileTypes.join(','));
    }

    const queryString = params.toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch workspaces');
    }
    return await response.json();
  }
}
