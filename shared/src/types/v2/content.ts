/**
 * V2 Content Types
 */

// Git Commit Message
export interface GitCommitMessage {
  authorName?: string;
  authorEmail?: string;
  message: string;
}

// Update Frontmatter Types
export interface V2UpdateFrontmatterRequest {
  frontmatterUpdates: Record<string, any>;
  commitMessage: GitCommitMessage;
}

export interface V2UpdateFrontmatterResult {
  path: string;
  size: number;
  lastModified: string;
  updatedKeys: string[];
  currentFrontmatter: Record<string, any>;
}

export interface V2UpdateFrontmatterResponse {
  success: boolean;
  data: V2UpdateFrontmatterResult;
  message?: string;
}

// Delete Frontmatter Types
export interface V2DeleteFrontmatterRequest {
  frontmatterKeys: string[];
  commitMessage: GitCommitMessage;
}

export interface V2DeleteFrontmatterResult {
  path: string;
  size: number;
  lastModified: string;
  deletedKeys: string[];
  remainingFrontmatter: Record<string, any>;
}

export interface V2DeleteFrontmatterResponse {
  success: boolean;
  data: V2DeleteFrontmatterResult;
  message?: string;
}

// Get File Content Types
export interface V2GetContentResult {
  path: string;
  content: string;
  size: number;
  encoding?: string;
  frontmatter?: Record<string, any>;
}

export interface V2GetContentResponse {
  success: boolean;
  data?: V2GetContentResult;
  message?: string;
}

// Create/Update File Content Types
export interface V2CreateOrUpdateFileRequest {
  content: string;
  frontmatter?: Record<string, any>;
  commitMessage: GitCommitMessage;
}

export interface V2CreateOrUpdateFileResult {
  path: string;
  size: number;
  created: boolean; // true if created, false if updated
  lastModified: string;
}

export interface V2CreateOrUpdateFileResponse {
  success: boolean;
  data?: V2CreateOrUpdateFileResult;
  message?: string;
}

// Delete File Types
export interface V2DeleteFileRequest {
  commitMessage: GitCommitMessage;
}

export interface V2DeleteFileResult {
  path: string;
  deleted: boolean;
}

export interface V2DeleteFileResponse {
  success: boolean;
  data?: V2DeleteFileResult;
  message?: string;
}
