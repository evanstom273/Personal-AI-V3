import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message } from '../types'

interface MessageListProps {
  messages: Message[]
  generating: boolean
  generatingType?: 'chat' | 'image' | 'music'
  onEdit?: (messageId: string, newContent: string) => void
  onDelete?: (messageId: string) => void
  onOpenMemory?: (title: string) => void
}

export function MessageList({
  messages,
  generating,
  generatingType = 'chat',
  onEdit,
  onDelete,
  onOpenMemory
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null)
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string; fileName: string } | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, generating])

  useEffect(() => {
    if (editingId && editTextareaRef.current) {
      editTextareaRef.current.focus()
      editTextareaRef.current.setSelectionRange(editTextareaRef.current.value.length, editTextareaRef.current.value.length)
    }
  }, [editingId])

  async function copyText(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // fallback
    }
  }

  function startEdit(message: Message) {
    setEditingId(message.id)
    setEditDraft(message.content)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditDraft('')
  }

  function saveEdit(id: string) {
    const trimmed = editDraft.trim()
    if (trimmed && onEdit) {
      onEdit(id, trimmed)
      setEditingId(null)
      setEditDraft('')
    }
  }

  function downloadMedia(dataUrl: string, fileName: string) {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = fileName || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!messages.length) {
    return (
      <div className="empty-state">
        <div className="empty-mark">✦</div>
        <h1>Start a conversation</h1>
        <p>Configure your Gemini API key in Settings, then ask Personal AI anything, create images, or compose music.</p>
      </div>
    )
  }

  return (
    <>
      <div className="message-list" aria-live="polite">
        {messages.map((message) => {
          const isUser = message.role === 'user'
          const isCopied = copiedId === message.id
          const isEditing = editingId === message.id

          if (isUser) {
            return (
              <article className="message user" key={message.id}>
                {isEditing ? (
                  <div className="user-edit-box">
                    <textarea
                      ref={editTextareaRef}
                      className="user-edit-textarea"
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          saveEdit(message.id)
                        } else if (e.key === 'Escape') {
                          cancelEdit()
                        }
                      }}
                      rows={3}
                      disabled={generating}
                      aria-label="Edit message"
                    />
                    <div className="user-edit-actions">
                      <button
                        type="button"
                        className="user-edit-btn cancel"
                        onClick={cancelEdit}
                        disabled={generating}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="user-edit-btn save"
                        onClick={() => saveEdit(message.id)}
                        disabled={generating || !editDraft.trim()}
                      >
                        Save & Submit
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="user-bubble-wrapper">
                    <div className="user-bubble">
                      <span className="user-text">{message.content}</span>
                    </div>
                    <div className="message-action-toolbar user-actions">
                      <button
                        type="button"
                        className={`action-icon-btn ${isCopied ? 'copied' : ''}`}
                        onClick={() => copyText(message.id, message.content)}
                        aria-label={isCopied ? 'Copied' : 'Copy prompt'}
                        title={isCopied ? 'Copied!' : 'Copy'}
                      >
                        {isCopied ? (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        ) : (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                        )}
                      </button>

                      {onEdit && (
                        <button
                          type="button"
                          className="action-icon-btn"
                          onClick={() => startEdit(message)}
                          disabled={generating}
                          aria-label="Edit message"
                          title="Edit"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                      )}

                      {onDelete && (
                        <button
                          type="button"
                          className="action-icon-btn delete"
                          onClick={() => onDelete(message.id)}
                          disabled={generating}
                          aria-label="Delete message"
                          title="Delete"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </article>
            )
          }

          return (
            <article className="message assistant" key={message.id}>
              <div className="assistant-header">
                <span className="assistant-badge">✦ Personal AI</span>
              </div>
              <div className="assistant-body">
                {message.mediaType === 'image' && message.media ? (
                  <div className="media-card image-card">
                    <div
                      className="image-preview-wrapper"
                      onClick={() =>
                        setLightboxImage({
                          src: message.media!.dataUrl,
                          alt: message.content || 'Generated image',
                          fileName: message.media!.fileName || 'personal-ai-image.jpg'
                        })
                      }
                      title="Click to view full size"
                    >
                      <img
                        src={message.media.dataUrl}
                        alt={message.content || 'Generated image'}
                        className="generated-image"
                        loading="lazy"
                      />
                      <div className="image-overlay-hint">
                        <span>🔍 Enlarge</span>
                      </div>
                    </div>
                    {message.content && <p className="media-caption">{message.content}</p>}
                    <div className="media-card-actions">
                      <button
                        type="button"
                        className="media-download-button"
                        onClick={() =>
                          downloadMedia(message.media!.dataUrl, message.media!.fileName || 'personal-ai-image.jpg')
                        }
                        aria-label="Download generated image"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        <span>Download image</span>
                      </button>
                    </div>
                  </div>
                ) : message.mediaType === 'audio' && message.media ? (
                  <div className="media-card audio-card">
                    <div className="audio-card-header">
                      <div className="audio-icon-box">🎵</div>
                      <div className="audio-info">
                        <div className="audio-title">Lyria 3 Pro Composition</div>
                        {message.content && <div className="audio-prompt">{message.content}</div>}
                      </div>
                    </div>
                    <div className="audio-player-wrapper">
                      <audio controls src={message.media.dataUrl} preload="metadata" className="inline-audio-player">
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                    <div className="media-card-actions">
                      <button
                        type="button"
                        className="media-download-button"
                        onClick={() =>
                          downloadMedia(message.media!.dataUrl, message.media!.fileName || 'personal-ai-music.mp3')
                        }
                        aria-label="Download generated audio"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        <span>Download audio</span>
                      </button>
                    </div>
                  </div>
                ) : message.content ? (
                  <div className="assistant-content-wrapper">
                    <div className="markdown-body">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    <div className="message-action-toolbar assistant-actions">
                      <button
                        type="button"
                        className={`action-icon-btn ${isCopied ? 'copied' : ''}`}
                        onClick={() => copyText(message.id, message.content)}
                        aria-label={isCopied ? 'Copied' : 'Copy response'}
                        title={isCopied ? 'Copied!' : 'Copy'}
                      >
                        {isCopied ? (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        ) : (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                        )}
                        <span className="action-btn-label">{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    {!!message.memoryUsed?.length && <div className="memory-used">Memory used: {message.memoryUsed.map((title) => <button type="button" key={title} onClick={() => onOpenMemory?.(title)}>{title}</button>)}</div>}
                  </div>
                ) : generating ? (
                  generatingType === 'image' ? (
                    <div className="media-generating-state">
                      <span className="media-spinner">🎨</span>
                      <span>Generating image with Gemini 3.1 Flash Lite Image…</span>
                    </div>
                  ) : generatingType === 'music' ? (
                    <div className="media-generating-state">
                      <span className="media-spinner">🎵</span>
                      <span>Composing music with Lyria 3 Pro…</span>
                    </div>
                  ) : (
                    <span className="thinking">Thinking…</span>
                  )
                ) : null}
              </div>
            </article>
          )
        })}
        <div ref={endRef} />
      </div>

      {lightboxImage && (
        <div className="lightbox-backdrop" onClick={() => setLightboxImage(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImage.src} alt={lightboxImage.alt} className="lightbox-image" />
            <div className="lightbox-bar">
              <button
                type="button"
                className="media-download-button primary"
                onClick={() => downloadMedia(lightboxImage.src, lightboxImage.fileName)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Download</span>
              </button>
              <button
                type="button"
                className="lightbox-close-button"
                onClick={() => setLightboxImage(null)}
                aria-label="Close full size image"
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


