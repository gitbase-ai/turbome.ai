"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronRight, Archive, MoreHorizontal, Save } from "lucide-react"
import { useWorkspaceStore } from "@/stores/workspaceStore"
import { cn } from "@/lib/utils"
import MilkdownEditor, { MilkdownEditorRef } from "@/components/MilkdownEditor"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"

function FileAccordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

function FileAccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  )
}

function FileAccordionTrigger({
  className,
  children,
  onArchive,
  isArchiving,
  onRename,
  filePath,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger> & {
  onArchive?: () => void
  isArchiving?: boolean
  onRename?: (oldPath: string, newPath: string) => void
  filePath?: string
}) {
  // Get save states from Zustand store
  const isDirty = useWorkspaceStore(state => state.dirtyFiles.has(filePath || ''))
  const isSaving = useWorkspaceStore(state => state.savingFiles.has(filePath || ''))
  const isSaved = useWorkspaceStore(state => state.savedFiles.has(filePath || ''))

  // Get save handler invoker from Zustand store
  const invokeSaveHandler = useWorkspaceStore(state => state.invokeSaveHandler)
  const [archivePopoverOpen, setArchivePopoverOpen] = React.useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false)
  const [newPath, setNewPath] = React.useState("")
  const [pathSuggestions, setPathSuggestions] = React.useState<string[]>([])

  // Initialize newPath when dialog opens
  React.useEffect(() => {
    if (renameDialogOpen && filePath) {
      setNewPath(filePath)

      // Load initial suggestions for the current directory
      const lastSlashIndex = filePath.lastIndexOf('/')
      if (lastSlashIndex >= 0) {
        const dirPath = filePath.substring(0, lastSlashIndex)
        loadPathSuggestions(dirPath)
      } else {
        // Load root directory suggestions
        loadPathSuggestions('')
      }
    }
  }, [renameDialogOpen, filePath])

  // Handle path input change and load suggestions
  const handlePathChange = (value: string) => {
    setNewPath(value)

    // Extract directory part for suggestions
    const lastSlashIndex = value.lastIndexOf('/')
    if (lastSlashIndex >= 0) {
      const dirPath = value.substring(0, lastSlashIndex)
      loadPathSuggestions(dirPath)
    } else {
      // Load root directory suggestions if no slash
      loadPathSuggestions('')
    }
  }

  // Handle directory selection from suggestions
  const handleSelectDirectory = (dirPath: string) => {
    // Get the current filename
    const lastSlashIndex = (filePath || '').lastIndexOf('/')
    const filename = lastSlashIndex >= 0
      ? (filePath || '').substring(lastSlashIndex + 1)
      : (filePath || '')

    // Combine selected directory with filename
    const newFullPath = dirPath ? `${dirPath}/${filename}` : filename
    setNewPath(newFullPath)

    // Load suggestions for the selected directory
    loadPathSuggestions(dirPath)
  }

  // Load path suggestions from tree API
  const loadPathSuggestions = async (dirPath: string) => {
    try {
      // We need to get repo info to call the tree API
      const { V2RepoService } = await import("@/services/V2RepoService")
      const { V2TreeService } = await import("@/services/V2TreeService")

      const currentRepo = await V2RepoService.getCurrentRepo()
      const urlParts = currentRepo.url.split('/')

      if (urlParts.length === 3) {
        const [domain, owner, repo] = urlParts

        // Fetch directory tree
        const response = await V2TreeService.getTree(domain, owner, repo, dirPath, false)

        if (response.success && response.data) {
          // Extract directory entries and create path suggestions
          const suggestions = response.data.entries
            .filter(entry => entry.type === 'directory')
            .map(entry => entry.path)

          // Add root directory option if we're not already at root
          if (dirPath !== '') {
            suggestions.unshift('')
          }

          setPathSuggestions(suggestions)
        } else {
          setPathSuggestions([])
        }
      }
    } catch (error) {
      console.error('Error loading path suggestions:', error)
      setPathSuggestions([])
    }
  }

  const handleRename = () => {
    if (filePath && newPath && filePath !== newPath) {
      onRename?.(filePath, newPath)
      setRenameDialogOpen(false)
      setNewPath("")
    }
  }

  return (
    <AccordionPrimitive.Header className="flex">
      <div className="flex flex-1 items-center gap-2">
        {/* 展开按钮在最左边 */}
        <AccordionPrimitive.Trigger
          data-slot="accordion-trigger"
          className={cn(
            "focus-visible:border-ring focus-visible:ring-ring/50 flex items-center justify-center p-2 transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-90",
            className
          )}
          {...props}
        >
          <ChevronRight className="text-muted-foreground size-4 shrink-0 transition-transform duration-200" />
        </AccordionPrimitive.Trigger>

        {/* 文件标题 */}
        <div className="flex-1 py-4 text-left text-sm font-medium">
          {children}
        </div>

        {/* 右侧操作按钮 */}
        <div className="flex items-center gap-1">
          {/* Save 按钮 - only show when dirty */}
          {isDirty && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (filePath) {
                  invokeSaveHandler(filePath)
                }
              }}
              disabled={isSaving || isSaved}
              className={cn(
                "focus-visible:border-ring focus-visible:ring-ring/50 flex items-center justify-center rounded-md p-2 transition-all outline-none hover:bg-muted focus-visible:ring-[3px]",
                (isSaving || isSaved) && "cursor-not-allowed opacity-50",
                isSaved && "text-green-600"
              )}
              title={isSaving ? "Saving..." : isSaved ? "Saved" : "Save"}
            >
              {isSaving ? (
                <svg className="animate-spin size-4 text-muted-foreground" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : isSaved ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              ) : (
                <Save className="text-muted-foreground size-4" />
              )}
            </button>
          )}

          {/* Archive 按钮 with Popover confirmation */}
          <Popover open={archivePopoverOpen} onOpenChange={setArchivePopoverOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                disabled={isArchiving}
                className={cn(
                  "focus-visible:border-ring focus-visible:ring-ring/50 flex items-center justify-center rounded-md p-2 transition-all outline-none hover:bg-muted focus-visible:ring-[3px]",
                  isArchiving && "cursor-not-allowed opacity-50"
                )}
                title={isArchiving ? "Archiving..." : "Archive"}
              >
                {isArchiving ? (
                  <svg className="animate-spin size-4 text-muted-foreground" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <Archive className="text-muted-foreground size-4" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <div className="space-y-3">
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">Archive file</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the workspace frontmatter from the file.
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setArchivePopoverOpen(false)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setArchivePopoverOpen(false)
                      onArchive?.()
                    }}
                  >
                    Archive
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* 更多操作下拉菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="focus-visible:border-ring focus-visible:ring-ring/50 flex items-center justify-center rounded-md p-2 transition-all outline-none hover:bg-muted focus-visible:ring-[3px]"
                title="More options"
              >
                <MoreHorizontal className="text-muted-foreground size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setRenameDialogOpen(true)
                }}
              >
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Move to...</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
            <DialogDescription>
              Enter the new path for this file. You can change the filename or move it to a different directory.
            </DialogDescription>
          </DialogHeader>
          <Command className="rounded-lg border">
            <CommandInput
              placeholder="Enter new path..."
              value={newPath}
              onValueChange={handlePathChange}
            />
            <CommandList>
              {pathSuggestions.length === 0 ? (
                <CommandEmpty>No directories found. Type the new path directly.</CommandEmpty>
              ) : (
                <CommandGroup heading="Available Directories">
                  {pathSuggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion}
                      value={suggestion}
                      onSelect={() => handleSelectDirectory(suggestion)}
                    >
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        {suggestion || '/ (root)'}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRenameDialogOpen(false)
                setNewPath("")
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={!newPath || newPath === filePath}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AccordionPrimitive.Header>
  )
}

