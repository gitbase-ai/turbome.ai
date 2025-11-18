# TurboMe

[English](#english) | [中文](#chinese)

---

<a id="english"></a>

**Language**: English | [中文](./README_CN.md)

A powerful markdown-based workspace and knowledge management system with Git integration.

## ✨ Features

- 📝 **Markdown-First**: Organize your documents using markdown files with frontmatter metadata
- 🗂️ **Smart Workspaces**: Automatically organize files into workspaces based on frontmatter
- 🔄 **Git Integration**: Full version control support with commit history and diff viewing
- 🎨 **Rich Editor**: Built-in Milkdown editor with live preview
- 🚀 **Fast Search**: Powerful file search using ripgrep
- 🔧 **RESTful API**: Comprehensive V1 API for all operations
- 💾 **Local Storage**: Settings stored locally for better performance
- 🎯 **Modern UI**: Beautiful interface built with shadcn/ui and Next.js 15

## 📦 Installation

```bash
npm install -g turbome
```

## 🚀 Quick Start

### Start the server

```bash
turbome start
# or simply
turbome
```

The server will start on port 7788 by default. Open your browser and navigate to:
- Frontend: http://localhost:7788
- API Documentation: http://localhost:7788/api-docs

### Command Line Options

```bash
turbome --help        # Show help
turbome --version     # Show version
turbome start         # Start the server (default)
```

### Environment Variables

```bash
PORT=8080 turbome     # Use custom port (default: 7788)
STORAGE_DIR=/path/to/files turbome  # Set storage directory
```

## 📚 Usage

### Dashboard

Access the dashboard at `/dashboard` to get an overview of your workspace:
- Quick access to all features
- Collapsible sidebar navigation
- Responsive design for mobile and desktop

### Creating Files

1. Navigate to the Explore page
2. Click "New Item" in any workspace
3. Files are automatically created with timestamps as filenames

### Managing Workspaces

Workspaces are automatically created based on the `workspace` field in markdown frontmatter:

```markdown
---
workspace: my-project
title: My Document
---

# Content here
```

### Transferring Files

Files can be transferred between workspaces using the transfer button:
1. Click the transfer icon next to any file
2. Select target workspace or create a new one
3. File's frontmatter is automatically updated

### Archiving Files

Archive files by removing them from workspaces:
1. Click the archive button on any file
2. The file's workspace frontmatter is removed
3. File remains in the filesystem but not shown in workspaces

## 🛠️ API

TurboMe provides a comprehensive RESTful API:

### V2 Endpoints

- `GET /api/v2/repos/:domain/:owner/:repo/workspaces` - List all workspaces
- `GET /api/v2/repos/:domain/:owner/:repo/content/:path*` - Get file content
- `PUT /api/v2/repos/:domain/:owner/:repo/content/:path*` - Save file content
- `PUT /api/v2/repos/:domain/:owner/:repo/content/:path*/frontmatter` - Update frontmatter
- `DELETE /api/v2/repos/:domain/:owner/:repo/content/:path*/frontmatter` - Delete frontmatter
- `GET /api/v2/repos/:domain/:owner/:repo/search` - Search files
- `POST /api/v2/repos/:domain/:owner/:repo/trees` - Rename files

### Example

```javascript
// Get all workspaces
fetch('http://localhost:7788/api/v2/repos/github.com/owner/repo/workspaces')
  .then(res => res.json())
  .then(data => console.log(data));
```

## 🏗️ Development

### Prerequisites

- Node.js >= 18
- npm >= 9

### Local Development

```bash
# Clone the repository
git clone https://github.com/develop-loop/turbome.ai.git
cd turbome.ai

# Install dependencies
npm install

# Start development servers
npm run dev
```

This starts:
- Frontend dev server on http://localhost:3000
- Backend dev server on http://localhost:7788

### Building

```bash
npm run build:dist
```

### Testing

```bash
npm test
```

## 🏗️ Architecture

### Frontend (client/)
- **Framework:** Next.js 15 with TypeScript
- **UI Library:** shadcn/ui (Radix UI + Tailwind CSS)
- **Icons:** Lucide React
- **Styling:** Tailwind CSS 4
- **Features:** App Router, Turbopack, ESLint

### Backend (server/)
- **Framework:** NestJS with TypeScript
- **Features:** REST API, CORS enabled, modular architecture
- **Port:** 3001 (dev) / 7788 (prod)

### Shared (shared/)
- **Types:** Common interfaces and types
- **DTOs:** Data Transfer Objects with validation
- **Constants:** API endpoints, HTTP status codes, etc.

## Key Features

- 🎯 **Type Safety:** End-to-end TypeScript with shared types
- 🚀 **Fast Development:** Hot reloading for both frontend and backend
- 📦 **Monorepo:** Efficient dependency management with npm workspaces
- 🔄 **Code Sharing:** Common types and utilities across applications
- 🎨 **Modern Stack:** Latest versions of Next.js and NestJS
- 🌐 **No CORS Issues:** Frontend proxies API requests to backend

## API Documentation

Interactive Swagger documentation is available when running the server:

### Development Environment
```
http://localhost:3001/api/docs
```

### Production/CLI Environment
```
http://localhost:7788/api/docs
```

The Swagger UI provides:
- Complete API endpoint documentation
- Request/response schemas
- Interactive testing interface
- Authentication support (if configured)

## 📝 Configuration

Settings are stored in browser localStorage:

- **Draft Path**: Default location for new files (default: `./drafts`)

Access settings at: http://localhost:7788/settings

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🐛 Issues

Found a bug or have a suggestion? Please open an issue at [GitHub Issues](https://github.com/develop-loop/turbome.ai/issues).

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Backend powered by [NestJS](https://nestjs.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Editor powered by [Milkdown](https://milkdown.dev/)
- Search powered by [ripgrep](https://github.com/BurntSushi/ripgrep)
- Icons from [Lucide](https://lucide.dev/)

---

Made with ❤️ by TurboMe Contributors

---

<a id="chinese"></a>

**语言**: [English](./README.md) | 中文

查看完整中文文档: [README_CN.md](./README_CN.md)
