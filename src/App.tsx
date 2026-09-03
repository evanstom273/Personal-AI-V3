import { useEffect, useRef, useState } from 'react'
import { APP_VERSION, MODEL_NAME } from './config'
import { Composer, type ComposerMode } from './components/Composer'
import { MessageList } from './components/MessageList'
import { Settings } from './components/Settings'
import { TopBar } from './components/TopBar'
import { generateImage, generateMusic, streamReply } from './services/gemini'
import { getApiKey } from './services/settings'
import { deleteMessages, clearMessages, loadMessages, saveMessage } from './services/storage'
import type { Message } from './types'

type View = 'chat' | 'settings' | 'changelog'

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [apiKey, setApiKey] = useState(getApiKey)
  const [view, setView] = useState<View>('chat')
  const [generating, setGenerating] = useState(false)
  const [generatingType, setGeneratingType] = useState<ComposerMode>('chat')
  const [composerMode, setComposerMode] = useState<ComposerMode>('chat')
  const [searchGrounding, setSearchGrounding] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [error, setError] = useState('')
  const [clock, setClock] = useState(() => new Date())
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => { loadMessages().then(setMessages).catch(() => setError('Could not load your saved conversation.')) }, [])
  useEffect(() => { const timer = window.setInterval(() => setClock(new Date()), 1000); return () => window.clearInterval(timer) }, [])

  async function send(content: string, mode: ComposerMode) {
    if (!apiKey) { setView('settings'); return }
    setError('')
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content, createdAt: Date.now() }
    const assistantMessageId = crypto.randomUUID()
    const controller = new AbortController()
    abortRef.current = controller

    if (mode === 'image') {
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        mediaType: 'image',
        createdAt: Date.now() + 1
      }
      setMessages((current) => [...current, userMessage, assistantMessage])
      setGenerating(true)
      setGeneratingType('image')
      setComposerMode('chat')

      try {
        await saveMessage(userMessage)
        const media = await generateImage(apiKey, content, controller.signal)
        const completedMessage: Message = { ...assistantMessage, media, content: '' }
        setMessages((current) => current.map((msg) => (msg.id === assistantMessageId ? completedMessage : msg)))
        await saveMessage(completedMessage)
      } catch (cause) {
        if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
          setError(cause instanceof Error ? cause.message : 'Image generation failed. Please check your prompt and API key.')
        }
        setMessages((current) => current.filter((msg) => msg.id !== assistantMessageId))
      } finally {
        setGenerating(false)
        abortRef.current = null
      }
      return
    }

    if (mode === 'music') {
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        mediaType: 'audio',
        createdAt: Date.now() + 1
      }
      setMessages((current) => [...current, userMessage, assistantMessage])
      setGenerating(true)
      setGeneratingType('music')
      setComposerMode('chat')

      try {
        await saveMessage(userMessage)
        const media = await generateMusic(apiKey, content, controller.signal)
        const completedMessage: Message = { ...assistantMessage, media, content: '' }
        setMessages((current) => current.map((msg) => (msg.id === assistantMessageId ? completedMessage : msg)))
        await saveMessage(completedMessage)
      } catch (cause) {
        if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
          setError(cause instanceof Error ? cause.message : 'Music generation failed. Please check your prompt and API key.')
        }
        setMessages((current) => current.filter((msg) => msg.id !== assistantMessageId))
      } finally {
        setGenerating(false)
        abortRef.current = null
      }
      return
    }

    // Normal chat mode with streaming
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      mediaType: 'text',
      createdAt: Date.now() + 1
    }
    setMessages((current) => [...current, userMessage, assistantMessage])
    setGenerating(true)
    setGeneratingType('chat')

    try {
      await saveMessage(userMessage)
      let answer = ''
      for await (const chunk of streamReply(apiKey, [...messages, userMessage], controller.signal, searchGrounding)) {
        answer += chunk
        setMessages((current) => current.map((message) => message.id === assistantMessage.id ? { ...message, content: answer } : message))
      }
      await saveMessage({ ...assistantMessage, content: answer })
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
        setError(cause instanceof Error ? cause.message : 'The request failed. Check your API key and try again.')
      }
      setMessages((current) => current.filter((message) => message.id !== assistantMessage.id))
    } finally {
      setGenerating(false)
      abortRef.current = null
    }
  }

  async function handleEditMessage(userMessageId: string, newContent: string) {
    if (!apiKey) { setView('settings'); return }
    const index = messages.findIndex((m) => m.id === userMessageId)
    if (index === -1) return

    // Discard any subsequent messages from storage to maintain coherence
    const previousMessages = messages.slice(0, index)
    const discardedMessages = messages.slice(index)
    const discardedIds = discardedMessages.map((m) => m.id)
    await deleteMessages(discardedIds).catch(() => {})

    const updatedUserMessage: Message = {
      ...messages[index],
      content: newContent,
      createdAt: Date.now()
    }
    const assistantMessageId = crypto.randomUUID()
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      mediaType: 'text',
      createdAt: Date.now() + 1
    }

    setMessages([...previousMessages, updatedUserMessage, assistantMessage])
    setGenerating(true)
    setGeneratingType('chat')
    setError('')

    const controller = new AbortController()
    abortRef.current = controller

    try {
      await saveMessage(updatedUserMessage)
      let answer = ''
      for await (const chunk of streamReply(apiKey, [...previousMessages, updatedUserMessage], controller.signal, searchGrounding)) {
        answer += chunk
        setMessages((current) => current.map((msg) => msg.id === assistantMessageId ? { ...msg, content: answer } : msg))
      }
      await saveMessage({ ...assistantMessage, content: answer })
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
        setError(cause instanceof Error ? cause.message : 'The request failed. Check your API key and try again.')
      }
      setMessages((current) => current.filter((msg) => msg.id !== assistantMessageId))
    } finally {
      setGenerating(false)
      abortRef.current = null
    }
  }

  async function handleDeleteMessage(userMessageId: string) {
    const index = messages.findIndex((m) => m.id === userMessageId)
    if (index === -1) return

    const idsToDelete = [userMessageId]
    if (index + 1 < messages.length && messages[index + 1].role === 'assistant') {
      idsToDelete.push(messages[index + 1].id)
    }

    setMessages((current) => current.filter((m) => !idsToDelete.includes(m.id)))
    try {
      await deleteMessages(idsToDelete)
    } catch {
      setError('Could not delete the message from storage.')
    }
  }

  async function handleClearChat() {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setGenerating(false)
    setError('')
    setMessages([])
    setShowClearConfirm(false)
    try {
      await clearMessages()
    } catch {
      setError('Could not clear local conversation storage.')
    }
  }

  if (view !== 'chat') {
    return (
      <main className="app-shell settings-shell">
        <TopBar clock={clock} onSettings={() => setView('settings')} />
        <Settings apiKey={apiKey} onSaved={setApiKey} onClose={() => setView('chat')} showChangelog={view === 'changelog'} />
      </main>
    )
  }

  return (
    <main className="app-shell">
      <div className="chat-area">
        <TopBar
          clock={clock}
          onSettings={() => setView('settings')}
          onClearChat={() => setShowClearConfirm(true)}
          hasMessages={messages.length > 0}
        />
        <section className="chat-shell">
          <MessageList
            messages={messages}
            generating={generating}
            generatingType={generatingType}
            onEdit={handleEditMessage}
            onDelete={handleDeleteMessage}
          />
          {error && <div className="error" role="alert">{error}</div>}
          {!apiKey && (
            <button className="setup-hint" onClick={() => setView('settings')}>
              Add your Gemini API key in Settings to start chatting.
            </button>
          )}
          <Composer
            disabled={!apiKey}
            generating={generating}
            mode={composerMode}
            onModeChange={setComposerMode}
            searchGrounding={searchGrounding}
            onToggleSearchGrounding={setSearchGrounding}
            onSend={send}
            onStop={() => abortRef.current?.abort()}
          />
        </section>
        <span className="sr-only">Personal AI version {APP_VERSION}, model {MODEL_NAME}</span>
      </div>

      {showClearConfirm && (
        <div className="modal-backdrop" onClick={() => setShowClearConfirm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="clear-title">
            <h2 id="clear-title">Clear chat?</h2>
            <p>This will permanently delete the current conversation and all generated media from this device.</p>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setShowClearConfirm(false)}>
                Cancel
              </button>
              <button type="button" className="danger-button" onClick={handleClearChat}>
                Clear chat
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

