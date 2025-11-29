"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Search, File, FileText, Plus } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { V2SearchService } from "@/services/V2SearchService"
import { V2RepoService } from "@/services/V2RepoService"
import { V2ContentService } from "@/services/V2ContentService"
import { V2Search } from "@shared/index"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useWorkspaceStore } from "@/stores/workspaceStore"

interface PageHeaderProps {
  breadcrumbs?: { label: string; href?: string }[]
  currentPage: string
}

export function PageHeader({ breadcrumbs = [], currentPage }: PageHeaderProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<V2Search.V2SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [repoName, setRepoName] = useState<string>("TurboMe")
  const [fileWorkspaceMap, setFileWorkspaceMap] = useState<Record<string, string | null>>({}) // filePath -> workspace name
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Get workspace data from Zustand store
  const getFileWorkspace = useWorkspaceStore(state => state.getFileWorkspace)
  const getWorkspaceNames = useWorkspaceStore(state => state.getWorkspaceNames)
  const workspaces = getWorkspaceNames()

  // Handle click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  // Load repo name
  useEffect(() => {
    const loadRepoName = async () => {
      try {
        const currentRepo = await V2RepoService.getCurrentRepo()
        const url = currentRepo.url

        // Extract repo name from URL (same logic as repository-switcher)
        const parts = url.split('/')
        const name = parts[parts.length - 1] || url
        setRepoName(name)
      } catch (error) {
        console.error('Failed to load repo name:', error)
      }
    }
    loadRepoName()
  }, [])

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim() || !open) {
      setSearchResults([])
      return
    }

    const delayTimer = setTimeout(async () => {
      setIsSearching(true)
      try {
        // Get current repo
        const currentRepo = await V2RepoService.getCurrentRepo()
        const urlParts = currentRepo.url.split('/')

        if (urlParts.length === 3) {
          const [domain, owner, repo] = urlParts

          // Perform search
          const response = await V2SearchService.search(domain, owner, repo, {
            q: searchQuery,
            type: 'both',
            limit: 10,
            includeHidden: false
          })

          if (response.success) {
            setSearchResults(response.data.results)
          }
        }
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(delayTimer)
  }, [searchQuery, open])

  // Check which workspace each search result file belongs to
  useEffect(() => {
    if (searchResults.length === 0) {
      setFileWorkspaceMap({})
      return
    }

    const map: Record<string, string | null> = {}
    searchResults.forEach(result => {
      const workspace = getFileWorkspace(result.path)
      map[result.path] = workspace
    })
    setFileWorkspaceMap(map)
  }, [searchResults, getFileWorkspace])

  const handleAddToWorkspace = async (filePath: string, workspaceName: string) => {
    try {
      const currentRepo = await V2RepoService.getCurrentRepo()
      const urlParts = currentRepo.url.split('/')

      if (urlParts.length === 3) {
        const [domain, owner, repo] = urlParts

        await V2ContentService.updateFrontmatter(domain, owner, repo, filePath, {
          frontmatterUpdates: { workspace: workspaceName },
          commitMessage: {
            message: `Add ${filePath} to workspace ${workspaceName}`
          }
        })

        // Dispatch custom event to notify workspace page to refresh
        window.dispatchEvent(new CustomEvent('workspace-file-added', {
          detail: { workspaceName, filePath, repoUrl: currentRepo.url }
        }))

        // Update local state to show the badge immediately
        setFileWorkspaceMap(prev => ({
          ...prev,
          [filePath]: workspaceName
        }))

        // Show success feedback (you can add a toast notification here if needed)
        console.log(`Successfully added ${filePath} to workspace ${workspaceName}`)
      }
    } catch (error) {
      console.error('Failed to add file to workspace:', error)
    }
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
      <div className="flex items-center gap-2 px-4 flex-1">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/">
                {repoName}
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs.map((item, index) => (
              <>
                <BreadcrumbSeparator key={`sep-${index}`} className="hidden md:block" />
                <BreadcrumbItem key={index} className="hidden md:block">
                  {item.href ? (
                    <BreadcrumbLink href={item.href}>
                      {item.label}
                    </BreadcrumbLink>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </BreadcrumbItem>
              </>
            ))}
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{currentPage}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Command Search Dropdown */}
      <div className="flex items-center gap-2 px-4 relative">
        <div className="relative" ref={searchContainerRef}>
          {!open && (
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all w-auto"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">Search files...</span>
              <kbd className="hidden md:inline pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
          )}

          {open && (
            <div className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm transition-all w-[600px]">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="flex-1 bg-transparent outline-none text-foreground"
              />
            </div>
          )}

          {open && (
            <div className="absolute top-full right-0 mt-2 w-[600px] rounded-lg border bg-popover shadow-md z-50">
              <Command className="rounded-lg border-0">
                <CommandList>
                  {isSearching ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Searching...
                    </div>
                  ) : searchResults.length === 0 && searchQuery.trim() ? (
                    <CommandEmpty>No results found.</CommandEmpty>
                  ) : searchResults.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Type to search files and content...
                    </div>
                  ) : (
                    <>
                      {/* File name matches */}
                      {searchResults.filter(r => r.type === 'file').length > 0 && (
                        <CommandGroup heading="Files">
                          {searchResults
                            .filter(r => r.type === 'file')
                            .map((result, index) => (
                              <div key={`file-${index}`} className="relative group">
                                <CommandItem className="cursor-default">
                                  <File className="mr-2 h-4 w-4 text-muted-foreground" />
                                  <div className="flex flex-col flex-1 overflow-hidden">
                                    <span className="font-medium truncate">{result.filename}</span>
                                    <span className="text-xs text-muted-foreground truncate">
                                      {result.path}
                                    </span>
                                  </div>
                                </CommandItem>
                                {/* Show workspace badge if file is in a workspace, otherwise show add buttons on hover */}
                                {fileWorkspaceMap[result.path] ? (
                                  <div className="absolute bottom-2 right-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {fileWorkspaceMap[result.path]}
                                    </Badge>
                                  </div>
                                ) : (
                                  <div className="absolute bottom-2 right-2 hidden group-hover:flex gap-1 flex-wrap max-w-[50%]">
                                    {workspaces.map(wsName => (
                                      <Button
                                        key={wsName}
                                        size="sm"
                                        variant="outline"
                                        className="h-6 text-xs bg-background"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleAddToWorkspace(result.path, wsName)
                                        }}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        {wsName}
                                      </Button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                        </CommandGroup>
                      )}

                      {/* Content matches */}
                      {searchResults.filter(r => r.type === 'content').length > 0 && (
                        <CommandGroup heading="Content">
                          {searchResults
                            .filter(r => r.type === 'content')
                            .map((result, index) => (
                              <div key={`content-${index}`} className="relative group">
                                <CommandItem className="cursor-default">
                                  <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                                  <div className="flex flex-col flex-1 overflow-hidden">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium truncate">{result.filename}</span>
                                      {result.line && (
                                        <span className="text-xs text-muted-foreground">
                                          Line {result.line}
                                        </span>
                                      )}
                                    </div>
                                    {result.matchedText && (
                                      <span className="text-xs text-muted-foreground truncate">
                                        {result.matchedText}
                                      </span>
                                    )}
                                    <span className="text-xs text-muted-foreground truncate">
                                      {result.path}
                                    </span>
                                  </div>
                                </CommandItem>
                                {/* Show workspace badge if file is in a workspace, otherwise show add buttons on hover */}
                                {fileWorkspaceMap[result.path] ? (
                                  <div className="absolute bottom-2 right-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {fileWorkspaceMap[result.path]}
                                    </Badge>
                                  </div>
                                ) : (
                                  <div className="absolute bottom-2 right-2 hidden group-hover:flex gap-1 flex-wrap max-w-[50%]">
                                    {workspaces.map(wsName => (
                                      <Button
                                        key={wsName}
                                        size="sm"
                                        variant="outline"
                                        className="h-6 text-xs bg-background"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleAddToWorkspace(result.path, wsName)
                                        }}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        {wsName}
                                      </Button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                        </CommandGroup>
                      )}
                    </>
                  )}
                </CommandList>
              </Command>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
