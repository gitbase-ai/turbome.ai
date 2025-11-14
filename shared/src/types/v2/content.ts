/**
 * V2 Content Types
 */

// Update Frontmatter Types
export interface V2UpdateFrontmatterRequest {
  frontmatterUpdates: Record<string, any>;
  commitMessage: string;
  authorName?: string;
  authorEmail?: string;
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
  path: string;
  frontmatterKeys: string[];
  commitMessage: string;
  authorName?: string;
  authorEmail?: string;
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
