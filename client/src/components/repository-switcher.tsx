"use client"

import * as React from "react"
import { ChevronsUpDown, Plus } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { FolderGit2 } from "lucide-react"
import { V2Repo } from "@shared/index"
import { V2RepoService } from "@/services/V2RepoService"

export function RepositorySwitcher() {
  const { isMobile } = useSidebar()
  const [repositories, setRepositories] = React.useState<V2Repo.V2RepoInfo[]>([])
  const [activeRepo, setActiveRepo] = React.useState<V2Repo.V2RepoInfo | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)

  // 获取当前 repo
  React.useEffect(() => {
    const fetchCurrentRepo = async () => {
      try {
        const data = await V2RepoService.getCurrentRepo()
        setActiveRepo(data)
      } catch (error) {
        console.error('Failed to fetch current repository:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCurrentRepo()
  }, [])

  // 仅在用户点击下拉菜单时获取所有 repos
  const fetchRepositories = async () => {
    if (repositories.length > 0) return // 组件级缓存，避免重复加载

    try {
      // 使用 Service 层的缓存
      const data = await V2RepoService.getReposList()
      setRepositories(data.repos || [])
    } catch (error) {
      console.error('Failed to fetch repositories:', error)
    }
  }

  const handleDropdownOpenChange = (open: boolean) => {
    setIsDropdownOpen(open)
    if (open) {
      fetchRepositories()
    }
  }

  const getRepoName = (repo: V2Repo.V2RepoInfo | null | undefined): string => {
    if (!repo || !repo.url) {
      return 'Unknown'
    }
    const parts = repo.url.split('/')
    return parts[parts.length - 1] || repo.url
  }

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <FolderGit2 className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Loading...</span>
              <span className="truncate text-xs">Repositories</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!activeRepo && repositories.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <FolderGit2 className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">No Repository</span>
              <span className="truncate text-xs">Add repository</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={isDropdownOpen} onOpenChange={handleDropdownOpenChange}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <FolderGit2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeRepo ? getRepoName(activeRepo) : 'Select Repository'}
                </span>
                <span className="truncate text-xs">Repositories</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Repositories
            </DropdownMenuLabel>
            {repositories.map((repo) => (
              <DropdownMenuItem
                key={repo.localPath}
                onClick={() => setActiveRepo(repo)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <FolderGit2 className="size-3.5 shrink-0" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{getRepoName(repo)}</span>
                  <span className="text-muted-foreground text-xs">{repo.url}</span>
                </div>
              </DropdownMenuItem>
            ))}            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Add repository</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
