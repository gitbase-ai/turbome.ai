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
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger> & {
  onArchive?: () => void
}) {
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
          {/* Archive 按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onArchive?.()
            }}
            className="focus-visible:border-ring focus-visible:ring-ring/50 flex items-center justify-center rounded-md p-2 transition-all outline-none hover:bg-muted focus-visible:ring-[3px]"
            title="Archive"
          >
            <Archive className="text-muted-foreground size-4" />
          </button>

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
