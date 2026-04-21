"use client"

import { useState, useRef, useCallback } from "react"

interface EmailEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function EmailEditor({ value, onChange, placeholder = "Start writing your email..." }: EmailEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkText, setLinkText] = useState("")
  const [savedSelection, setSavedSelection] = useState<Range | null>(null)

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const saveSelection = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      setSavedSelection(selection.getRangeAt(0).cloneRange())
    }
  }, [])

  const restoreSelection = useCallback(() => {
    if (savedSelection) {
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(savedSelection)
      }
    }
  }, [savedSelection])

  const openLinkModal = useCallback(() => {
    saveSelection()
    const selection = window.getSelection()
    if (selection && selection.toString()) {
      setLinkText(selection.toString())
    }
    setShowLinkModal(true)
  }, [saveSelection])

  const insertLink = useCallback(() => {
    if (linkUrl) {
      restoreSelection()
      if (linkText && !window.getSelection()?.toString()) {
        document.execCommand('insertHTML', false, `<a href="${linkUrl}" style="color: #5046e5; text-decoration: underline;">${linkText}</a>`)
      } else {
        document.execCommand('createLink', false, linkUrl)
        // Style the link
        const selection = window.getSelection()
        if (selection && selection.anchorNode) {
          const link = selection.anchorNode.parentElement
          if (link?.tagName === 'A') {
            link.style.color = '#5046e5'
            link.style.textDecoration = 'underline'
          }
        }
      }
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML)
      }
    }
    setShowLinkModal(false)
    setLinkUrl("")
    setLinkText("")
    editorRef.current?.focus()
  }, [linkUrl, linkText, restoreSelection, onChange])

  const setTextColor = useCallback((color: string) => {
    execCommand('foreColor', color)
  }, [execCommand])

  const setFontSize = useCallback((size: string) => {
    execCommand('fontSize', size)
  }, [execCommand])

  const insertDivider = useCallback(() => {
    execCommand('insertHTML', '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />')
  }, [execCommand])

  const colors = [
    { name: 'Black', value: '#000000' },
    { name: 'Gray', value: '#6b7280' },
    { name: 'Red', value: '#dc2626' },
    { name: 'Orange', value: '#ea580c' },
    { name: 'Green', value: '#16a34a' },
    { name: 'Blue', value: '#2563eb' },
    { name: 'Purple', value: '#7c3aed' },
    { name: 'Pink', value: '#db2777' },
  ]

  return (
    <div className="border border-input rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-input bg-muted/30">
        {/* Text formatting */}
        <div className="flex items-center gap-1 pr-2 border-r border-input">
          <button
            type="button"
            onClick={() => execCommand('bold')}
            className="p-2 rounded hover:bg-muted transition-colors"
            title="Bold (Ctrl+B)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => execCommand('italic')}
            className="p-2 rounded hover:bg-muted transition-colors"
            title="Italic (Ctrl+I)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h4m-2 0l-4 16m0 0h4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => execCommand('underline')}
            className="p-2 rounded hover:bg-muted transition-colors"
            title="Underline (Ctrl+U)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v7a5 5 0 0010 0V4M5 21h14" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => execCommand('strikeThrough')}
            className="p-2 rounded hover:bg-muted transition-colors"
            title="Strikethrough"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.5 10H6.5m11 0a3.5 3.5 0 01-3.5 3.5H10a3.5 3.5 0 01-3.5-3.5m11 0a3.5 3.5 0 00-3.5-3.5H10A3.5 3.5 0 006.5 10m11 4H6.5" />
            </svg>
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 pr-2 border-r border-input">
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<h1>')}
            className="px-2 py-1 rounded hover:bg-muted transition-colors text-sm font-bold"
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<h2>')}
            className="px-2 py-1 rounded hover:bg-muted transition-colors text-sm font-bold"
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<h3>')}
            className="px-2 py-1 rounded hover:bg-muted transition-colors text-sm font-semibold"
            title="Heading 3"
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<p>')}
            className="px-2 py-1 rounded hover:bg-muted transition-colors text-sm"
            title="Paragraph"
          >
            P
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 pr-2 border-r border-input">
          <button
            type="button"
            onClick={() => execCommand('insertUnorderedList')}
            className="p-2 rounded hover:bg-muted transition-colors"
            title="Bullet List"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              <circle cx="2" cy="6" r="1" fill="currentColor" />
              <circle cx="2" cy="12" r="1" fill="currentColor" />
              <circle cx="2" cy="18" r="1" fill="currentColor" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => execCommand('insertOrderedList')}
            className="p-2 rounded hover:bg-muted transition-colors"
            title="Numbered List"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h13M7 12h13M7 18h13" />
              <text x="2" y="8" fontSize="8" fill="currentColor">1</text>
              <text x="2" y="14" fontSize="8" fill="currentColor">2</text>
              <text x="2" y="20" fontSize="8" fill="currentColor">3</text>
            </svg>
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-1 pr-2 border-r border-input">
          <button
            type="button"
            onClick={() => execCommand('justifyLeft')}
            className="p-2 rounded hover:bg-muted transition-colors"
            title="Align Left"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => execCommand('justifyCenter')}
            className="p-2 rounded hover:bg-muted transition-colors"
            title="Align Center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => execCommand('justifyRight')}
            className="p-2 rounded hover:bg-muted transition-colors"
            title="Align Right"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
            </svg>
          </button>
        </div>

        {/* Link */}
        <div className="flex items-center gap-1 pr-2 border-r border-input">
          <button
            type="button"
            onClick={openLinkModal}
            className="p-2 rounded hover:bg-muted transition-colors"
            title="Insert Link"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => execCommand('unlink')}
            className="p-2 rounded hover:bg-muted transition-colors"
            title="Remove Link"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </button>
        </div>

        {/* Text color */}
        <div className="flex items-center gap-1 pr-2 border-r border-input">
          <div className="relative group">
            <button
              type="button"
              className="p-2 rounded hover:bg-muted transition-colors flex items-center gap-1"
              title="Text Color"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10M12 3v14M5 10l7-7 7 7" />
              </svg>
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500" />
            </button>
            <div className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-wrap gap-1 p-2 bg-white rounded-lg shadow-lg border border-input z-10 w-32">
              {colors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setTextColor(color.value)}
                  className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Font size */}
        <div className="flex items-center gap-1 pr-2 border-r border-input">
          <select
            onChange={(e) => setFontSize(e.target.value)}
            className="text-sm bg-transparent border-none focus:outline-none cursor-pointer"
            title="Font Size"
          >
            <option value="2">Small</option>
            <option value="3" selected>Normal</option>
            <option value="4">Large</option>
            <option value="5">X-Large</option>
          </select>
        </div>

        {/* Quote & Divider */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<blockquote>')}
            className="p-2 rounded hover:bg-muted transition-colors"
            title="Block Quote"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={insertDivider}
            className="p-2 rounded hover:bg-muted transition-colors"
            title="Insert Divider"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Editor area - Substack style */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[400px] p-6 focus:outline-none prose prose-lg max-w-none
          [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-foreground
          [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-foreground
          [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-foreground
          [&_p]:text-base [&_p]:leading-relaxed [&_p]:mb-4 [&_p]:text-foreground
          [&_a]:text-primary [&_a]:underline [&_a]:decoration-primary/50 hover:[&_a]:decoration-primary
          [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4 [&_blockquote]:text-muted-foreground
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4
          [&_li]:mb-2 [&_li]:text-foreground
          [&_hr]:my-8 [&_hr]:border-muted"
        style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: value }}
      />

      {/* Link modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Insert Link</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Link Text</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Text to display"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkModal(false)
                    setLinkUrl("")
                    setLinkText("")
                  }}
                  className="px-4 py-2 text-sm rounded-lg border border-input hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={insertLink}
                  className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  Insert Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Placeholder styles */}
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
