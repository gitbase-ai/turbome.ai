"use client"

import * as React from "react"
import {
  FileText,
  Code,
  FolderTree,
  LayoutDashboard,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
// import { NavAnalytics } from "@/components/nav-analytics"
// import { NavUser } from "@/components/nav-user"
import { RepositorySwitcher } from "@/components/repository-switcher"
import {
  Sidebar,
  SidebarContent,
  // SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// TurboMe workspace data
const data = {
  user: {
    name: "TurboMe User",
    email: "user@turbome.ai",
    avatar: "/avatars/user.jpg",
  },
  teams: [
    {
      name: "TurboMe",
      logo: FileText,
      plan: "Workspace",
    },
  ],
  navMain: [
    {
      title: "Workspace",
      url: "/workspace",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Explore",
      url: "/explore",
      icon: FolderTree,
      // items: [
      //   {
      //     title: "All Files",
      //     url: "/explore",
      //   },
      //   {
      //     title: "Recent",
      //     url: "/explore?filter=recent",
      //   },
      //   {
      //     title: "Favorites",
      //     url: "/explore?filter=favorites",
      //   },
      // ],
    },
    {
      title: "API",
      url: "/api-docs",
      icon: Code,
    },
  ],
  // analytics: [
  //   {
  //     name: "Timeline",
  //     url: "/timeline",
  //     icon: Clock,
  //   },
  // ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <RepositorySwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      {/* <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter> */}
      <SidebarRail />
    </Sidebar>
  )
}
