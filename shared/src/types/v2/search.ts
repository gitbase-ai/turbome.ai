// ============================================================================
// V2 Search API Types
// ============================================================================

export interface V2SearchResult {
  type: 'file' | 'content';
  path: string;
  filename: string;
  line?: number;
  content?: string;
  matchedText?: string;
  score: number;
}

export interface V2SearchResponse {
  success: boolean;
  data: {
    results: V2SearchResult[];
    totalCount: number;
    query: string;
    searchType: 'filename' | 'content' | 'both';
  };
  message?: string;
}

export interface V2SearchQuery {
  q: string; // search query
  type?: 'filename' | 'content' | 'both'; // search type
  limit?: number; // max results (default: 20)
  includeHidden?: boolean; // include hidden files (default: false)
  fileTypes?: string[]; // file extensions to include (e.g., ['js', 'ts', 'md'])
}
