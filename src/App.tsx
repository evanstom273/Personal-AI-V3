import { useEffect, useRef, useState } from 'react'
import { APP_VERSION, MODEL_NAME } from './config'
import { Composer } from './components/Composer'
import { MessageList } from './components/MessageList'
import { Settings } from './components/Settings'
import { TopBar } from './components/TopBar'
import { streamReply } from './services/gemini'
import { getApiKey } from './services/settings'
import { loadMessages, saveMessage } from './services/storage'
import type { Message } from './types'

type View = 'chat' | 'settings' | 'changelog'

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [apiKey, setApiKey] = useState(getApiKey)
  const [view, setView] = useState<View>('chat')
  const [generating, setGenerating] = useState(false)
  const [searchGrounding, setSearchGrounding] = useState(false)
  const [error, setError] = useState('')
  const [clock, setClock] = useState(() => new Date())
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => { loadMessages().then(setMessages).catch(() => setError('Could not load your saved conversation.')) }, [])
  useEffect(() => { const timer = window.setInterval(() => setClock(new Date()), 1000); return () => window.clearInterval(timer) }, [])

  async function send(content: string) {
    if (!apiKey) { setView('settings'); return }
    setError('')
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content, createdAt: Date.now() }
    const assistantMessage: Message = { id: crypto.randomUUID(), role: 'assistant', content: '', createdAt: Date.now() + 1 }
    setMessages((current) => [...current, userMessage, assistantMessage])
    setGenerating(true)
    const controller = new AbortController()
    abortRef.current = controller
    try {
      await saveMessage(userMessage)
      let answer = ''
      for await (const chunk of streamReply(apiKey, [...messages, userMessage], controller.signal, searchGrounding)) {
        answer += chunk
        setMessages((current) => current.map((message) => message.id === assistantMessage.id ? { ...message, content: answer } : message))
      }
      await saveMessage({ ...assistantMessage, content: answer })
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === 'AbortError')) setError(cause instanceof Error ? cause.message : 'The request failed. Check your API key and try again.')
      setMessages((current) => current.filter((message) => message.id !== assistantMessage.id))
    } finally { setGenerating(false); abortRef.current = null }
  }

  if (view !== 'chat') return <main className="app-shell"><TopBar onSettings={() => setView('settings')} onChangelog={() => setView('changelog')} /><Settings apiKey={apiKey} onSaved={setApiKey} onClose={() => setView('chat')} showChangelog={view === 'changelog'} /></main>
  return <main className="app-shell"><div className="chat-area"><TopBar onSettings={() => setView('settings')} onChangelog={() => setView('changelog')} /><time className="clock" dateTime={clock.toISOString()}>{clock.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</time><section className="chat-shell"><MessageList messages={messages} generating={generating} />{error && <div className="error" role="alert">{error}</div>}{!apiKey && <button className="setup-hint" onClick={() => setView('settings')}>Add your Gemini API key in Settings to start chatting.</button>}<Composer disabled={!apiKey} generating={generating} searchGrounding={searchGrounding} onToggleSearchGrounding={setSearchGrounding} onSend={send} onStop={() => abortRef.current?.abort()} /></section><span className="sr-only">Personal AI version {APP_VERSION}, model {MODEL_NAME}</span></div></main>
}
