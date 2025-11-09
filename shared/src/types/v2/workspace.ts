export interface V2WorkspaceFile {
  path: string;
  filename: string;
  workspace: string;
  line: number;
}

export interface V2WorkspaceGroup {
  workspace: string;
  files: V2WorkspaceFile[];
  count: number;
}

export interface V2WorkspaceQuery {
  limit?: number;
  includeHidden?: boolean;
  fileTypes?: string[];
}

export interface V2WorkspaceResponse {
  success: boolean;
  data: {
    workspaces: V2WorkspaceGroup[];
    totalWorkspaces: number;
    totalFiles: number;
  };
  message?: string;
}
