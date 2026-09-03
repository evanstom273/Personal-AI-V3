import { useEffect, useMemo, useState } from 'react'
import JSZip from 'jszip'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { MemoryNote } from '../types'
import { MEMORY_SOFT_LIMIT, MEMORY_WARNING_LIMIT, extractWikiLinks, getBacklinks, normalizeTitle, noteToMarkdown, retrieveMemories } from '../services/memory'
import { indexedDbMemoryRepository } from '../services/memoryStorage'

interface MemoryArchiveProps { onClose: () => void; initialNoteId?: string }

function formatDate(value: number): string { return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) }
function wikiMarkdown(content: string): string { return content.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, title: string, label?: string) => `[${label || title}](memory://${encodeURIComponent(title.trim())})`) }

export function MemoryArchive({ onClose, initialNoteId }: MemoryArchiveProps) {
  const [notes, setNotes] = useState<MemoryNote[]>([])
  const [selectedId, setSelectedId] = useState(initialNoteId ?? '')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<MemoryNote | null>(null)
  const [error, setError] = useState('')

  async function refresh(preferredId = selectedId) {
    try {
      const loaded = await indexedDbMemoryRepository.list()
      setNotes(loaded)
      if (preferredId && loaded.some((note) => note.id === preferredId)) setSelectedId(preferredId)
      else if (preferredId && loaded.some((note) => normalizeTitle(note.title) === normalizeTitle(preferredId))) setSelectedId(loaded.find((note) => normalizeTitle(note.title) === normalizeTitle(preferredId))!.id)
      else if (!selectedId && loaded[0]) setSelectedId(loaded[0].id)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load memory notes.') }
  }

  useEffect(() => { void refresh(initialNoteId) }, [initialNoteId])

  const selected = notes.find((note) => note.id === selectedId)
  const filtered = useMemo(() => query.trim() ? retrieveMemories(query, notes, notes.length) : notes, [notes, query])
  const backlinks = selected ? getBacklinks(selected, notes) : []

  function beginCreate() {
    const now = Date.now()
    setSelectedId('')
    setDraft({ id: crypto.randomUUID(), title: '', content: '', category: 'General', tags: [], createdAt: now, updatedAt: now })
    setEditing(true); setError('')
  }

  function beginEdit(note: MemoryNote) { setDraft({ ...note, tags: [...note.tags] }); setEditing(true); setError('') }

  async function saveDraft() {
    if (!draft?.title.trim()) { setError('A memory note needs a title.'); return }
    if (!draft.content.trim()) { setError('A memory note needs some content.'); return }
    const duplicate = notes.find((note) => note.id !== draft.id && normalizeTitle(note.title) === normalizeTitle(draft.title))
    if (duplicate) { setError('Another note already uses that title.'); return }
    try {
      const next = { ...draft, title: draft.title.trim(), category: draft.category.trim() || 'General', tags: [...new Set(draft.tags.map((tag) => tag.trim()).filter(Boolean))], updatedAt: Date.now() }
      const result = await indexedDbMemoryRepository.applyMutations([selected ? { action: 'update', id: next.id, title: next.title, content: next.content, category: next.category, tags: next.tags } : { action: 'create', id: next.id, title: next.title, content: next.content, category: next.category, tags: next.tags }])
      if (!result.verified) throw new Error(result.error || 'The memory operation could not be verified.')
      setEditing(false); setDraft(null); await refresh(next.id)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save memory note.') }
  }

  async function deleteSelected() {
    if (!selected || !window.confirm(`Delete “${selected.title}”? Existing wiki links will remain unresolved.`)) return
    try { const result = await indexedDbMemoryRepository.applyMutations([{ action: 'delete', id: selected.id }]); if (!result.verified) throw new Error(result.error || 'The memory operation could not be verified.'); setSelectedId(''); await refresh('') } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not delete memory note.') }
  }

  async function exportArchive() {
    const zip = new JSZip()
    for (const note of notes) zip.file(`${note.title.replace(/[^a-z0-9-_ ]/gi, '').trim() || note.id}.md`, noteToMarkdown(note))
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'personal-ai-memory-archive.zip'; link.click(); URL.revokeObjectURL(url)
  }

  function openWikiLink(title: string) {
    const match = notes.find((note) => normalizeTitle(note.title) === normalizeTitle(title))
    if (match) { setSelectedId(match.id); setEditing(false) }
    else if (window.confirm(`“${title}” does not exist. Create it now?`)) { setDraft({ id: crypto.randomUUID(), title, content: '', category: 'General', tags: [], createdAt: Date.now(), updatedAt: Date.now() }); setSelectedId(''); setEditing(true) }
  }

  return <main className="app-shell memory-shell">
    <section className="memory-archive">
      <header className="memory-header">
        <button type="button" className="back-button" onClick={onClose}>← Chat</button>
        <div><p className="eyebrow">Personal knowledge</p><h1>Memory Archive</h1></div>
        <div className="memory-header-actions"><button type="button" className="secondary-button" onClick={exportArchive} disabled={!notes.length}>Export archive</button><button type="button" className="primary-button" onClick={beginCreate}>New note</button></div>
      </header>
      <div className="memory-layout">
        <aside className="memory-list-panel">
          <label className="memory-search-label" htmlFor="memory-search">Search memory</label>
          <input id="memory-search" className="memory-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles, content, tags…" />
          <div className="memory-list" aria-label="Memory notes">
            {filtered.map((note) => <button type="button" className={`memory-list-item ${note.id === selectedId ? 'active' : ''}`} key={note.id} onClick={() => { setSelectedId(note.id); setEditing(false) }}><strong>{note.title || 'Untitled note'}</strong><span>{note.category || 'General'} · {formatDate(note.updatedAt)}</span></button>)}
            {!filtered.length && <p className="memory-empty">No matching memories.</p>}
          </div>
        </aside>
        <section className="memory-detail-panel">
          {editing && draft ? <div className="memory-editor">
            <div className="memory-detail-heading"><div><p className="eyebrow">{selected ? 'Edit memory' : 'New memory'}</p><h2>{selected ? 'Edit note' : 'Create note'}</h2></div><button type="button" className="back-button" onClick={() => { setEditing(false); setDraft(null) }}>Cancel</button></div>
            <label>Title<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
            <label>Category<input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} /></label>
            <label>Tags <span className="field-help">comma separated</span><input value={draft.tags.join(', ')} onChange={(event) => setDraft({ ...draft, tags: event.target.value.split(',') })} /></label>
            <label>Content<textarea rows={16} value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} /></label>
            <div className={`memory-limit ${draft.content.length >= MEMORY_WARNING_LIMIT ? 'warning' : ''}`}>{draft.content.length} / {MEMORY_SOFT_LIMIT} characters{draft.content.length >= MEMORY_WARNING_LIMIT ? ' — this note is getting long.' : ''}</div>
            {error && <p className="memory-error" role="alert">{error}</p>}
            <div className="editor-actions"><button type="button" className="primary-button" onClick={saveDraft}>Save note</button></div>
          </div> : selected ? <div className="memory-note-view">
            <div className="memory-detail-heading"><div><p className="eyebrow">{selected.category || 'General'}</p><h2>{selected.title}</h2><div className="memory-meta">Updated {formatDate(selected.updatedAt)} · Created {formatDate(selected.createdAt)}</div></div><div className="memory-note-actions"><button type="button" className="secondary-button" onClick={() => beginEdit(selected)}>Edit</button><button type="button" className="danger-button" onClick={deleteSelected}>Delete</button></div></div>
            {!!selected.tags.length && <div className="memory-tags">{selected.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>}
            <div className="memory-markdown"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ href, children, ...props }) => href?.startsWith('memory://') ? <a {...props} href={href} onClick={(event) => { event.preventDefault(); openWikiLink(decodeURIComponent(href.slice('memory://'.length))) }}>{children}</a> : <a {...props} href={href} target="_blank" rel="noopener noreferrer">{children}</a> }}>{wikiMarkdown(selected.content)}</ReactMarkdown></div>
            <div className="memory-relationships"><div><h3>Links</h3>{extractWikiLinks(selected.content).map((link) => <button type="button" className="memory-link" key={link} onClick={() => openWikiLink(link)}>[[{link}]]</button>)}{!extractWikiLinks(selected.content).length && <span className="muted">None</span>}</div><div><h3>Backlinks</h3>{backlinks.map((note) => <button type="button" className="memory-link" key={note.id} onClick={() => setSelectedId(note.id)}>{note.title}</button>)}{!backlinks.length && <span className="muted">None</span>}</div></div>
          </div> : <div className="memory-empty-state"><div className="empty-mark">✦</div><h2>Your memory archive</h2><p>Create a note to give Personal AI a durable, inspectable place for important context.</p><button type="button" className="primary-button" onClick={beginCreate}>Create your first note</button></div>}
          {error && !editing && <p className="memory-error" role="alert">{error}</p>}
        </section>
      </div>
    </section>
  </main>
}
