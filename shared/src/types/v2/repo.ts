/**
 * V2 Repository Types
 */

export interface RepoInfo {
  /**
   * Original git remote origin URL (raw value from git config)
   */
  origin: string;

  /**
   * Normalized URL without protocol, compatible with both HTTPS and SSH
   * Example: "github.com/user/repo"
   */
  url: string;

  /**
   * Local directory path of the git repository
   * Example: "/home/user/projects/repo"
   */
  localPath: string;
}

export interface ReposListResponse {
  repos: RepoInfo[];
}

export interface RepoResponse {
  origin: string;
  url: string;
  localPath: string;
}
