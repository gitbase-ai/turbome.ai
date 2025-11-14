/**
 * V2 Tree API types
 * File and directory tree structures
 */

/**
 * Tree entry type
 */
export type TreeEntryType = 'file' | 'directory';

/**
 * Tree entry (file or directory)
 */
export interface TreeEntry {
  /** Entry name (filename or directory name) */
  name: string;
  /** Full path relative to repository root */
  path: string;
  /** Entry type */
  type: TreeEntryType;
  /** File size in bytes (only for files) */
  size?: number;
  /** Children entries (only for directories) */
  children?: TreeEntry[];
}

/**
 * Tree response
 */
export interface TreeResponse {
  /** Success status */
  success: boolean;
  /** Error message if failed */
  message?: string;
  /** Tree data */
  data?: {
    /** Current path */
    path: string;
    /** Tree entries */
    entries: TreeEntry[];
  };
}

/**
 * Rename/Move request
 */
export interface RenameRequest {
  /** Old path (source) */
  oldPath: string;
  /** New path (destination) */
  newPath: string;
  /** Git commit message */
  commitMessage?: string;
  /** Git commit author name (optional) */
  authorName?: string;
  /** Git commit author email (optional) */
  authorEmail?: string;
}

/**
 * Rename/Move response
 */
export interface RenameResponse {
  /** Success status */
  success: boolean;
  /** Error message if failed */
  message?: string;
  /** Response data */
  data?: {
    /** Old path */
    oldPath: string;
    /** New path */
    newPath: string;
  };
}
