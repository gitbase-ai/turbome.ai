import { V2Repo } from '@shared/index';

/**
 * V2 Repository Service
 * Handles all API calls related to repository management
 */
export class V2RepoService {
  private static readonly BASE_URL = '/api/v2';
  private static currentRepoCache: V2Repo.V2RepoInfo | null = null;
  private static reposListCache: V2Repo.V2ReposListResponse | null = null;

  /**
   * Get current active repository from config (with cache)
   */
  static async getCurrentRepo(forceRefresh = false): Promise<V2Repo.V2RepoInfo> {
    // 如果有缓存且不强制刷新，直接返回缓存
    if (!forceRefresh && this.currentRepoCache) {
      return this.currentRepoCache;
    }

    const response = await fetch(`${this.BASE_URL}/repo`);
    if (!response.ok) {
      throw new Error('Failed to fetch current repository');
    }
    const data = await response.json();

    // 缓存结果
    this.currentRepoCache = data;
    return data;
  }

  /**
   * Clear current repo cache
   */
  static clearCurrentRepoCache(): void {
    this.currentRepoCache = null;
  }

  /**
   * Get local repository info from current working directory
   */
  static async getLocalRepo(): Promise<V2Repo.V2RepoInfo> {
    const response = await fetch(`${this.BASE_URL}/repo/local`);
    if (!response.ok) {
      throw new Error('Failed to fetch local repository');
    }
    return await response.json();
  }

  /**
   * Get all repositories from config (with cache)
   */
  static async getReposList(forceRefresh = false): Promise<V2Repo.V2ReposListResponse> {
    // 如果有缓存且不强制刷新，直接返回缓存
    if (!forceRefresh && this.reposListCache) {
      return this.reposListCache;
    }

    const response = await fetch(`${this.BASE_URL}/repos`);
    if (!response.ok) {
      throw new Error('Failed to fetch repositories list');
    }
    const data = await response.json();

    // 缓存结果
    this.reposListCache = data;
    return data;
  }

  /**
   * Clear repos list cache
   */
  static clearReposListCache(): void {
    this.reposListCache = null;
  }

  /**
   * Add a new repository to config
   */
  static async addRepo(path: string): Promise<V2Repo.V2ReposListResponse> {
    const response = await fetch(`${this.BASE_URL}/repos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path }),
    });
    if (!response.ok) {
      throw new Error('Failed to add repository');
    }
    const data = await response.json();

    // 清除缓存，因为列表已更新
    this.clearReposListCache();
    return data;
  }

  /**
   * Remove a repository from config
   */
  static async removeRepo(path: string): Promise<V2Repo.V2ReposListResponse> {
    const response = await fetch(`${this.BASE_URL}/repos`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path }),
    });
    if (!response.ok) {
      throw new Error('Failed to remove repository');
    }
    const data = await response.json();

    // 清除缓存，因为列表已更新
    this.clearReposListCache();
    return data;
  }

  /**
   * Clear all caches
   */
  static clearAllCaches(): void {
    this.currentRepoCache = null;
    this.reposListCache = null;
  }
}
