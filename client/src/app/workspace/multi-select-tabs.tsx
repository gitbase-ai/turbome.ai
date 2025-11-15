"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import {
  FileAccordion,
  FileAccordionContent,
  FileAccordionItem,
  FileAccordionTrigger,
} from "./file-accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { V2Workspace } from "@shared/index"
import { V2RepoService } from "@/services/V2RepoService"
import { V2TreeService } from "@/services/V2TreeService"
import { useWorkspaceStore } from "@/stores/workspaceStore"

interface MultiSelectTabsProps {
  repoUrl: string
  workspaces: V2Workspace.V2WorkspaceGroup[]
  defaultSelected?: string[]
  maxSelected?: number
  onSelectionChange?: (selectedIds: string[]) => void
}

export function MultiSelectTabs({
  repoUrl,
  workspaces,
  defaultSelected = [],
  maxSelected = 4,
  onSelectionChange,
}: MultiSelectTabsProps) {
  // Use Zustand store
  const {
    tabs,
    selectedTabs,
    openAccordions,
    archivingFiles,
    removingFiles,
    initializeWorkspace,
    toggleTab,
    setOpenAccordions,
    archiveFile,
    completeArchive,
    cancelArchive,
    addWorkspace,
    deleteWorkspace,
    renameFile,
  } = useWorkspaceStore()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState("")
  const [addError, setAddError] = useState<string | null>(null)

  // Store previous workspaces for deep comparison
  const prevWorkspacesRef = useRef<V2Workspace.V2WorkspaceGroup[]>([])

  // Initialize store with server data, only when workspaces actually change
  useEffect(() => {
    // Deep compare workspaces to avoid unnecessary initialization
    const hasChanged =
      workspaces.length !== prevWorkspacesRef.current.length ||
      workspaces.some((ws, index) => {
        const prevWs = prevWorkspacesRef.current[index]
        if (!prevWs) return true

        // Compare workspace name and file count
        if (ws.workspace !== prevWs.workspace || ws.count !== prevWs.count) {
          return true
        }

        // Compare files array
        if (ws.files?.length !== prevWs.files?.length) {
          return true
        }

        // Compare each file path
        return ws.files?.some((file, fileIndex) => {
          const prevFile = prevWs.files?.[fileIndex]
          return file.path !== prevFile?.path || file.filename !== prevFile?.filename
        })
      })

    if (hasChanged) {
      console.log('[MultiSelectTabs] Workspaces changed, initializing store')
      initializeWorkspace(workspaces, repoUrl, defaultSelected)
      prevWorkspacesRef.current = workspaces
    }
  }, [workspaces, repoUrl, defaultSelected, initializeWorkspace])

  // Notify parent component when selection changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedTabs)
    }
  }, [selectedTabs, onSelectionChange])

  const handleToggleTab = (tabId: string) => {
    toggleTab(tabId, maxSelected)
  }

  const handleArchive = async (filePath: string) => {
    // Start archiving animation
    archiveFile(filePath)

    try {
      // Get current repo
      const currentRepo = await V2RepoService.getCurrentRepo()

      // Parse repo URL (format: domain/owner/repo)
      const urlParts = currentRepo.url.split('/')
      if (urlParts.length !== 3) {
        throw new Error('Invalid repo URL format')
      }

      const [domain, owner, repo] = urlParts

      // Call V2 API to delete workspace frontmatter
      const { V2ContentService } = await import("@/services/V2ContentService")

      // TODO: Replace hardcoded test values with real user info
      await V2ContentService.deleteFrontmatter(
        domain,
        owner,
        repo,
        filePath,
        {
          frontmatterKeys: ['workspace'],
          commitMessage: {
            authorName: 'testname',
            authorEmail: 'testmail@a.com',
            message: `Archive ${filePath} by removing workspace`
          }
        }
      )

      console.log(`File ${filePath} archived successfully`)

      // Wait for animation to complete before removing from state
      setTimeout(() => {
        completeArchive(filePath)
      }, 300) // Match animation duration
    } catch (error) {
      console.error('Error archiving file:', error)
      alert(`Failed to archive file: ${error instanceof Error ? error.message : 'Unknown error'}`)
      cancelArchive(filePath)
    }
  }

  const handleAddWorkspace = () => {
    setAddError(null)

    // Validate workspace name
    if (!newWorkspaceName.trim()) {
      setAddError("Workspace name cannot be empty")
      return
    }

    // Check if workspace already exists
    if (tabs.some(tab => tab.id === newWorkspaceName.trim())) {
      setAddError("Workspace already exists")
      return
    }

    const newWorkspaceId = newWorkspaceName.trim()

    // Add to Zustand store (automatically persisted)
    addWorkspace(newWorkspaceId)

    // Automatically select the new workspace
    if (selectedTabs.length >= maxSelected) {
      // Remove the last selected tab if at max capacity
      const newSelection = [...selectedTabs.slice(0, -1), newWorkspaceId]
      useWorkspaceStore.setState({ selectedTabs: newSelection })
    } else {
      // Otherwise, just add it
      useWorkspaceStore.setState({ selectedTabs: [...selectedTabs, newWorkspaceId] })
    }

    // Close dialog and reset form
    setIsAddDialogOpen(false)
    setNewWorkspaceName("")
    setAddError(null)

    console.log(`Workspace "${newWorkspaceId}" created successfully and selected`)
  }

  const handleDeleteWorkspace = (workspaceId: string) => {
    // Remove from Zustand store (automatically persisted)
    deleteWorkspace(workspaceId)

    console.log(`Workspace "${workspaceId}" deleted successfully`)
  }


  const handleRename = async (oldPath: string, newPath: string) => {
    try {
      // Get current repo
      const currentRepo = await V2RepoService.getCurrentRepo()

      // Parse repo URL (format: domain/owner/repo)
      const urlParts = currentRepo.url.split('/')
      if (urlParts.length !== 3) {
        throw new Error('Invalid repo URL format')
      }

      const [domain, owner, repo] = urlParts

      // Call V2 Tree API to rename file
      const response = await V2TreeService.renameFile(domain, owner, repo, {
        oldPath,
        newPath,
        commitMessage: `Rename ${oldPath} to ${newPath}`,
      })

      if (response.success) {
        console.log(`File renamed successfully from ${oldPath} to ${newPath}`)

        // Update Zustand store (automatically persisted)
        renameFile(oldPath, newPath)

        alert(`Successfully renamed to ${newPath}`)
      } else {
        throw new Error(response.message || 'Failed to rename file')
      }
    } catch (error) {
      console.error('Error renaming file:', error)
      alert(`Failed to rename file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="space-y-4">
      {/* Multi-select Tabs with Add Workspace Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1 rounded-lg bg-muted text-muted-foreground p-[3px]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleToggleTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-50",
                selectedTabs.includes(tab.id)
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/50"
              )}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 px-1.5 text-xs"
                >
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddDialogOpen(true)}
          className="shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Workspace
        </Button>
      </div>

      {/* Content based on selected tabs */}
      <div
        className="grid gap-4 items-start"
        style={{
          gridTemplateColumns: `repeat(${selectedTabs.length}, minmax(0, 1fr))`
        }}
      >
        {selectedTabs.map((tabId) => {
          const tab = tabs.find((t) => t.id === tabId)
          const isEmpty = !tab?.files || tab.files.length === 0
          return (
            <div
              key={tabId}
              className="rounded-xl border bg-card p-6 text-card-foreground shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {tab?.label}
                  {tab?.count !== undefined && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({tab.count} files)
                    </span>
                  )}
                </h3>
                {isEmpty && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteWorkspace(tabId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <FileAccordion
                type="multiple"
                className="w-full"
                value={openAccordions}
                onValueChange={setOpenAccordions}
              >
                {tab?.files && tab.files.length > 0 ? (
                  tab.files.map((file, i) => (
                    <div
                      key={`${file.path}-${i}`}
                      className={cn(
                        "border-b last:border-b-0 transition-all duration-300",
                        removingFiles.has(file.path) && "opacity-0 scale-95 max-h-0 overflow-hidden border-b-0"
                      )}
                    >
                      <FileAccordionItem value={file.path} className="border-b-0">
                        <FileAccordionTrigger
                          onArchive={() => handleArchive(file.path)}
                          isArchiving={archivingFiles.has(file.path)}
                          onRename={handleRename}
                          filePath={file.path}
                        >
                          {file.filename}
                        </FileAccordionTrigger>
                        <FileAccordionContent
                          filePath={file.path}
                          repoUrl={repoUrl}
                        />

                      </FileAccordionItem>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground p-4">
                    No files found in this workspace
                  </div>
                )}
              </FileAccordion>
            </div>
          )
        })}
      </div>

      {/* Add Workspace Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Workspace</DialogTitle>
            <DialogDescription>
              Create a new empty workspace. You can add files to it later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                id="workspace-name"
                placeholder="Enter workspace name..."
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                autoFocus
              />
              {addError && (
                <p className="text-sm text-destructive">{addError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false)
                setNewWorkspaceName("")
                setAddError(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddWorkspace}>Create Workspace</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
