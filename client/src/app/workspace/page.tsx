"use client"

import { useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { MultiSelectTabs } from "./multi-select-tabs"
import { V2RepoService } from "@/services/V2RepoService"
import { Skeleton } from "@/components/ui/skeleton"
import { useWorkspaceStore } from "@/stores/workspaceStore"

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
  // Use Zustand store for all state
  const serverWorkspaces = useWorkspaceStore(state => state.serverWorkspaces)
  const isLoading = useWorkspaceStore(state => state.isLoadingWorkspaces)
  const error = useWorkspaceStore(state => state.workspacesError)
  const currentRepoUrl = useWorkspaceStore(state => state.currentRepoUrl)
  const fetchWorkspaces = useWorkspaceStore(state => state.fetchWorkspaces)

  useEffect(() => {
    const initializeWorkspaces = async () => {
      try {
        // Get current repo first
        const currentRepo = await V2RepoService.getCurrentRepo()

        // Fetch workspaces from server (this will also initialize tabs)
        await fetchWorkspaces(currentRepo.url)
      } catch (err) {
        console.error('Error initializing workspaces:', err)
      }
    }

    initializeWorkspaces()
  }, [fetchWorkspaces])

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
        ) : serverWorkspaces.length === 0 ? (
          <div className="flex items-center justify-center p-8 animate-in fade-in duration-300">
            <div className="text-muted-foreground">No workspaces found</div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <MultiSelectTabs
              repoUrl={currentRepoUrl}
              workspaces={serverWorkspaces}
              defaultSelected={serverWorkspaces[0] ? [serverWorkspaces[0].workspace] : []}
              maxSelected={4}
              onSelectionChange={handleSelectionChange}
            />
          </div>
        )}
      </div>
    </>
  )
}
