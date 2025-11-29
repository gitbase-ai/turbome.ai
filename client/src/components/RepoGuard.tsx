"use client"

import { useEffect, useState } from "react"
import { V2RepoService } from "@/services/V2RepoService"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function RepoGuard({ children }: { children: React.ReactNode }) {
  const [hasRepos, setHasRepos] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkRepos = async () => {
      try {
        setIsLoading(true)
        const reposResponse = await V2RepoService.getReposList()

        // Check if repos list is empty
        const isEmpty = !reposResponse.repos || reposResponse.repos.length === 0
        setHasRepos(!isEmpty)
      } catch (error) {
        console.error('Error checking repos:', error)
        // If there's an error, assume no repos
        setHasRepos(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkRepos()
  }, [])

  // Show loading state while checking
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show warning dialog if no repos found
  if (hasRepos === false) {
    return (
      <>
        {children}
        <Dialog open={true}>
          <DialogContent
            className="sm:max-w-[500px]"
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                No Git Repository Detected
              </DialogTitle>
              <DialogDescription className="space-y-4 pt-4">
                <p className="text-foreground">
                  TurboMe needs to be started in a Git repository directory to function properly.
                </p>

                <div className="bg-muted p-4 rounded-md space-y-2">
                  <p className="font-medium text-foreground">To fix this issue:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Stop the current TurboMe server</li>
                    <li>Navigate to your Git repository directory</li>
                    <li>Run the <code className="bg-background px-1.5 py-0.5 rounded">turbome</code> command again</li>
                  </ol>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-md">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Example:</strong>
                  </p>
                  <pre className="mt-2 text-xs bg-background p-2 rounded overflow-x-auto">
{`cd /path/to/your/git/repository
turbome`}
                  </pre>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // If repos exist, render children normally
  return <>{children}</>
}
