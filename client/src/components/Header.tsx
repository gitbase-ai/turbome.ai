'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Menu, Search, X, Clock, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

const analyticsItems = [
  { name: 'Timeline', description: 'View git commit history and project timeline', href: '/timeline', icon: Clock },
]

interface SearchResult {
  type: 'file' | 'content'
  path: string
  filename: string
  line?: number
  content?: string
  matchedText?: string
  score: number
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 执行搜索
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`)
      const data = await response.json()

      if (data.success) {
        setSearchResults(data.data.results)
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // 处理搜索输入变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    setShowResults(true)

    // 清除之前的定时器
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // 设置新的定时器，300ms 后执行搜索
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query)
    }, 300)
  }

  // 处理搜索结果点击
  const handleResultClick = (result: SearchResult) => {
    setShowResults(false)
    setSearchQuery('')
    // 这里可以添加打开文件的逻辑
    console.log('Selected result:', result)
  }

  // 处理点击外部关闭搜索结果
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  return (
    <header className="bg-white dark:bg-gray-900 border-b">
      <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8">
        <div className="flex items-center lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 mr-4">
            <span className="sr-only">TurboMe</span>
            <div className="h-8 w-8 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">TM</span>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="relative hidden lg:block lg:max-w-md lg:flex-1" ref={searchContainerRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10"
                placeholder="Search files and content..."
                autoComplete="off"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && (searchResults.length > 0 || searchQuery.trim()) && (
              <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                {searchResults.length > 0 ? (
                  searchResults.map((result, index) => (
                    <button
                      key={`${result.path}-${index}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            result.type === 'file'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {result.type === 'file' ? 'File' : 'Content'}
                          </span>
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {result.filename}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {result.path}
                            {result.line && ` (line ${result.line})`}
                          </p>
                          {result.matchedText && (
                            <p className="text-xs text-gray-600 dark:text-gray-300 truncate mt-1">
                              {result.matchedText}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                ) : searchQuery.trim() && !isSearching ? (
                  <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    No results found for &quot;{searchQuery}&quot;
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open main menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex items-center justify-between mb-6">
                <Link href="/" className="-m-1.5 p-1.5">
                  <span className="sr-only">TurboMe</span>
                  <div className="h-8 w-8 bg-indigo-600 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-sm">TM</span>
                  </div>
                </Link>
              </div>

              <div className="space-y-2">
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    Dashboard
                  </Button>
                </Link>

                <Collapsible open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between">
                      Analytics
                      <ChevronDown className={`h-4 w-4 transition-transform ${analyticsOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2 pl-4">
                    {analyticsItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>

                <Link href="/conversation" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    Conversation
                  </Button>
                </Link>
                <Link href="/api-docs" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    API
                  </Button>
                </Link>
                <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    Settings
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:gap-x-8 lg:ml-auto lg:mr-8">
          <Link href="/dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="gap-x-1">
                Analytics
                <ChevronDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                {analyticsItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="group flex items-center gap-x-4 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white dark:bg-gray-800 dark:group-hover:bg-gray-700">
                      <item.icon className="h-6 w-6 text-gray-600 group-hover:text-indigo-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Link href="/conversation">
            <Button variant="ghost">Conversation</Button>
          </Link>
          <Link href="/api-docs">
            <Button variant="ghost">API</Button>
          </Link>
        </div>

        <div className="hidden lg:flex">
          <Link href="/settings">
            <Button variant="ghost">Settings</Button>
          </Link>
        </div>
      </nav>
    </header>
  )
}
