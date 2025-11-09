"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  FileAccordion,
  FileAccordionContent,
  FileAccordionItem,
  FileAccordionTrigger,
} from "./file-accordion"

interface Tab {
  id: string
  label: string
}

interface MultiSelectTabsProps {
  tabs: Tab[]
  defaultSelected?: string[]
  maxSelected?: number
  onSelectionChange?: (selectedIds: string[]) => void
}

export function MultiSelectTabs({
  tabs,
  defaultSelected = [],
  maxSelected = 4,
  onSelectionChange,
}: MultiSelectTabsProps) {
  const [selectedTabs, setSelectedTabs] = useState<string[]>(
    defaultSelected.length > 0 ? defaultSelected : [tabs[0]?.id]
  )

  const toggleTab = (tabId: string) => {
    setSelectedTabs((prev) => {
      let newSelection: string[]

      if (prev.includes(tabId)) {
        // 至少保留一个选中项
        if (prev.length === 1) return prev
        newSelection = prev.filter((id) => id !== tabId)
      } else {
        // 检查是否超过最大选中数量
        if (prev.length >= maxSelected) {
          return prev
        }
        newSelection = [...prev, tabId]
      }

      // 回调通知父组件
      if (onSelectionChange) {
        onSelectionChange(newSelection)
      }

      return newSelection
    })
  }

  return (
    <div className="space-y-4">
      {/* Multi-select Tabs */}
      <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => toggleTab(tab.id)}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:pointer-events-none disabled:opacity-50",
              selectedTabs.includes(tab.id)
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content based on selected tabs */}
      <div
        className="grid gap-4 items-start"
        style={{
          gridTemplateColumns: `repeat(${selectedTabs.length}, minmax(0, 1fr))`
        }}
      >
        {selectedTabs.map((tabId) => {
          const tab = tabs.find((t) => t.id === tabId)
          return (
            <div
              key={tabId}
              className="rounded-xl border bg-card p-6 text-card-foreground shadow"
            >
              <h3 className="text-lg font-semibold mb-4">{tab?.label}</h3>
              <FileAccordion type="multiple" className="w-full">
                {Array.from({ length: 10 }, (_, i) => (
                  <FileAccordionItem key={i} value={`item-${i + 1}`}>
                    <FileAccordionTrigger
                      onArchive={() => {
                        console.log(`Archive ${tab?.label} Item ${i + 1}`)
                      }}
                    >
                      {tab?.label} Item {i + 1}
                    </FileAccordionTrigger>
                    <FileAccordionContent>
                      <div className="text-sm text-muted-foreground">
                        This is the content for {tab?.label} Item {i + 1}. You can add
                        any content here.
                      </div>
                    </FileAccordionContent>
                  </FileAccordionItem>
                ))}
              </FileAccordion>
            </div>
          )
        })}
      </div>
    </div>
  )
}
