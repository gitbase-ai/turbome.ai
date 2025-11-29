import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { V2Workspace } from '@shared/index'

export interface Tab {
  id: string
  label: string
  files?: V2Workspace.V2WorkspaceFile[]
  count?: number
}

// Unsaved file stored in localStorage
export interface UnsavedFile {
  path: string  // file path (generated or user-provided)
  filename: string
  content: string
  frontmatter?: Record<string, unknown>
  workspace: string
  createdAt: number  // timestamp
}

interface WorkspaceState {
  // State
  currentRepoUrl: string  // Track which repo we're currently viewing
  tabs: Tab[]
  selectedTabs: string[]
  openAccordions: string[]
  archivingFiles: Set<string>
  deletingFiles: Set<string>
  removingFiles: Set<string>

  // Save states for each file
  dirtyFiles: Set<string>      // Files with unsaved changes
  savingFiles: Set<string>      // Files currently being saved
  savedFiles: Set<string>       // Files that were just saved (temporary state)

  // Save handlers registry (not persisted)
  saveHandlers: Map<string, () => Promise<void>>  // filePath -> handleSave function

  // Unsaved files (stored in localStorage)
  unsavedFiles: Map<string, UnsavedFile>  // filePath -> UnsavedFile

  // Server data (not persisted - always fetched fresh)
  serverWorkspaces: V2Workspace.V2WorkspaceGroup[]
  isLoadingWorkspaces: boolean
  workspacesError: string | null

  // Actions
  initializeWorkspace: (
    workspaces: V2Workspace.V2WorkspaceGroup[],
    repoUrl: string,
    defaultSelected?: string[]
  ) => void

  // Server data actions
  fetchWorkspaces: (repoUrl: string) => Promise<void>
  refreshWorkspaces: () => Promise<void>

  setTabs: (tabs: Tab[]) => void
  setSelectedTabs: (selectedTabs: string[]) => void
  toggleTab: (tabId: string, maxSelected: number) => void
  setOpenAccordions: (accordions: string[]) => void
  toggleAccordion: (filePath: string) => void

  archiveFile: (filePath: string) => void
  completeArchive: (filePath: string) => void
  cancelArchive: (filePath: string) => void

  deleteFile: (filePath: string) => void
  completeDelete: (filePath: string) => void
  cancelDelete: (filePath: string) => void

  addWorkspace: (workspaceId: string) => void
  deleteWorkspace: (workspaceId: string) => void

  renameFile: (oldPath: string, newPath: string) => void
  moveFile: (filePath: string, targetWorkspace: string) => void

  // Save actions
  markFileDirty: (filePath: string) => void
  markFileClean: (filePath: string) => void
  startSaving: (filePath: string) => void
  completeSave: (filePath: string) => void
  cancelSave: (filePath: string) => void

  // Save handler registration
  registerSaveHandler: (filePath: string, handler: () => Promise<void>) => void
  unregisterSaveHandler: (filePath: string) => void
  invokeSaveHandler: (filePath: string) => Promise<void>

  // Helper methods
  getFileWorkspace: (filePath: string) => string | null
  getWorkspaceNames: () => string[]

  // Unsaved file actions
  addUnsavedFile: (workspaceId: string, file: UnsavedFile) => void
  updateUnsavedFile: (filePath: string, updates: Partial<UnsavedFile>) => void
  removeUnsavedFile: (filePath: string) => void
  getUnsavedFile: (filePath: string) => UnsavedFile | undefined
  getUnsavedFilesByWorkspace: (workspaceId: string) => UnsavedFile[]

  // Reset
  reset: () => void
}

const initialState = {
  currentRepoUrl: '',
  tabs: [],
  selectedTabs: [],
  openAccordions: [],
  archivingFiles: new Set<string>(),
  deletingFiles: new Set<string>(),
  removingFiles: new Set<string>(),
  dirtyFiles: new Set<string>(),
  savingFiles: new Set<string>(),
  savedFiles: new Set<string>(),
  saveHandlers: new Map<string, () => Promise<void>>(),
  unsavedFiles: new Map<string, UnsavedFile>(),
  serverWorkspaces: [],
  isLoadingWorkspaces: false,
  workspacesError: null,
}

