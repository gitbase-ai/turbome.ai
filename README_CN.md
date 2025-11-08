# TurboMe

**语言**: [English](./README.md) | 中文

基于 Markdown 的强大工作空间和知识管理系统，集成 Git 版本控制。

## ✨ 特性

- 📝 **Markdown 优先**: 使用带有 frontmatter 元数据的 markdown 文件组织文档
- 🗂️ **智能工作空间**: 基于 frontmatter 自动组织文件到工作空间
- 🔄 **Git 集成**: 完整的版本控制支持，包含提交历史和差异查看
- 🎨 **富文本编辑器**: 内置 Milkdown 编辑器，支持实时预览
- 🚀 **快速搜索**: 使用 ripgrep 实现强大的文件搜索
- 🔧 **RESTful API**: 全面的 V1 API 支持所有操作
- 💾 **本地存储**: 设置存储在本地以获得更好的性能
- 🎯 **现代化界面**: 使用 shadcn/ui 和 Next.js 15 构建的精美界面

## 📦 安装

```bash
npm install -g turbome
```

## 🚀 快速开始

### 启动服务器

```bash
turbome start
# 或简单使用
turbome
```

服务器默认在 7788 端口启动。打开浏览器访问：
- 前端界面: http://localhost:7788
- API 文档: http://localhost:7788/api-docs

### 命令行选项

```bash
turbome --help        # 显示帮助信息
turbome --version     # 显示版本号
turbome start         # 启动服务器（默认）
```

### 环境变量

```bash
PORT=8080 turbome     # 使用自定义端口（默认：7788）
STORAGE_DIR=/path/to/files turbome  # 设置存储目录
```

## 📚 使用说明

### 仪表盘

访问 `/dashboard` 获取工作空间概览：
- 快速访问所有功能
- 可折叠的侧边栏导航
- 支持移动端和桌面端的响应式设计

### 创建文件

1. 导航到 Explore 页面
2. 在任意工作空间中点击"新建项目"
3. 文件会自动以时间戳作为文件名创建

### 管理工作空间

工作空间基于 markdown frontmatter 中的 `workspace` 字段自动创建：

```markdown
---
workspace: my-project
title: 我的文档
---

# 内容在这里
```

### 转移文件

使用转移按钮在工作空间之间转移文件：
1. 点击文件旁边的转移图标
2. 选择目标工作空间或创建新工作空间
3. 文件的 frontmatter 会自动更新

### 归档文件

通过从工作空间中移除来归档文件：
1. 点击文件上的归档按钮
2. 文件的 workspace frontmatter 被移除
3. 文件保留在文件系统中，但不会在工作空间中显示

## 🛠️ API

TurboMe 提供全面的 RESTful API：

### V1 端点

- `GET /api/v1/workspaces` - 列出所有工作空间
- `GET /api/v1/files/markdown` - 获取 markdown 文件
- `PUT /api/v1/files/markdown` - 保存 markdown 文件
- `PUT /api/v1/files/markdown/frontmatter` - 更新 frontmatter
- `DELETE /api/v1/files/markdown/frontmatter` - 删除 frontmatter 字段

### 示例

```javascript
// 获取所有工作空间
fetch('http://localhost:7788/api/v1/workspaces')
  .then(res => res.json())
  .then(data => console.log(data));
```

## 🏗️ 开发

### 前置要求

- Node.js >= 18
- npm >= 9

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/develop-loop/turbome.ai.git
cd turbome.ai

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

这将启动：
- 前端开发服务器：http://localhost:3000
- 后端开发服务器：http://localhost:7788

### 构建

```bash
npm run build:dist
```

### 测试

```bash
npm test
```

## 🏗️ 架构

### 前端 (client/)
- **框架:** Next.js 15 with TypeScript
- **UI 库:** shadcn/ui (Radix UI + Tailwind CSS)
- **图标:** Lucide React
- **样式:** Tailwind CSS 4
- **特性:** App Router, Turbopack, ESLint

### 后端 (server/)
- **框架:** NestJS with TypeScript
- **特性:** REST API, 启用 CORS, 模块化架构
- **端口:** 3001 (开发环境) / 7788 (生产环境)

### 共享代码 (shared/)
- **类型:** 通用接口和类型定义
- **DTOs:** 带验证的数据传输对象
- **常量:** API 端点、HTTP 状态码等

## 核心特性

- 🎯 **类型安全:** 端到端 TypeScript，共享类型定义
- 🚀 **快速开发:** 前后端热重载
- 📦 **Monorepo:** 使用 npm workspaces 高效管理依赖
- 🔄 **代码共享:** 跨应用共享通用类型和工具函数
- 🎨 **现代技术栈:** 最新版本的 Next.js 和 NestJS
- 🌐 **无 CORS 问题:** 前端代理 API 请求到后端

