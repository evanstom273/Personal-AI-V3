import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message } from '../types'

export function MessageList({ messages, generating }: { messages: Message[]; generating: boolean }) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, generating])

  if (!messages.length) {
    return (
      <div className="empty-state">
        <div className="empty-mark">✦</div>
        <h1>Start a conversation</h1>
        <p>Configure your Gemini API key in Settings, then ask Personal AI anything.</p>
      </div>
    )
  }

  return (
    <div className="message-list" aria-live="polite">
      {messages.map((message) => (
        <article className={`message ${message.role}`} key={message.id}>
          <div className="message-label">{message.role === 'user' ? 'You' : 'Personal AI'}</div>
          <div className="message-content">
            {message.role === 'user' ? (
              <span className="user-text">{message.content}</span>
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
              <span className="thinking">Thinking…</span>
            ) : null}
          </div>
        </article>
      ))}
      <div ref={endRef} />
    </div>
  )
}
