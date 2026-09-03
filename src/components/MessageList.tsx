import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message } from '../types'

interface MessageListProps {
  messages: Message[]
  generating: boolean
  generatingType?: 'chat' | 'image' | 'music'
}

export function MessageList({ messages, generating, generatingType = 'chat' }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null)
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string; fileName: string } | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, generating])

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

          if (isUser) {
            return (
              <article className="message user" key={message.id}>
                <div className="user-bubble">
                  <span className="user-text">{message.content}</span>
                </div>
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


