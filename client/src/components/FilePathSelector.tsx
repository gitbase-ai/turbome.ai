"use client"

import * as React from "react"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { V2RepoService } from "@/services/V2RepoService"
import { V2TreeService } from "@/services/V2TreeService"

interface FilePathSelectorProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  suggestedFilename?: string
  showFilenameHint?: boolean
  loadRootOnMount?: boolean
  allowedExtensions?: string[]
  onValidationChange?: (isValid: boolean, error?: string) => void
}

export function FilePathSelector({
  value,
  onValueChange,
  placeholder = "Enter path...",
  suggestedFilename,
  showFilenameHint = false,
  loadRootOnMount = false,
  allowedExtensions = [],
  onValidationChange,
}: FilePathSelectorProps) {
  const [pathSuggestions, setPathSuggestions] = React.useState<string[]>([])
  const [validationError, setValidationError] = React.useState<string | undefined>(undefined)

  // Load path suggestions from tree API
  const loadPathSuggestions = React.useCallback(async (inputPath: string) => {
    try {
      const currentRepo = await V2RepoService.getCurrentRepo()
      const urlParts = currentRepo.url.split('/')

      if (urlParts.length === 3) {
        const [domain, owner, repo] = urlParts

        // Normalize path: remove leading slash if present
        const normalizedPath = inputPath.startsWith('/') ? inputPath.substring(1) : inputPath

        // Call API with the exact path user typed
        const response = await V2TreeService.getTree(domain, owner, repo, normalizedPath, false)

        if (response.success && response.data) {
          // Extract directory entries and create path suggestions
          const suggestions = response.data.entries
            .filter(entry => entry.type === 'directory')
            .map(entry => entry.path)

          setPathSuggestions(suggestions)
        } else {
          setPathSuggestions([])
        }
      }
    } catch (error) {
      console.error('Error loading path suggestions:', error)
      setPathSuggestions([])
    }
  }, [])

  // Validate path against allowed extensions
  const validatePath = React.useCallback((path: string) => {
    if (allowedExtensions.length === 0) {
      return { isValid: true, error: undefined }
    }

    const trimmedPath = path.trim()

    // Empty path is invalid
    if (!trimmedPath) {
      return { isValid: false, error: "Path cannot be empty" }
    }

    // Path ending with / is invalid (must be a file, not directory)
    if (trimmedPath.endsWith('/')) {
      return { isValid: false, error: "Path must be a file, not a directory" }
    }

    // Check if path has valid extension
    const hasValidExtension = allowedExtensions.some(ext =>
      trimmedPath.endsWith(ext)
    )

    if (!hasValidExtension) {
      const extensionList = allowedExtensions.join(', ')
      return {
        isValid: false,
        error: `File must end with one of: ${extensionList}`
      }
    }

    return { isValid: true, error: undefined }
  }, [allowedExtensions])

  // Handle path input change and load suggestions
  const handlePathChange = React.useCallback((newValue: string) => {
    onValueChange(newValue)

    // Validate the new value
    const validation = validatePath(newValue)
    setValidationError(validation.error)

    // Notify parent of validation state
    if (onValidationChange) {
      onValidationChange(validation.isValid, validation.error)
    }

    // Directly load suggestions based on user input
    loadPathSuggestions(newValue)
  }, [onValueChange, loadPathSuggestions, validatePath, onValidationChange])

  // Handle directory selection from suggestions
  const handleSelectDirectory = React.useCallback((dirPath: string) => {
    // Add trailing slash to indicate it's a directory
    const pathWithSlash = dirPath.endsWith('/') ? dirPath : `${dirPath}/`
    onValueChange(pathWithSlash)
    // Load suggestions for the selected directory
    loadPathSuggestions(pathWithSlash)
  }, [onValueChange, loadPathSuggestions])

  // Load initial suggestions when component mounts or value changes
  React.useEffect(() => {
    if (loadRootOnMount && value === "") {
      // Load root directory when creating new file
      loadPathSuggestions("")
    } else if (value) {
      // Load suggestions for existing path
      loadPathSuggestions(value)
    }
  }, [value, loadPathSuggestions, loadRootOnMount])

  return (
    <div className="space-y-2">
      <Command className="rounded-lg border" shouldFilter={false}>
        <CommandInput
          placeholder={placeholder}
          value={value}
          onValueChange={handlePathChange}
        />
        <CommandList>
          {pathSuggestions.length === 0 ? (
            // Show suggested filename if enabled and current input doesn't contain .md
            showFilenameHint && suggestedFilename && !value.includes('.md') ? (
              <div className="p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Suggested filename:</p>
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => {
                    // Combine current input with suggested filename
                    const suggestedPath = value
                      ? (value.endsWith('/') ? `${value}${suggestedFilename}` : `${value}/${suggestedFilename}`)
                      : suggestedFilename
                    onValueChange(suggestedPath)
                  }}
                >
                  {(() => {
                    return value
                      ? (value.endsWith('/') ? `${value}${suggestedFilename}` : `${value}/${suggestedFilename}`)
                      : suggestedFilename
                  })()}
                </Badge>
              </div>
            ) : (
              <CommandEmpty>No directories found</CommandEmpty>
            )
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
      {validationError && (
        <p className="text-sm text-destructive px-1">{validationError}</p>
      )}
    </div>
  )
}
