"use client"

import { PageHeader } from "@/components/page-header"
import { MultiSelectTabs } from "./multi-select-tabs"

export default function Page() {
  const tabs = [
    { id: "tab1", label: "Overview" },
    { id: "tab2", label: "Projects" },
    { id: "tab3", label: "Documents" },
    { id: "tab4", label: "Tasks" },
    { id: "tab5", label: "Calendar" },
  ]

  const handleSelectionChange = (selectedIds: string[]) => {
    console.log("Selected tabs:", selectedIds)
  }

  return (
    <>
      <PageHeader currentPage="Workspace" />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <MultiSelectTabs
          tabs={tabs}
          defaultSelected={["tab1"]}
          maxSelected={4}
          onSelectionChange={handleSelectionChange}
        />
      </div>
    </>
  )
}
