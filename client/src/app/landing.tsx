"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  FolderTree,
  Search,
  GitBranch,
  Move,
  Folders,
  Database,
  Share2,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ArrowRight,
  Sparkles,
  History,
  Network,
  Shield
} from "lucide-react"
import Link from "next/link"

export function Landing() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              TurboMe
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground font-medium">
              基于Git+AI的自我管理平台
            </p>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              利用Git结构化管理知识库，通过AI让知识结构自动演进。
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" asChild>
                <Link href="/workspace">
                  开始使用
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/api-docs">
                  查看 API 文档
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Value Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">为什么使用 Git 管理知识库？</h2>
            <p className="text-lg text-muted-foreground">
              Git 不仅是代码管理工具，更是思维演进的时光机。让知识的成长过程可追溯、可回溯、可协作。
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <History className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>思考回溯</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  每一次保存都是一个思维快照，通过 Git 历史回放整个知识的演变过程，重现你的思考轨迹。
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Network className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>结构演进</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  将知识按文件系统目录结构整理，配合 AI Code 模型，像迭代代码一样系统化地优化知识架构。
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>安全可控</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  数据完全本地化，满足合规需求。同时支持 GitHub、GitLab 等平台实现跨设备同步与团队协作。
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">核心功能</h2>
          </div>

          <div className="max-w-6xl mx-auto">
            <Card className="overflow-hidden">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Left: Workspace Preview */}
                <div className="bg-muted/50 p-8 flex items-center justify-center border-r">
                  <div className="w-full max-w-md space-y-4">
                    {/* Tabs Skeleton */}
                    <div className="flex gap-2 p-1 bg-background rounded-lg">
                      <div className="h-8 bg-primary/20 rounded px-4 flex items-center">
                        <div className="h-3 w-16 bg-primary/40 rounded"></div>
                      </div>
                      <div className="h-8 bg-muted rounded px-4 flex items-center">
                        <div className="h-3 w-16 bg-muted-foreground/20 rounded"></div>
                      </div>
                      <div className="h-8 bg-muted rounded px-4 flex items-center">
                        <div className="h-3 w-16 bg-muted-foreground/20 rounded"></div>
                      </div>
                    </div>

                    {/* Cards Grid Skeleton */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* First Column - 3 cards, last one collapsed */}
                      <div className="space-y-3">
                        <div className="bg-background rounded-lg p-4 space-y-3 border">
                          <div className="h-5 bg-muted-foreground/10 rounded w-24"></div>
                          <div className="space-y-2">
                            {[1, 2, 3].map((j) => (
                              <div key={j} className="flex items-center gap-2">
                                <div className="h-3 w-3 bg-muted-foreground/10 rounded"></div>
                                <div className="h-3 bg-muted-foreground/10 rounded flex-1"></div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-background rounded-lg p-4 space-y-3 border">
                          <div className="h-5 bg-muted-foreground/10 rounded w-24"></div>
                          <div className="space-y-2">
                            {[1, 2, 3].map((j) => (
                              <div key={j} className="flex items-center gap-2">
                                <div className="h-3 w-3 bg-muted-foreground/10 rounded"></div>
                                <div className="h-3 bg-muted-foreground/10 rounded flex-1"></div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Collapsed card */}
                        <div className="bg-background rounded-lg p-4 border h-14"></div>
                      </div>

                      {/* Second Column - collapsed, expanded, collapsed */}
                      <div className="space-y-3">
                        {/* Collapsed card */}
                        <div className="bg-background rounded-lg p-4 border h-14"></div>

                        <div className="bg-background rounded-lg p-4 space-y-3 border">
                          <div className="h-5 bg-muted-foreground/10 rounded w-24"></div>
                          <div className="space-y-2">
                            {[1, 2, 3].map((j) => (
                              <div key={j} className="flex items-center gap-2">
                                <div className="h-3 w-3 bg-muted-foreground/10 rounded"></div>
                                <div className="h-3 bg-muted-foreground/10 rounded flex-1"></div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Collapsed card */}
                        <div className="bg-background rounded-lg p-4 border h-14"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Feature Description */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold mb-3">工作空间</h3>
                      <p className="text-muted-foreground text-lg mb-6">
                        超越传统文件目录，构建面向人类认知的专注空间。如同大模型的注意力机制，让你的思维聚焦于当下最重要的知识上下文。
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Folders className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">自动分组</h4>
                          <p className="text-sm text-muted-foreground">
                            按 workspace 字段自动分组，支持同时查看多个工作空间
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Markdown 编辑</h4>
                          <p className="text-sm text-muted-foreground">
                            集成 Milkdown 编辑器，支持实时预览和代码高亮
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Search className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">全文搜索</h4>
                          <p className="text-sm text-muted-foreground">
                            基于 ripgrep 的毫秒级搜索，支持文件名和内容搜索
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <GitBranch className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Git 集成</h4>
                          <p className="text-sm text-muted-foreground">
                            每次保存自动创建提交，完整的版本历史追踪
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Move className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">灵活操作</h4>
                          <p className="text-sm text-muted-foreground">
                            支持文件移动、重命名、归档等操作，状态实时同步
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">与传统工具的区别</h2>
            <p className="text-lg text-muted-foreground">
              专为思考者优化的AI时代解决方案
            </p>
          </div>

          <div className="max-w-6xl mx-auto overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">特性</th>
                  <th className="text-center p-4 font-semibold bg-primary/5">TurboMe</th>
                  <th className="text-center p-4 font-semibold">传统文件管理器</th>
                  <th className="text-center p-4 font-semibold">Obsidian</th>
                  <th className="text-center p-4 font-semibold">Notion</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/30">
                  <td className="p-4 font-medium">数据存储</td>
                  <td className="text-center p-4 bg-primary/5">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span>本地 Git</span>
                    </div>
                  </td>
                  <td className="text-center p-4">本地文件系统</td>
                  <td className="text-center p-4">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span>本地 Markdown</span>
                    </div>
                  </td>
                  <td className="text-center p-4">云端数据库</td>
                </tr>
                <tr className="border-b hover:bg-muted/30">
                  <td className="p-4 font-medium">分类方式</td>
                  <td className="text-center p-4 bg-primary/5">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span>元数据标签</span>
                    </div>
                  </td>
                  <td className="text-center p-4">文件夹层级</td>
                  <td className="text-center p-4">文件夹 + 标签</td>
                  <td className="text-center p-4">数据库属性</td>
                </tr>
                <tr className="border-b hover:bg-muted/30">
                  <td className="p-4 font-medium">版本控制</td>
                  <td className="text-center p-4 bg-primary/5">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span>原生 Git</span>
                    </div>
                  </td>
                  <td className="text-center p-4">
                    <div className="flex items-center justify-center gap-2">
                      <MinusCircle className="w-5 h-5 text-yellow-600" />
                      <span>需额外配置</span>
                    </div>
                  </td>
                  <td className="text-center p-4">
                    <div className="flex items-center justify-center gap-2">
                      <MinusCircle className="w-5 h-5 text-yellow-600" />
                      <span>插件支持</span>
                    </div>
                  </td>
                  <td className="text-center p-4">平台内置</td>
                </tr>
                <tr className="border-b hover:bg-muted/30">
                  <td className="p-4 font-medium">AI 集成</td>
                  <td className="text-center p-4 bg-primary/5">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span>原生支持</span>
                    </div>
                  </td>
                  <td className="text-center p-4">
                    <div className="flex items-center justify-center gap-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span>不支持</span>
                    </div>
                  </td>
                  <td className="text-center p-4">
                    <div className="flex items-center justify-center gap-2">
                      <MinusCircle className="w-5 h-5 text-yellow-600" />
                      <span>插件支持</span>
                    </div>
                  </td>
                  <td className="text-center p-4">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span>内置 AI</span>
                    </div>
                  </td>
                </tr>
                <tr className="border-b hover:bg-muted/30">
                  <td className="p-4 font-medium">离线使用</td>
                  <td className="text-center p-4 bg-primary/5">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span>完全支持</span>
                    </div>
                  </td>
                  <td className="text-center p-4">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span>完全支持</span>
                    </div>
                  </td>
                  <td className="text-center p-4">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span>完全支持</span>
                    </div>
                  </td>
                  <td className="text-center p-4">
                    <div className="flex items-center justify-center gap-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span>受限</span>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="p-4 font-medium">协作方式</td>
                  <td className="text-center p-4 bg-primary/5">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span>Git 协作</span>
                    </div>
                  </td>
                  <td className="text-center p-4">文件共享</td>
                  <td className="text-center p-4">
                    <div className="flex items-center justify-center gap-2">
                      <MinusCircle className="w-5 h-5 text-yellow-600" />
                      <span>插件协作</span>
                    </div>
                  </td>
                  <td className="text-center p-4">实时协作</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">典型工作流程</h2>
            <p className="text-lg text-muted-foreground">
              六步开始您的知识管理之旅
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <CardTitle>初始化</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  通过 CLI 工具 <code className="bg-muted px-2 py-1 rounded">turbome</code> 启动服务，自动扫描当前 Git 仓库
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <CardTitle>查看</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  打开 <code className="bg-muted px-2 py-1 rounded">http://localhost:7788</code>，所有工作空间自动展示
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <CardTitle>搜索</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  顶部搜索框输入关键词，快速找到相关文档，支持文件名和内容搜索
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    4
                  </div>
                  <CardTitle>编辑</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  点击文件打开 Milkdown 编辑器，所见即所得编辑，自动保存并提交到 Git
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    5
                  </div>
                  <CardTitle>移动</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  右键菜单选择 &ldquo;Move to&rdquo;，将文件转移到其他工作空间，frontmatter 自动更新
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    6
                  </div>
                  <CardTitle>归档</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  点击归档按钮，移除 workspace 标签但保留文件，保持仓库整洁
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>Made with ❤️ by TurboMe Contributors</p>
            <p className="mt-2">
              MIT License • <Link href="https://github.com/develop-loop/turbome.ai" className="hover:text-foreground underline">GitHub</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
