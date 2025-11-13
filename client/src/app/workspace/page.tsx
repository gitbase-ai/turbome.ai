"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { MultiSelectTabs } from "./multi-select-tabs"
import { V2WorkspaceService } from "@/services/V2WorkspaceService"
import { V2RepoService } from "@/services/V2RepoService"
import { V2Workspace } from "@shared/index"
import { Skeleton } from "@/components/ui/skeleton"

function WorkspaceSkeleton() {
  return (
    <div className="space-y-4">
      {/* Tab list skeleton */}
      <div className="flex items-center gap-1 rounded-lg bg-muted text-muted-foreground p-[3px]">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Content skeleton - simulating 3 cards */}
      <div className="grid gap-4 items-start" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-6 text-card-foreground shadow space-y-4">
            {/* Card header */}
            <Skeleton className="h-7 w-40" />

            {/* Accordion items */}
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Page() {
  const [workspaces, setWorkspaces] = useState<V2Workspace.V2WorkspaceGroup[]>([])
  const [repoUrl, setRepoUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Get current repo first
        const currentRepo = await V2RepoService.getCurrentRepo()
        setRepoUrl(currentRepo.url)

        // Parse repo URL (format: domain/owner/repo)
        const urlParts = currentRepo.url.split('/')
        if (urlParts.length !== 3) {
          throw new Error('Invalid repo URL format')
        }

        const [domain, owner, repo] = urlParts

        // Fetch workspaces for this repo
        const response = await V2WorkspaceService.getWorkspacesByRepoUrl(
          domain,
          owner,
          repo,
          { limit: 100 }
        )

        if (response.success && response.data.workspaces) {
          setWorkspaces(response.data.workspaces)
        } else {
          setError(response.message || 'Failed to fetch workspaces')
        }
      } catch (err) {
        console.error('Error fetching workspaces:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkspaces()

    // Listen for workspace file added event from page-header
    const handleWorkspaceFileAdded = (event: Event) => {
      const customEvent = event as CustomEvent
      const { workspaceName, filePath } = customEvent.detail
      console.log(`File ${filePath} added to workspace ${workspaceName}, refreshing...`)

      // Refetch workspaces to get updated data
      fetchWorkspaces()
    }

    window.addEventListener('workspace-file-added', handleWorkspaceFileAdded)

    return () => {
      window.removeEventListener('workspace-file-added', handleWorkspaceFileAdded)
    }
  }, [])

  const handleSelectionChange = (selectedIds: string[]) => {
    console.log("Selected workspaces:", selectedIds)
  }

  return (
    <>
      <PageHeader currentPage="Workspace" />
      <div className="flex flex-1 flex-col gap-4 p-4">
        {isLoading ? (
          <WorkspaceSkeleton />
        ) : error ? (
          <div className="flex items-center justify-center p-8 animate-in fade-in duration-300">
            <div className="text-destructive">Error: {error}</div>
          </div>
        ) : workspaces.length === 0 ? (
          <div className="flex items-center justify-center p-8 animate-in fade-in duration-300">
            <div className="text-muted-foreground">No workspaces found</div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <MultiSelectTabs
              repoUrl={repoUrl}
              workspaces={workspaces}
              defaultSelected={workspaces[0] ? [workspaces[0].workspace] : []}
              maxSelected={4}
              onSelectionChange={handleSelectionChange}
            />
          </div>
        )}
      </div>
    </>
  )
}
