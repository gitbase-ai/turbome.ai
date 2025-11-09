"use client"

import * as React from "react"
import {
  FileText,
  MessageSquare,
  Clock,
  Settings2,
  Code,
  FolderTree,
  LayoutDashboard,
  TestTube,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavAnalytics } from "@/components/nav-analytics"
import { NavUser } from "@/components/nav-user"
import { RepositorySwitcher } from "@/components/repository-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
      items: [
        {
          title: "All Files",
          url: "/explore",
        },
        {
          title: "Recent",
          url: "/explore?filter=recent",
        },
        {
          title: "Favorites",
          url: "/explore?filter=favorites",
        },
      ],
    },
    {
      title: "Test",
      url: "/test",
      icon: TestTube,
      isActive: false,
      items: [
        {
          title: "Test 1",
          url: "/test/1",
        },
        {
          title: "Test 2",
          url: "/test/2",
        },
        {
          title: "Test 3",
          url: "/test/3",
        },
      ],
    },
    {
      title: "Conversation",
      url: "/conversation",
      icon: MessageSquare,
      items: [
        {
          title: "New Chat",
          url: "/conversation",
        },
        {
          title: "History",
          url: "/conversation/history",
        },
      ],
    },
    {
      title: "API",
      url: "/api-docs",
      icon: Code,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/settings",
        },
        {
          title: "Workspace",
          url: "/settings/workspace",
        },
        {
          title: "Git Config",
          url: "/settings/git",
        },
      ],
    },
  ],
  analytics: [
    {
      name: "Timeline",
      url: "/timeline",
      icon: Clock,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <RepositorySwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavAnalytics analytics={data.analytics} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
