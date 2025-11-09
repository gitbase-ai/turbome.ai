import { V2Repo } from '@shared/index';

/**
 * V2 Repository Service
 * Handles all API calls related to repository management
 */
export class V2RepoService {
  private static readonly BASE_URL = '/api/v2';

  /**
   * Get current active repository from config
   */
  static async getCurrentRepo(): Promise<V2Repo.RepoInfo> {
    const response = await fetch(`${this.BASE_URL}/repo`);
    if (!response.ok) {
      throw new Error('Failed to fetch current repository');
    }
    return await response.json();
  }

  /**
   * Get local repository info from current working directory
   */
  static async getLocalRepo(): Promise<V2Repo.RepoInfo> {
    const response = await fetch(`${this.BASE_URL}/repo/local`);
    if (!response.ok) {
      throw new Error('Failed to fetch local repository');
    }
    return await response.json();
  }

  /**
   * Get all repositories from config
   */
  static async getReposList(): Promise<V2Repo.ReposListResponse> {
    const response = await fetch(`${this.BASE_URL}/repos`);
    if (!response.ok) {
      throw new Error('Failed to fetch repositories list');
    }
    return await response.json();
  }

  /**
   * Add a new repository to config
   */
  static async addRepo(path: string): Promise<V2Repo.ReposListResponse> {
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
    return await response.json();
  }

  /**
   * Remove a repository from config
   */
  static async removeRepo(path: string): Promise<V2Repo.ReposListResponse> {
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
    return await response.json();
  }
}