// Custom storage that uses repoUrl as part of the key
const createRepoStorage = () => {
  return {
    getItem: (name: string): string | null => {
      const state = localStorage.getItem(name)
      if (!state) return null

      try {
        const parsed = JSON.parse(state)
        const repoUrl = parsed.state?.currentRepoUrl
        if (!repoUrl) return state

        // Load repo-specific data
        const repoKey = `${name}:${repoUrl}`
        const repoData = localStorage.getItem(repoKey)
        return repoData || state
      } catch {
        return state
      }
    },
    setItem: (name: string, value: string): void => {
      try {
        const parsed = JSON.parse(value)
        const repoUrl = parsed.state?.currentRepoUrl

        if (repoUrl) {
          // Save to repo-specific key
          const repoKey = `${name}:${repoUrl}`
          localStorage.setItem(repoKey, value)
        }

        // Also save to main key for currentRepoUrl tracking
        localStorage.setItem(name, value)
      } catch {
        localStorage.setItem(name, value)
      }
    },
    removeItem: (name: string): void => {
      localStorage.removeItem(name)
    },
  }
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Initialize workspace from server data
      initializeWorkspace: (workspaces, repoUrl, defaultSelected = []) => {
        const tabs = workspaces.map((ws) => ({
          id: ws.workspace,
          label: ws.workspace,
          files: ws.files,
          count: ws.count,
        }))

        const currentState = get()

        // Check if we're switching repos
        const isSwitchingRepo = currentState.currentRepoUrl && currentState.currentRepoUrl !== repoUrl

        if (isSwitchingRepo) {
          console.log(`[Workspace] Switching from ${currentState.currentRepoUrl} to ${repoUrl}`)
          // Clear UI states when switching repos
          set({
            currentRepoUrl: repoUrl,
            archivingFiles: new Set<string>(),
            deletingFiles: new Set<string>(),
            removingFiles: new Set<string>(),
            dirtyFiles: new Set<string>(),
            savingFiles: new Set<string>(),
            savedFiles: new Set<string>(),
            saveHandlers: new Map<string, () => Promise<void>>(),
          })
        } else if (!currentState.currentRepoUrl) {
          // First time initialization
          set({ currentRepoUrl: repoUrl })
        }

        // Get persisted state for current repo after potential switch
        const persistedState = get()
        const hasPersistedTabs = persistedState.tabs.length > 0 && persistedState.currentRepoUrl === repoUrl

        // Build a Set of all valid file paths from server data for quick lookup
        const validFilePaths = new Set<string>()
        tabs.forEach(tab => {
          tab.files?.forEach(file => {
            validFilePaths.add(file.path)
          })
        })

        // Filter selectedTabs - only keep workspaces that exist on server
        const filteredSelectedTabs = hasPersistedTabs
          ? persistedState.selectedTabs.filter(id => tabs.some(tab => tab.id === id))
          : defaultSelected.length > 0
          ? defaultSelected
          : [tabs[0]?.id].filter(Boolean)

        // Filter openAccordions - only keep files that exist on server
        const filteredOpenAccordions = hasPersistedTabs
          ? persistedState.openAccordions.filter(path => validFilePaths.has(path))
          : []

        // Clean up dirty/saving/saved files - remove files that no longer exist on server
        const { dirtyFiles, savingFiles, savedFiles, saveHandlers } = persistedState

        const cleanedDirtyFiles = new Set(
          Array.from(dirtyFiles).filter(path => validFilePaths.has(path))
        )

        const cleanedSavingFiles = new Set(
          Array.from(savingFiles).filter(path => validFilePaths.has(path))
        )

        const cleanedSavedFiles = new Set(
          Array.from(savedFiles).filter(path => validFilePaths.has(path))
        )

        // Clean up save handlers - remove handlers for files that no longer exist
        const cleanedSaveHandlers = new Map<string, () => Promise<void>>()
        saveHandlers.forEach((handler, path) => {
          if (validFilePaths.has(path)) {
            cleanedSaveHandlers.set(path, handler)
          }
        })

        set({
          tabs,
          selectedTabs: filteredSelectedTabs,
          openAccordions: filteredOpenAccordions,
          dirtyFiles: cleanedDirtyFiles,
          savingFiles: cleanedSavingFiles,
          savedFiles: cleanedSavedFiles,
          saveHandlers: cleanedSaveHandlers,
        })

        console.log(`[Workspace] Synced with server data. Valid files: ${validFilePaths.size}, Open files: ${filteredOpenAccordions.length}`)
      },

      setTabs: (tabs) => set({ tabs }),

      setSelectedTabs: (selectedTabs) => set({ selectedTabs }),

      toggleTab: (tabId, maxSelected) => {
        const { selectedTabs, tabs } = get()

        if (selectedTabs.includes(tabId)) {
          // At least keep one selected
          if (selectedTabs.length === 1) return
          set({ selectedTabs: selectedTabs.filter((id) => id !== tabId) })
        } else {
          // Check max limit
          if (selectedTabs.length >= maxSelected) return
          set({ selectedTabs: [...selectedTabs, tabId] })
        }
      },

      setOpenAccordions: (accordions) => set({ openAccordions: accordions }),

      toggleAccordion: (filePath) => {
        const { openAccordions } = get()
        if (openAccordions.includes(filePath)) {
          set({ openAccordions: openAccordions.filter(path => path !== filePath) })
        } else {
          set({ openAccordions: [...openAccordions, filePath] })
        }
      },

      archiveFile: (filePath) => {
        const { archivingFiles, removingFiles } = get()
        set({
          archivingFiles: new Set(archivingFiles).add(filePath),
          removingFiles: new Set(removingFiles).add(filePath),
        })
      },

      completeArchive: (filePath) => {
        const { tabs, openAccordions, archivingFiles, removingFiles } = get()

        // Remove file from tabs
        const newTabs = tabs.map(tab => ({
          ...tab,
          files: tab.files?.filter(file => file.path !== filePath),
          count: tab.files ? tab.files.filter(file => file.path !== filePath).length : 0,
        }))

        // Remove from open accordions
        const newOpenAccordions = openAccordions.filter(path => path !== filePath)

        // Clean up archiving and removing states
        const newArchivingFiles = new Set(archivingFiles)
        newArchivingFiles.delete(filePath)

        const newRemovingFiles = new Set(removingFiles)
        newRemovingFiles.delete(filePath)

        set({
          tabs: newTabs,
          openAccordions: newOpenAccordions,
          archivingFiles: newArchivingFiles,
          removingFiles: newRemovingFiles,
        })
      },

      cancelArchive: (filePath) => {
        const { archivingFiles } = get()
        const newArchivingFiles = new Set(archivingFiles)
        newArchivingFiles.delete(filePath)
        set({ archivingFiles: newArchivingFiles })
      },

      deleteFile: (filePath) => {
        const { deletingFiles, removingFiles } = get()
        set({
          deletingFiles: new Set(deletingFiles).add(filePath),
          removingFiles: new Set(removingFiles).add(filePath),
        })
      },

      completeDelete: (filePath) => {
        const { tabs, openAccordions, deletingFiles, removingFiles } = get()

        // Remove file from tabs
        const newTabs = tabs.map(tab => ({
          ...tab,
          files: tab.files?.filter(file => file.path !== filePath),
          count: tab.files ? tab.files.filter(file => file.path !== filePath).length : 0,
        }))

        // Remove from open accordions
        const newOpenAccordions = openAccordions.filter(path => path !== filePath)

        // Clean up deleting and removing states
        const newDeletingFiles = new Set(deletingFiles)
        newDeletingFiles.delete(filePath)

        const newRemovingFiles = new Set(removingFiles)
        newRemovingFiles.delete(filePath)

        set({
          tabs: newTabs,
          openAccordions: newOpenAccordions,
          deletingFiles: newDeletingFiles,
          removingFiles: newRemovingFiles,
        })
      },

      cancelDelete: (filePath) => {
        const { deletingFiles, removingFiles } = get()
        const newDeletingFiles = new Set(deletingFiles)
        newDeletingFiles.delete(filePath)
        const newRemovingFiles = new Set(removingFiles)
        newRemovingFiles.delete(filePath)
        set({
          deletingFiles: newDeletingFiles,
          removingFiles: newRemovingFiles,
        })
      },

      addWorkspace: (workspaceId) => {
        const { tabs } = get()
        set({
          tabs: [
            ...tabs,
            {
              id: workspaceId,
              label: workspaceId,
              files: [],
              count: 0,
            },
          ],
        })
      },

      deleteWorkspace: (workspaceId) => {
        const { tabs: currentTabs, selectedTabs } = get()
        const newTabs = currentTabs.filter(tab => tab.id !== workspaceId)
        let newSelectedTabs = selectedTabs.filter(id => id !== workspaceId)

        // If no tabs selected, select the first remaining tab
        if (newSelectedTabs.length === 0 && newTabs.length > 0) {
          newSelectedTabs = [newTabs[0].id]
        }

        set({
          tabs: newTabs,
          selectedTabs: newSelectedTabs,
        })
      },

      renameFile: (oldPath, newPath) => {
        const { tabs, openAccordions } = get()

        // Update file path in tabs
        const newTabs = tabs.map(tab => ({
          ...tab,
          files: tab.files?.map(file =>
            file.path === oldPath
              ? { ...file, path: newPath, filename: newPath.split('/').pop() || newPath }
              : file
          ),
        }))

        // Update open accordions
        const newOpenAccordions = openAccordions.map(path =>
          path === oldPath ? newPath : path
        )

        set({
          tabs: newTabs,
          openAccordions: newOpenAccordions,
        })
      },

      moveFile: (filePath, targetWorkspace) => {
        const { tabs } = get()

        // Find the file in current tabs
        let fileToMove: V2Workspace.V2WorkspaceFile | null = null
        let sourceWorkspace: string | null = null

        for (const tab of tabs) {
          const file = tab.files?.find(f => f.path === filePath)
          if (file) {
            fileToMove = file
            sourceWorkspace = tab.id
            break
          }
        }

        if (!fileToMove || !sourceWorkspace) {
          console.error(`File ${filePath} not found in any workspace`)
          return
        }

        // Update tabs: remove from source, add to target
        const newTabs = tabs.map(tab => {
          if (tab.id === sourceWorkspace) {
            // Remove file from source workspace
            const newFiles = tab.files?.filter(f => f.path !== filePath) || []
            return {
              ...tab,
              files: newFiles,
              count: newFiles.length,
            }
          } else if (tab.id === targetWorkspace) {
            // Add file to target workspace
            const newFiles = [...(tab.files || []), fileToMove]
            return {
              ...tab,
              files: newFiles,
              count: newFiles.length,
            }
          }
          return tab
        })

        set({ tabs: newTabs })
      },

      // Save actions
      markFileDirty: (filePath) => {
        const { dirtyFiles } = get()
        const newDirtyFiles = new Set(dirtyFiles)
        newDirtyFiles.add(filePath)
        set({ dirtyFiles: newDirtyFiles })
      },

      markFileClean: (filePath) => {
        const { dirtyFiles } = get()
        const newDirtyFiles = new Set(dirtyFiles)
        newDirtyFiles.delete(filePath)
        set({ dirtyFiles: newDirtyFiles })
      },

      startSaving: (filePath) => {
        const { savingFiles } = get()
        const newSavingFiles = new Set(savingFiles)
        newSavingFiles.add(filePath)
        set({ savingFiles: newSavingFiles })
      },

      completeSave: (filePath) => {
        const { savingFiles, savedFiles, dirtyFiles } = get()

        // Remove from saving
        const newSavingFiles = new Set(savingFiles)
        newSavingFiles.delete(filePath)

        // Add to saved (temporary state for visual feedback)
        const newSavedFiles = new Set(savedFiles)
        newSavedFiles.add(filePath)

        // Remove from dirty
        const newDirtyFiles = new Set(dirtyFiles)
        newDirtyFiles.delete(filePath)

        set({
          savingFiles: newSavingFiles,
          savedFiles: newSavedFiles,
          dirtyFiles: newDirtyFiles,
        })

        // Clear saved state after 2 seconds
        setTimeout(() => {
          const { savedFiles } = get()
          const updatedSavedFiles = new Set(savedFiles)
          updatedSavedFiles.delete(filePath)
          set({ savedFiles: updatedSavedFiles })
        }, 2000)
      },

      cancelSave: (filePath) => {
        const { savingFiles } = get()
        const newSavingFiles = new Set(savingFiles)
        newSavingFiles.delete(filePath)
        set({ savingFiles: newSavingFiles })
      },

      // Save handler registration
      registerSaveHandler: (filePath, handler) => {
        const { saveHandlers } = get()
        const newHandlers = new Map(saveHandlers)
        newHandlers.set(filePath, handler)
        set({ saveHandlers: newHandlers })
      },

      unregisterSaveHandler: (filePath) => {
        const { saveHandlers } = get()
        const newHandlers = new Map(saveHandlers)
        newHandlers.delete(filePath)
        set({ saveHandlers: newHandlers })
      },

      invokeSaveHandler: async (filePath) => {
        const { saveHandlers } = get()
        const handler = saveHandlers.get(filePath)
        if (handler) {
          await handler()
        } else {
          console.warn(`No save handler registered for file: ${filePath}`)
        }
      },

      // Helper methods
      getFileWorkspace: (filePath) => {
        const { tabs } = get()

        // Search through all tabs to find which workspace contains this file
        for (const tab of tabs) {
          if (tab.files?.some(file => file.path === filePath)) {
            return tab.id  // tab.id is the workspace name
          }
        }

        return null
      },

      getWorkspaceNames: () => {
        const { tabs } = get()
        return tabs.map(tab => tab.id)
      },

      // Unsaved file actions
      addUnsavedFile: (workspaceId, file) => {
        const { unsavedFiles } = get()
        const newUnsavedFiles = new Map(unsavedFiles)
        newUnsavedFiles.set(file.path, file)
        set({ unsavedFiles: newUnsavedFiles })

        // Also mark the file as dirty
        const { dirtyFiles } = get()
        const newDirtyFiles = new Set(dirtyFiles)
        newDirtyFiles.add(file.path)
        set({ dirtyFiles: newDirtyFiles })
      },

      updateUnsavedFile: (filePath, updates) => {
        const { unsavedFiles } = get()
        const existingFile = unsavedFiles.get(filePath)
        if (!existingFile) {
          console.warn(`Cannot update unsaved file ${filePath}: file not found`)
          return
        }

        const newUnsavedFiles = new Map(unsavedFiles)
        newUnsavedFiles.set(filePath, { ...existingFile, ...updates })
        set({ unsavedFiles: newUnsavedFiles })
      },

      removeUnsavedFile: (filePath) => {
        const { unsavedFiles } = get()
        const newUnsavedFiles = new Map(unsavedFiles)
        newUnsavedFiles.delete(filePath)
        set({ unsavedFiles: newUnsavedFiles })

        // Also clean up dirty state
        const { dirtyFiles } = get()
        const newDirtyFiles = new Set(dirtyFiles)
        newDirtyFiles.delete(filePath)
        set({ dirtyFiles: newDirtyFiles })
      },

      getUnsavedFile: (filePath) => {
        const { unsavedFiles } = get()
        return unsavedFiles.get(filePath)
      },

      getUnsavedFilesByWorkspace: (workspaceId) => {
        const { unsavedFiles } = get()
        const result: UnsavedFile[] = []
        unsavedFiles.forEach(file => {
          if (file.workspace === workspaceId) {
            result.push(file)
          }
        })
        return result
      },

      // Fetch workspaces from server
      fetchWorkspaces: async (repoUrl: string) => {
        set({ isLoadingWorkspaces: true, workspacesError: null })

        try {
          // Dynamic import to avoid circular dependencies
          const { V2WorkspaceService } = await import('@/services/V2WorkspaceService')

          // Parse repo URL (format: domain/owner/repo)
          const urlParts = repoUrl.split('/')
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
            let apiWorkspaces = response.data.workspaces

            // If no workspaces exist on server and no local workspaces, create default ones
            const currentTabs = get().tabs
            const hasNoWorkspaces = apiWorkspaces.length === 0 && currentTabs.length === 0

            if (hasNoWorkspaces) {
              // Initialize with default 4 workspaces
              const defaultWorkspaceNames = ['Urgent&Important', 'Important', 'Urgent', 'Normal']
              apiWorkspaces = defaultWorkspaceNames.map(name => ({
                workspace: name,
                files: [],
                count: 0
              }))
              console.log('[Workspace] No workspaces found. Initializing with default workspaces:', defaultWorkspaceNames)
            }

            // Get empty workspaces from Zustand store (workspaces created locally but not yet on server)
            const emptyWorkspaces: V2Workspace.V2WorkspaceGroup[] = currentTabs
              .filter(tab => !apiWorkspaces.some(ws => ws.workspace === tab.id))
              .map(tab => ({
                workspace: tab.id,
                files: [],
                count: 0
              }))

            // Merge API workspaces with empty workspaces
            const allWorkspaces = [...apiWorkspaces, ...emptyWorkspaces]

            set({
              serverWorkspaces: allWorkspaces,
              isLoadingWorkspaces: false,
              workspacesError: null
            })

            // Also initialize workspace tabs
            get().initializeWorkspace(allWorkspaces, repoUrl)
          } else {
            set({
              workspacesError: response.message || 'Failed to fetch workspaces',
              isLoadingWorkspaces: false
            })
          }
        } catch (err) {
          console.error('Error fetching workspaces:', err)
          set({
            workspacesError: err instanceof Error ? err.message : 'Unknown error',
            isLoadingWorkspaces: false
          })
        }
      },

      // Refresh workspaces using current repo URL
      refreshWorkspaces: async () => {
        const { currentRepoUrl, fetchWorkspaces } = get()
        if (currentRepoUrl) {
          await fetchWorkspaces(currentRepoUrl)
        }
      },

      reset: () => set(initialState),
    }),
    {
      name: 'workspace-storage',
      storage: createJSONStorage(() => createRepoStorage()),
      partialize: (state) => ({
        // Only persist these fields
        currentRepoUrl: state.currentRepoUrl,
        tabs: state.tabs,
        selectedTabs: state.selectedTabs,
        openAccordions: state.openAccordions,
        unsavedFiles: Array.from(state.unsavedFiles.entries()),  // Convert Map to array for JSON serialization
        // Don't persist UI states like archivingFiles and removingFiles
      }),
      merge: (persistedState: unknown, currentState) => {
        // Convert unsavedFiles array back to Map when loading from localStorage
        const merged = {
          ...currentState,
          ...(persistedState as Record<string, unknown>),
        }

        const state = persistedState as { unsavedFiles?: [string, UnsavedFile][] }
        if (state?.unsavedFiles && Array.isArray(state.unsavedFiles)) {
          merged.unsavedFiles = new Map(state.unsavedFiles)
        }

        return merged
      },
    }
  )
)
