"use client"

import { PageHeader } from "@/components/page-header"
import { useEffect, useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface SwaggerSpec {
  info?: {
    title?: string
    description?: string
    version?: string
  }
  paths?: Record<string, Record<string, SwaggerEndpoint>>
}

interface SwaggerEndpoint {
  summary?: string
  description?: string
  tags?: string[]
  parameters?: SwaggerParameter[]
  requestBody?: Record<string, unknown>
  responses?: Record<string, SwaggerResponse>
}

interface SwaggerParameter {
  name: string
  in: string
  required?: boolean
  description?: string
  schema?: {
    type?: string
  }
}

interface SwaggerResponse {
  description?: string
}

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<SwaggerSpec | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch("/api/docs-json")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        }
        return res.json()
      })
      .then(setSpec)
      .catch((err) => {
        console.error("Failed to load API documentation:", err)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [])

  const togglePath = (pathKey: string) => {
    setExpandedPaths((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(pathKey)) {
        newSet.delete(pathKey)
      } else {
        newSet.add(pathKey)
      }
      return newSet
    })
  }

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      get: "bg-blue-100 text-blue-800 border-blue-200",
      post: "bg-green-100 text-green-800 border-green-200",
      put: "bg-yellow-100 text-yellow-800 border-yellow-200",
      delete: "bg-red-100 text-red-800 border-red-200",
      patch: "bg-purple-100 text-purple-800 border-purple-200",
    }
    return colors[method.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  if (loading) {
    return (
      <>
        <PageHeader currentPage="API Documentation" />
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading API Documentation...</p>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader currentPage="API Documentation" />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
            <h2 className="text-lg font-semibold text-destructive mb-2">
              Failed to Load API Documentation
            </h2>
            <p className="text-destructive/80 mb-4">Error: {error}</p>

            <div className="bg-background p-4 rounded border">
              <h3 className="font-medium mb-2">Alternative Access:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="font-mono bg-muted px-2 py-1 rounded">Development:</span>
                  <a
                    href="http://localhost:3001/api/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    http://localhost:3001/api/docs
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono bg-muted px-2 py-1 rounded">Production:</span>
                  <a
                    href="http://localhost:7788/api/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    http://localhost:7788/api/docs
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!spec || !spec.paths) {
    return (
      <>
        <PageHeader currentPage="API Documentation" />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <p className="text-muted-foreground">No API documentation available.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader currentPage="API Documentation" />
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* API Info Header */}
        <div className="rounded-lg border bg-card p-6">
          <h1 className="text-2xl font-bold mb-2">{spec.info?.title || "API Documentation"}</h1>
          <p className="text-muted-foreground mb-4">{spec.info?.description || ""}</p>
          {spec.info?.version && (
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm">
              Version: <span className="ml-1 font-mono">{spec.info.version}</span>
            </div>
          )}
        </div>

        {/* API Endpoints */}
        <div className="space-y-2">
          {Object.entries(spec.paths).map(([path, methods]) => {
            return Object.entries(methods).map(([method, endpoint]) => {
              const pathKey = `${method}-${path}`
              const isExpanded = expandedPaths.has(pathKey)

              return (
                <div key={pathKey} className="rounded-lg border bg-card overflow-hidden">
                  <button
                    onClick={() => togglePath(pathKey)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    )}
                    <span
                      className={cn(
                        "px-2 py-1 rounded border font-mono text-xs font-semibold uppercase shrink-0",
                        getMethodColor(method)
                      )}
                    >
                      {method}
                    </span>
                    <code className="font-mono text-sm flex-1">{path}</code>
                    {endpoint.summary && (
                      <span className="text-muted-foreground text-sm hidden md:block">
                        {endpoint.summary}
                      </span>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t bg-muted/30 p-4 space-y-4">
                      {endpoint.summary && (
                        <div>
                          <h4 className="font-semibold mb-1">Summary</h4>
                          <p className="text-sm">{endpoint.summary}</p>
                        </div>
                      )}

                      {endpoint.description && (
                        <div>
                          <h4 className="font-semibold mb-1">Description</h4>
                          <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                        </div>
                      )}

                      {endpoint.parameters && endpoint.parameters.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Parameters</h4>
                          <div className="space-y-2">
                            {endpoint.parameters.map((param, idx: number) => (
                              <div key={idx} className="bg-background rounded p-3 text-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <code className="font-mono font-semibold">{param.name}</code>
                                  <span className="text-xs px-2 py-0.5 rounded bg-muted">
                                    {param.in}
                                  </span>
                                  {param.required && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-destructive/20 text-destructive">
                                      required
                                    </span>
                                  )}
                                </div>
                                {param.description && (
                                  <p className="text-muted-foreground">{param.description}</p>
                                )}
                                {param.schema?.type && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Type: <code>{param.schema.type}</code>
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {endpoint.requestBody && (
                        <div>
                          <h4 className="font-semibold mb-2">Request Body</h4>
                          <div className="bg-background rounded p-3">
                            <pre className="text-xs overflow-auto">
                              {JSON.stringify(endpoint.requestBody, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                      {endpoint.responses && (
                        <div>
                          <h4 className="font-semibold mb-2">Responses</h4>
                          <div className="space-y-2">
                            {Object.entries(endpoint.responses).map(([code, response]) => (
                              <div key={code} className="bg-background rounded p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono font-semibold">{code}</span>
                                  {response.description && (
                                    <span className="text-sm text-muted-foreground">
                                      {response.description}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          })}
        </div>
      </div>
    </>
  )
}