// Enhanced text editor using MilkdownEditor
const EnhancedTextEditor = ({
  content,
  fileType,
  className,
  editorRef,
  onChange
}: {
  content: string
  fileType?: string
  className?: string
  editorRef?: (ref: MilkdownEditorRef | null) => void
  onChange?: () => void
}) => {
  return (
    <div className="relative" onClick={onChange}>
      <MilkdownEditor
        ref={editorRef}
        content={content}
        fileType={fileType}
        readOnly={false}
        className={className}
      />
    </div>
  )
}

interface FileAccordionContentProps extends React.ComponentProps<typeof AccordionPrimitive.Content> {
  filePath?: string
  repoUrl?: string
}

function FileAccordionContent({
  className,
  children,
  filePath,
  repoUrl,
  ...props
}: FileAccordionContentProps) {
  const [content, setContent] = React.useState<string | null>(null)
  const [originalContent, setOriginalContent] = React.useState<string | null>(null)
  const [frontmatter, setFrontmatter] = React.useState<Record<string, unknown> | undefined>(undefined)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fileType, setFileType] = React.useState<string>('text')
  const editorRef = React.useRef<MilkdownEditorRef | null>(null)

  // Get Zustand actions
  const markFileDirty = useWorkspaceStore(state => state.markFileDirty)
  const startSaving = useWorkspaceStore(state => state.startSaving)
  const completeSave = useWorkspaceStore(state => state.completeSave)
  const cancelSave = useWorkspaceStore(state => state.cancelSave)
  const registerSaveHandler = useWorkspaceStore(state => state.registerSaveHandler)
  const unregisterSaveHandler = useWorkspaceStore(state => state.unregisterSaveHandler)

  React.useEffect(() => {
    const loadContent = async () => {
      if (!filePath || !repoUrl) return

      setIsLoading(true)
      setError(null)

      try {
        const { V2ContentService } = await import("@/services/V2ContentService")
        const { V2RepoService } = await import("@/services/V2RepoService")

        const currentRepo = await V2RepoService.getCurrentRepo()
        const urlParts = currentRepo.url.split('/')

        if (urlParts.length === 3) {
          const [domain, owner, repo] = urlParts

          const response = await V2ContentService.getFileContent(domain, owner, repo, filePath)

          if (response.success && response.data) {
            setContent(response.data.content)
            setOriginalContent(response.data.content)
            setFrontmatter(response.data.frontmatter)

            // Extract file extension for fileType
            const extension = filePath.split('.').pop() || 'text'
            setFileType(extension)
          } else {
            setError(response.message || 'Failed to load content')
          }
        }
      } catch (err) {
        console.error('Error loading file content:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    loadContent()
  }, [filePath, repoUrl])

  const setEditorRefCallback = React.useCallback((ref: MilkdownEditorRef | null) => {
    editorRef.current = ref
  }, [])

  // Handle editor change to mark as dirty
  const handleEditorChange = React.useCallback(() => {
    if (!filePath) return

    // Mark file as dirty when edited
    markFileDirty(filePath)
  }, [filePath, markFileDirty])

  // Handle save
  const handleSave = React.useCallback(async () => {
    if (!filePath || !repoUrl || !editorRef.current) return

    startSaving(filePath)
    setError(null)

    try {
      const { V2ContentService } = await import("@/services/V2ContentService")
      const { V2RepoService } = await import("@/services/V2RepoService")

      const currentRepo = await V2RepoService.getCurrentRepo()
      const urlParts = currentRepo.url.split('/')

      if (urlParts.length === 3) {
        const [domain, owner, repo] = urlParts

        // Get current content from editor
        const currentContent = editorRef.current.getContent()

        // Call create/update API
        // TODO: Replace hardcoded test values with real user info
        const response = await V2ContentService.createOrUpdateFile(
          domain,
          owner,
          repo,
          filePath,
          {
            content: currentContent,
            frontmatter: frontmatter,
            commitMessage: {
              authorName: 'testname',
              authorEmail: 'testmail@a.com',
              message: `Update ${filePath}`
            }
          }
        )

        if (response.success) {
          // Update local content state to match saved content
          setContent(currentContent)
          setOriginalContent(currentContent)
          completeSave(filePath)
        } else {
          setError(response.message || 'Failed to save file')
          cancelSave(filePath)
        }
      }
    } catch (err) {
      console.error('Error saving file:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      cancelSave(filePath)
    }
  }, [filePath, repoUrl, frontmatter, startSaving, completeSave, cancelSave])

  // Register save handler in Zustand store
  React.useEffect(() => {
    if (filePath && handleSave) {
      registerSaveHandler(filePath, handleSave)

      // Cleanup: unregister when component unmounts or filePath changes
      return () => {
        unregisterSaveHandler(filePath)
      }
    }
  }, [filePath, handleSave, registerSaveHandler, unregisterSaveHandler])

  return (
    <AccordionPrimitive.Content
        data-slot="accordion-content"
        className="data-[state=closed]:animate-accordion-up data-[state=closed]:overflow-hidden data-[state=open]:animate-accordion-down data-[state=open]:overflow-visible text-sm"
        {...props}
      >
      <div className={cn("pt-0 pb-4", className)}>
        {filePath && repoUrl ? (
          <div>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <svg className="animate-spin h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : error ? (
              <div className="text-red-600 py-4">
                Error: {error}
              </div>
            ) : content !== null ? (
              <div className="mt-2">
                <EnhancedTextEditor
                  content={content}
                  fileType={fileType}
                  className="mt-2"
                  editorRef={setEditorRefCallback}
                  onChange={handleEditorChange}
                />
              </div>
            ) : null}
            <div className="pl-10">
              {children}
            </div>
          </div>
        ) : (
          <div className="pl-10">
            {children}
          </div>
        )}
      </div>
    </AccordionPrimitive.Content>
  )
}

export { FileAccordion, FileAccordionItem, FileAccordionTrigger, FileAccordionContent }
