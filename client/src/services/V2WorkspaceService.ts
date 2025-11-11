import { V2Workspace } from '@shared/index';

/**
 * Workspace UI File metadata
 */
export interface WorkspaceUIFile {
  filePath: string;
  open: boolean;
  draft?: string; // Draft content for the file (to be implemented)
}

/**
 * Workspace UI State stored in localStorage
 */
export interface WorkspaceUIState {
  workspaces: Record<string, boolean>; // workspace name -> selected state
  files: Record<string, WorkspaceUIFile[]>; // workspace name -> files in that workspace
}

/**
 * V2 Workspace Service
 * Handles all API calls related to workspace management
 * Also manages workspace UI state in localStorage (per repo)
 */
export class V2WorkspaceService {
  private static readonly BASE_URL = '/api/v2';
  private static readonly STORAGE_KEY_PREFIX = 'workspace-ui-state';

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

  /**
   * Get storage key for a specific repo
   * @param repoUrl Repo URL in format "domain/owner/repo"
   * @returns Storage key
   */
  private static getStorageKey(repoUrl: string): string {
    return `${this.STORAGE_KEY_PREFIX}:${repoUrl}`;
  }

  /**
   * Load workspace UI state from localStorage for a specific repo
   * @param repoUrl Repo URL in format "domain/owner/repo"
   * @returns WorkspaceUIState or null if not found
   */
  static loadUIState(repoUrl: string): WorkspaceUIState | null {
    if (typeof window === 'undefined') return null;

    try {
      const saved = localStorage.getItem(this.getStorageKey(repoUrl));
      if (saved) {
        return JSON.parse(saved) as WorkspaceUIState;
      }
    } catch (error) {
      console.error('Failed to load workspace UI state:', error);
    }

    return null;
  }

  /**
   * Save workspace UI state to localStorage for a specific repo
   * @param repoUrl Repo URL in format "domain/owner/repo"
   * @param state The state to save
   */
  static saveUIState(repoUrl: string, state: WorkspaceUIState): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.getStorageKey(repoUrl), JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save workspace UI state:', error);
    }
  }

  /**
   * Get all workspace selection states for a repo
   * @param repoUrl Repo URL in format "domain/owner/repo"
   * @returns Record of workspace name to selected state
   */
  static getWorkspaces(repoUrl: string): Record<string, boolean> {
    const state = this.loadUIState(repoUrl);
    return state?.workspaces || {};
  }

  /**
   * Get selected workspace names for a repo
   * @param repoUrl Repo URL in format "domain/owner/repo"
   * @returns Array of selected workspace names
   */
  static getSelectedWorkspaces(repoUrl: string): string[] {
    const workspaces = this.getWorkspaces(repoUrl);
    return Object.entries(workspaces)
      .filter(([, selected]) => selected)
      .map(([name]) => name);
  }

  /**
   * Set workspace selection state for a repo
   * @param repoUrl Repo URL in format "domain/owner/repo"
   * @param workspaceName Workspace name
   * @param selected Whether the workspace is selected
   */
  static setWorkspaceSelected(repoUrl: string, workspaceName: string, selected: boolean): void {
    const state = this.loadUIState(repoUrl) || { workspaces: {}, files: {} };
    state.workspaces[workspaceName] = selected;
    this.saveUIState(repoUrl, state);
  }

  /**
   * Set multiple workspace selection states for a repo
   * @param repoUrl Repo URL in format "domain/owner/repo"
   * @param workspaces Record of workspace name to selected state
   */
  static setWorkspaces(repoUrl: string, workspaces: Record<string, boolean>): void {
    const state = this.loadUIState(repoUrl) || { workspaces: {}, files: {} };
    state.workspaces = workspaces;
    this.saveUIState(repoUrl, state);
  }

  /**
   * Get files for a specific workspace in a repo
   * @param repoUrl Repo URL in format "domain/owner/repo"
   * @param workspaceName Workspace name
   * @returns Array of WorkspaceUIFile
   */
  static getWorkspaceFiles(repoUrl: string, workspaceName: string): WorkspaceUIFile[] {
    const state = this.loadUIState(repoUrl);
    return state?.files[workspaceName] || [];
  }

  /**
   * Get all files for all workspaces in a repo
   * @param repoUrl Repo URL in format "domain/owner/repo"
   * @returns Record of workspace name to files
   */
  static getAllFiles(repoUrl: string): Record<string, WorkspaceUIFile[]> {
    const state = this.loadUIState(repoUrl);
    return state?.files || {};
  }

  /**
   * Set files for a specific workspace in a repo
   * @param repoUrl Repo URL in format "domain/owner/repo"
   * @param workspaceName Workspace name
   * @param files Array of WorkspaceUIFile
   */
  static setWorkspaceFiles(repoUrl: string, workspaceName: string, files: WorkspaceUIFile[]): void {
    const state = this.loadUIState(repoUrl) || { workspaces: {}, files: {} };
    state.files[workspaceName] = files;
    this.saveUIState(repoUrl, state);
  }

  /**
   * Toggle file open state for a workspace in a repo
   * @param repoUrl Repo URL in format "domain/owner/repo"
   * @param workspaceName Workspace name
   * @param filePath File path
   * @param open Whether the file is open
   */
  static setFileOpen(repoUrl: string, workspaceName: string, filePath: string, open: boolean): void {
    const files = this.getWorkspaceFiles(repoUrl, workspaceName);
    const existingFile = files.find(f => f.filePath === filePath);

    if (existingFile) {
      existingFile.open = open;
    } else {
      files.push({ filePath, open, draft: undefined });
    }

    this.setWorkspaceFiles(repoUrl, workspaceName, files);
  }

  /**
   * Get open files for a specific workspace in a repo
   * @param repoUrl Repo URL in format "domain/owner/repo"
   * @param workspaceName Workspace name
   * @returns Array of open file paths
   */
  static getOpenFiles(repoUrl: string, workspaceName: string): string[] {
    const files = this.getWorkspaceFiles(repoUrl, workspaceName);
    return files.filter(f => f.open).map(f => f.filePath);
  }

  /**
   * Set draft content for a file in a workspace
   * @param repoUrl Repo URL in format "domain/owner/repo"
   * @param workspaceName Workspace name
   * @param filePath File path
   * @param draft Draft content
   */
  static setFileDraft(repoUrl: string, workspaceName: string, filePath: string, draft: string | undefined): void {
    const files = this.getWorkspaceFiles(repoUrl, workspaceName);
    const existingFile = files.find(f => f.filePath === filePath);

    if (existingFile) {
      existingFile.draft = draft;
    } else {
      files.push({ filePath, open: false, draft });
    }

    this.setWorkspaceFiles(repoUrl, workspaceName, files);
  }

  /**
   * Clear workspace UI state from localStorage for a specific repo
   * @param repoUrl Repo URL in format "domain/owner/repo"
   */
  static clearUIState(repoUrl: string): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.getStorageKey(repoUrl));
    } catch (error) {
      console.error('Failed to clear workspace UI state:', error);
    }
  }
}
