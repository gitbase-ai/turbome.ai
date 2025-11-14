'use client'

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Crepe } from '@milkdown/crepe'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
import './MilkdownEditor.css'

interface MilkdownEditorProps {
  content: string
  fileType?: string
  readOnly?: boolean
  className?: string
  onChange?: (content: string) => void
}

export interface MilkdownEditorRef {
  getContent: () => string
  setContent: (content: string) => void
}

// Get appropriate language for syntax highlighting
const getLanguageFromFileType = (type: string): string => {
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'jsx': 'jsx',
    'tsx': 'tsx',
    'json': 'json',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'sh': 'bash',
    'sql': 'sql',
    'xml': 'xml',
    'txt': 'text'
  }
  return languageMap[type.toLowerCase()] || 'text'
}

const MilkdownEditor = forwardRef<MilkdownEditorRef, MilkdownEditorProps>(({ 
  content, 
  fileType = 'text', 
  readOnly = false,
  className = '',
  onChange
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const crepeRef = useRef<Crepe | null>(null)

  useImperativeHandle(ref, () => ({
    getContent: () => {
      if (crepeRef.current) {
        try {
          return crepeRef.current.getMarkdown()
        } catch (error) {
          console.error('Error getting content from Milkdown:', error)
          return content // fallback to original content
        }
      }
      return content // fallback to original content
    },
    setContent: (newContent: string) => {
      // For now, setContent is not supported in this version of Crepe
      // This would require reinitializing the editor with new content
      console.warn('setContent not implemented - would require editor reinitialization')
    }
  }))

  useEffect(() => {
    if (!editorRef.current) return

    // Prevent multiple initializations
    if (crepeRef.current) return

    const initEditor = async () => {
      try {
        // Clear the container first
        if (editorRef.current) {
          editorRef.current.innerHTML = ''
        }

        // For markdown files, use content as-is
        // For other files, wrap in code block
        let editorContent = content
        if (fileType !== 'md' && fileType !== 'markdown' && 
            !content.includes('#') && !content.includes('```')) {
          const language = getLanguageFromFileType(fileType)
          editorContent = `\`\`\`${language}\n${content}\n\`\`\``
        }

        const crepe = new Crepe({
          root: editorRef.current,
          defaultValue: editorContent
        })

        await crepe.create()
        crepeRef.current = crepe

        // Note: Change listeners are not supported in this version of Crepe
        // Content changes would need to be handled through manual polling or other methods
        if (onChange) {
          console.warn('onChange callback not supported in this Crepe version')
        }

      } catch (err) {
        console.error('Failed to initialize Milkdown Crepe editor:', err)
        // Fallback to simple display
        if (editorRef.current) {
          editorRef.current.innerHTML = `<pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm font-mono">${content}</pre>`
        }
      }
    }

    const timeoutId = setTimeout(initEditor, 0)

    return () => {
      clearTimeout(timeoutId)
      if (crepeRef.current) {
        try {
          crepeRef.current.destroy()
        } catch {
          // Ignore cleanup errors
        }
        crepeRef.current = null
      }
    }
  }, [content, fileType, readOnly, onChange])

  return (
    <div className={className}>
      <div 
        ref={editorRef} 
        className="milkdown-editor-wrapper"
      />
    </div>
  )
})

MilkdownEditor.displayName = 'MilkdownEditor'

export default MilkdownEditor