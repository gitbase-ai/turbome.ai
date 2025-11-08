"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Search } from "lucide-react"
import { useState } from "react"

interface PageHeaderProps {
  breadcrumbs?: { label: string; href?: string }[]
  currentPage: string
}

export function PageHeader({ breadcrumbs = [], currentPage }: PageHeaderProps) {
  const [open, setOpen] = useState(false)

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
      <div className="flex items-center gap-2 px-4 flex-1">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/">
                TurboMe
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs.map((item, index) => (
              <>
                <BreadcrumbSeparator key={`sep-${index}`} className="hidden md:block" />
                <BreadcrumbItem key={index} className="hidden md:block">
                  {item.href ? (
                    <BreadcrumbLink href={item.href}>
                      {item.label}
                    </BreadcrumbLink>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </BreadcrumbItem>
              </>
            ))}
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{currentPage}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Command Search Dropdown */}
      <div className="flex items-center gap-2 px-4 relative">
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className={`inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all ${open ? 'w-[600px]' : 'w-auto'}`}
          >
            <Search className="h-4 w-4 shrink-0" />
            {!open && (
              <>
                <span className="hidden md:inline">Search files...</span>
                <kbd className="hidden md:inline pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </>
            )}
            {open && (
              <input
                autoFocus
                placeholder="Search files..."
                className="flex-1 bg-transparent outline-none text-foreground"
                onBlur={() => setTimeout(() => setOpen(false), 200)}
              />
            )}
          </button>

          {open && (
            <div className="absolute top-full right-0 mt-2 w-[600px] rounded-lg border bg-popover shadow-md z-50">
              <Command className="rounded-lg border-0">
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup heading="Recent Files">
                    <CommandItem>
                      <span>Example file 1.md</span>
                    </CommandItem>
                    <CommandItem>
                      <span>Example file 2.md</span>
                    </CommandItem>
                    <CommandItem>
                      <span>Example file 3.md</span>
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
