"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronRight, Archive, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
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
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger> & {
  onArchive?: () => void
  isArchiving?: boolean
}) {
  const [archivePopoverOpen, setArchivePopoverOpen] = React.useState(false)

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
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Move to...</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </AccordionPrimitive.Header>
  )
}

function FileAccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
      {...props}
    >
      <div className={cn("pt-0 pb-4 pl-10", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { FileAccordion, FileAccordionItem, FileAccordionTrigger, FileAccordionContent }