## API 文档

运行服务器时可访问交互式 Swagger 文档：

### 开发环境
```
http://localhost:3001/api/docs
```

### 生产/CLI 环境
```
http://localhost:7788/api/docs
```

Swagger UI 提供：
- 完整的 API 端点文档
- 请求/响应架构
- 交互式测试界面
- 认证支持（如果配置）

## 📝 配置

设置存储在浏览器的 localStorage 中：

- **草稿路径**: 新文件的默认位置（默认：`./drafts`）

访问设置：http://localhost:7788/settings

## 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。

## 🐛 问题反馈

发现 bug 或有建议？请在 [GitHub Issues](https://github.com/develop-loop/turbome.ai/issues) 提交问题。

## 🙏 致谢

- 使用 [Next.js](https://nextjs.org/) 构建
- 后端由 [NestJS](https://nestjs.com/) 驱动
- UI 组件来自 [shadcn/ui](https://ui.shadcn.com/)
- 编辑器由 [Milkdown](https://milkdown.dev/) 提供
- 搜索由 [ripgrep](https://github.com/BurntSushi/ripgrep) 提供
- 图标来自 [Lucide](https://lucide.dev/)

---

用 ❤️ 制作，来自 TurboMe 贡献者

## 开发与生产模式

### 开发模式
- 前端：Next.js 开发服务器，端口 3000
- 后端：NestJS 开发服务器，端口 3001
- 前端代理 `/api/*` 到后端

```bash
npm run dev
```

### 生产模式
- 单个 NestJS 服务器在端口 7788 上提供所有服务
- 静态前端文件由 NestJS 提供
- API 端点可通过 `/api/*` 访问

```bash
npm run build:dist
./cli/index.js
```

## 发布到 NPM

1. **构建包:**
   ```bash
   npm run build:dist
   ```

2. **检查构建:**
   ```bash
   npm pack
   ```

3. **发布到 npm:**
   ```bash
   npm publish
   ```

## 环境变量

### 开发环境
根据需要创建 `.env.local` 文件：

#### 客户端 (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### 服务端 (.env)
```env
PORT=3001
CLIENT_URL=http://localhost:3000
```

### 生产环境 (CLI)
```env
PORT=7788          # 服务器端口（默认：7788）
NODE_ENV=production # CLI 自动设置
```

## 共享类型和 API 客户端

项目包含共享的 TypeScript 类型和即用型 API 客户端，用于类型安全的前后端通信。

### 在前端中使用

```typescript
import { FilesApiClient, GetFilesResponse } from '@shared/index';

// 创建 API 客户端
const filesApi = new FilesApiClient('/api');

// 类型安全的 API 调用
const response: GetFilesResponse = await filesApi.getFile('test.txt');
const multipleFiles = await filesApi.getFiles({
  file_paths: ['file1.txt', 'file2.txt'],
  encoding: 'text'
});

// 保存文件，完全类型安全
await filesApi.saveFile({
  file_path: 'new-file.txt',
  content: 'Hello World',
  commit_message: '创建新文件'
});
```

### 共享类型包括

- **请求/响应类型**: `GetFilesRequest`, `SaveFileRequest` 等
- **数据模型**: `FileInfo`, `MultipleFilesResponse` 等
- **API 客户端**: 包含所有方法的 `FilesApiClient`
- **通用类型**: `ApiResponse`, `User` 等

### 优势

- ✅ **类型安全**: IntelliSense 和编译时检查
- ✅ **一致性**: 前后端使用相同的类型
- ✅ **开发体验**: 更好的自动补全
- ✅ **可维护性**: API 契约的单一真实来源

## 文件存储

### 开发环境
- **必需**: 必须设置 `STORAGE_DIR` 环境变量
- **示例**: `STORAGE_DIR=/path/to/files npm run dev`
- **错误**: 开发环境中没有 `STORAGE_DIR` 将无法启动服务器

### 生产/CLI 环境
- **默认**: 执行 CLI 的当前工作目录
- **示例**:
  ```bash
  # 文件存储在当前目录
  turbome
  ```

## 常见问题

### 如何更改存储目录？

开发环境：
```bash
STORAGE_DIR=/your/path npm run dev
```

生产环境：
```bash
cd /your/path
turbome
```

### 如何更改端口？

```bash
PORT=8080 turbome
```

### 如何查看所有可用的 API？

访问 Swagger 文档：http://localhost:7788/api/docs

---

[返回顶部](#turbome)
