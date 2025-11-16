import { V2Tree } from '@shared/index';

/**
 * V2 Tree Service
 * Handles all API calls related to file/directory tree management
 */
export class V2TreeService {
  private static readonly BASE_URL = '/api/v2';

  /**
   * Get directory tree
   * @param domain - Git hosting domain (e.g., github.com)
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param path - Path within repository (optional)
   * @param recursive - Load subdirectories recursively (optional)
   * @returns Tree response
   */
  static async getTree(
    domain: string,
    owner: string,
    repo: string,
    path: string = '',
    recursive: boolean = false
  ): Promise<V2Tree.TreeResponse> {
    // Always add trailing slash: root -> /trees/, path -> /trees/path1/path2
    const pathSegment = path ? `/${path}` : '/';
    const url = `${this.BASE_URL}/repos/${domain}/${owner}/${repo}/trees${pathSegment}`;

    const params = new URLSearchParams();
    if (recursive) {
      params.append('recursive', 'true');
    }

    const queryString = params.toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch directory tree');
    }
    return await response.json();
  }

  /**
   * Rename/move a file or directory
   * @param domain - Git hosting domain (e.g., github.com)
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param request - Rename request data
   * @returns Rename response
   */
  static async renameFile(
    domain: string,
    owner: string,
    repo: string,
    request: V2Tree.RenameRequest
  ): Promise<V2Tree.RenameResponse> {
    const url = `${this.BASE_URL}/repos/${domain}/${owner}/${repo}/trees`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to rename file/directory');
    }

    return await response.json();
  }
}
