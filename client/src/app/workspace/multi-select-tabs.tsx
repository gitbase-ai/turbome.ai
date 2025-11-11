"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
  FileAccordion,
  FileAccordionContent,
  FileAccordionItem,
  FileAccordionTrigger,
} from "./file-accordion"
import { Badge } from "@/components/ui/badge"
import { V2Workspace } from "@shared/index"
import { V2ContentService } from "@/services/V2ContentService"
import { V2RepoService } from "@/services/V2RepoService"
import { V2WorkspaceService } from "@/services/V2WorkspaceService"

interface Tab {
  id: string
  label: string
  files?: V2Workspace.V2WorkspaceFile[]
  count?: number
}

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
  // Convert workspaces to tabs format and store in state
  const [tabs, setTabs] = useState<Tab[]>(
    workspaces.map((ws) => ({
      id: ws.workspace,
      label: ws.workspace,
      files: ws.files,
      count: ws.count,
    }))
  )

  // Load saved state from V2WorkspaceService
  const [selectedTabs, setSelectedTabs] = useState<string[]>(() => {
    if (typeof window === 'undefined' || !repoUrl) return defaultSelected.length > 0 ? defaultSelected : [tabs[0]?.id].filter(Boolean)

    const savedWorkspaces = V2WorkspaceService.getSelectedWorkspaces(repoUrl)
    if (savedWorkspaces.length > 0) {
      // Validate that saved workspaces still exist
      const validWorkspaces = savedWorkspaces.filter(workspaceId =>
        tabs.some(tab => tab.id === workspaceId)
      )
      if (validWorkspaces.length > 0) {
        return validWorkspaces
      }
    }

    return defaultSelected.length > 0 ? defaultSelected : [tabs[0]?.id].filter(Boolean)
  })

  // Load open files for each workspace
  const [openAccordions, setOpenAccordions] = useState<string[]>(() => {
    if (typeof window === 'undefined' || !repoUrl) return []

    // Collect all open files from all workspaces
    const allOpenFiles: string[] = []
    tabs.forEach(tab => {
      const openFiles = V2WorkspaceService.getOpenFiles(repoUrl, tab.id)
      allOpenFiles.push(...openFiles)
    })

    return allOpenFiles
  })

  const [archivingFiles, setArchivingFiles] = useState<Set<string>>(new Set())
  const [removingFiles, setRemovingFiles] = useState<Set<string>>(new Set())

  // Save workspace selection state whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined' || !repoUrl) return

    // Build workspaces object from selectedTabs and tabs
    const workspacesState: Record<string, boolean> = {}
    tabs.forEach(tab => {
      workspacesState[tab.id] = selectedTabs.includes(tab.id)
    })

    V2WorkspaceService.setWorkspaces(repoUrl, workspacesState)
  }, [selectedTabs, tabs, repoUrl])

  // Save file open states whenever they change
  useEffect(() => {
    if (typeof window === 'undefined' || !repoUrl) return

    // Update file open states for each workspace
    tabs.forEach(tab => {
      const files = tab.files || []
      const workspaceFiles = files.map(file => ({
        filePath: file.path,
        open: openAccordions.includes(file.path),
        draft: undefined // Draft support to be implemented later
      }))

      V2WorkspaceService.setWorkspaceFiles(repoUrl, tab.id, workspaceFiles)
    })
  }, [openAccordions, tabs, repoUrl])

  const toggleTab = (tabId: string) => {
    setSelectedTabs((prev) => {
      let newSelection: string[]

      if (prev.includes(tabId)) {
        // 至少保留一个选中项
        if (prev.length === 1) return prev
        newSelection = prev.filter((id) => id !== tabId)
      } else {
        // 检查是否超过最大选中数量
        if (prev.length >= maxSelected) {
          return prev
        }
        newSelection = [...prev, tabId]
      }

      // 回调通知父组件
      if (onSelectionChange) {
        onSelectionChange(newSelection)
      }

      return newSelection
    })
  }

  const handleArchive = async (filePath: string) => {
    setArchivingFiles(prev => new Set(prev).add(filePath))

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
      await V2ContentService.deleteFrontmatter(
        domain,
        owner,
        repo,
        filePath,
        {
          frontmatterKeys: ['workspace'],
          commitMessage: `Archive ${filePath} by removing workspace`
        }
      )

      console.log(`File ${filePath} archived successfully`)

      // Add to removing files for fade-out animation
      setRemovingFiles(prev => new Set(prev).add(filePath))

      // Wait for animation to complete before removing from state
      setTimeout(() => {
        // Update tabs state to remove the file
        setTabs(prevTabs => {
          return prevTabs.map(tab => ({
            ...tab,
            files: tab.files?.filter(file => file.path !== filePath),
            count: tab.files ? tab.files.filter(file => file.path !== filePath).length : 0
          }))
        })

        // Remove from open accordions if it was open
        setOpenAccordions(prev => prev.filter(path => path !== filePath))

        // Clean up states
        setArchivingFiles(prev => {
          const next = new Set(prev)
          next.delete(filePath)
          return next
        })
        setRemovingFiles(prev => {
          const next = new Set(prev)
          next.delete(filePath)
          return next
        })
      }, 300) // Match animation duration
    } catch (error) {
      console.error('Error archiving file:', error)
      alert(`Failed to archive file: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setArchivingFiles(prev => {
        const next = new Set(prev)
        next.delete(filePath)
        return next
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Multi-select Tabs */}
      <div className="flex items-center gap-1 rounded-lg bg-muted text-muted-foreground p-[3px]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => toggleTab(tab.id)}
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

      {/* Content based on selected tabs */}
      <div
        className="grid gap-4 items-start"
        style={{
          gridTemplateColumns: `repeat(${selectedTabs.length}, minmax(0, 1fr))`
        }}
      >
        {selectedTabs.map((tabId) => {
          const tab = tabs.find((t) => t.id === tabId)
          return (
            <div
              key={tabId}
              className="rounded-xl border bg-card p-6 text-card-foreground shadow"
            >
              <h3 className="text-lg font-semibold mb-4">
                {tab?.label}
                {tab?.count !== undefined && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({tab.count} files)
                  </span>
                )}
              </h3>
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
                        >
                          {file.filename}
                        </FileAccordionTrigger>
                        <FileAccordionContent>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>Path: {file.path}</div>
                            <div>Workspace: {file.workspace}</div>
                            <div>Line: {file.line}</div>
                          </div>
                        </FileAccordionContent>
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
    </div>
  )
}
