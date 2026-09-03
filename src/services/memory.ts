import type { MemoryNote } from '../types'

export const MEMORY_SOFT_LIMIT = 5000
export const MEMORY_WARNING_LIMIT = 4500

export type MemoryMutation =
  | { action: 'create'; id?: string; title: string; content: string; category?: string; tags?: string[] }
  | { action: 'update'; id: string; title?: string; content?: string; appendContent?: string; category?: string; tags?: string[] }
  | { action: 'delete'; id: string }

export interface VerifiedMemoryMutationResult {
  verified: boolean
  created: MemoryNote[]
  updated: MemoryNote[]
  deleted: Array<{ id: string; title: string }>
  error?: string
}

export interface MemoryRepository {
  list(): Promise<MemoryNote[]>
  get(id: string): Promise<MemoryNote | undefined>
  save(note: MemoryNote): Promise<void>
  delete(id: string): Promise<void>
  applyMutations(mutations: MemoryMutation[]): Promise<VerifiedMemoryMutationResult>
}

export function normalizeTitle(title: string): string {
  return title.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

export function extractWikiLinks(content: string): string[] {
  const links: string[] = []
  const seen = new Set<string>()
  for (const match of content.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)) {
    const title = match[1].trim()
    const key = normalizeTitle(title)
    if (title && !seen.has(key)) { seen.add(key); links.push(title) }
  }
  return links
}

export function replaceWikiLinkTitle(content: string, oldTitle: string, newTitle: string): string {
  const oldKey = normalizeTitle(oldTitle)
  return content.replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, (full, title: string, alias = '') =>
    normalizeTitle(title) === oldKey ? `[[${newTitle}${alias || ''}]]` : full
  )
}

export function getBacklinks(note: MemoryNote, notes: MemoryNote[]): MemoryNote[] {
  const target = normalizeTitle(note.title)
  return notes.filter((candidate) => candidate.id !== note.id && extractWikiLinks(candidate.content).some((link) => normalizeTitle(link) === target))
}

function tokenize(value: string): string[] {
  return value.toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 1)
}

export interface RetrievedMemory { note: MemoryNote; score: number }

export function retrieveMemories(query: string, notes: MemoryNote[], limit = 5): MemoryNote[] {
  const queryTokens = new Set(tokenize(query))
  if (!queryTokens.size) return []
  const scored: RetrievedMemory[] = notes.map((note) => {
    const title = new Set(tokenize(note.title))
    const tags = new Set(note.tags.flatMap(tokenize))
    const category = new Set(tokenize(note.category))
    const content = new Set(tokenize(note.content))
    let score = 0
    for (const token of queryTokens) {
      if (title.has(token)) score += 8
      if (tags.has(token)) score += 6
      if (category.has(token)) score += 4
      if (content.has(token)) score += 1
    }
    const linked = extractWikiLinks(note.content).some((link) => queryTokens.has(normalizeTitle(link)) || tokenize(link).some((token) => queryTokens.has(token)))
    if (linked) score += 2
    return { note, score }
  })
  return scored.filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score || b.note.updatedAt - a.note.updatedAt).slice(0, limit).map((entry) => entry.note)
}

export function noteToMarkdown(note: MemoryNote): string {
  const tags = note.tags.map((tag) => `  - ${tag}`).join('\n')
  return `---\nid: ${note.id}\ntitle: ${JSON.stringify(note.title)}\ncategory: ${JSON.stringify(note.category)}\ntags:\n${tags || '  []'}\ncreatedAt: ${new Date(note.createdAt).toISOString()}\nupdatedAt: ${new Date(note.updatedAt).toISOString()}\n---\n\n${note.content}\n`
}

export function isMemoryIntent(content: string): boolean {
  return /^\s*(?:please\s+)?remember\b/i.test(content) || /\b(?:save|store)\b[\s\S]{0,80}\b(?:this|that|memory)\b/i.test(content)
}

export function validateMemoryMutations(mutations: MemoryMutation[], notes: MemoryNote[]): { valid: true; mutations: MemoryMutation[] } | { valid: false; error: string } {
  if (!Array.isArray(mutations) || !mutations.length) return { valid: false, error: 'No memory changes were proposed.' }
  if (mutations.length > 30) return { valid: false, error: 'The proposed memory operation contains too many changes.' }
  const working = new Map(notes.map((note) => [note.id, { ...note, tags: [...note.tags] }]))
  const titles = new Map(notes.map((note) => [normalizeTitle(note.title), note.id]))
  const normalized: MemoryMutation[] = []
  for (const raw of mutations) {
    if (!raw || !['create', 'update', 'delete'].includes(raw.action)) return { valid: false, error: 'The proposed memory operation contains an unknown action.' }
    if (raw.action === 'create') {
      const title = typeof raw.title === 'string' ? raw.title.trim() : ''
      const content = typeof raw.content === 'string' ? raw.content : ''
      if (!title || !content.trim()) return { valid: false, error: 'Every new memory needs a title and content.' }
      const titleKey = normalizeTitle(title)
      if (titles.has(titleKey)) return { valid: false, error: `A memory note titled “${title}” already exists.` }
      if (content.length > MEMORY_SOFT_LIMIT) return { valid: false, error: `The note “${title}” exceeds the 5000-character limit.` }
      const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id : crypto.randomUUID()
      if (working.has(id)) return { valid: false, error: 'The proposed memory operation reuses an existing note ID.' }
      const note: MemoryNote = { id, title, content, category: raw.category?.trim() || 'General', tags: [...new Set((raw.tags || []).map((tag) => tag.trim()).filter(Boolean))], createdAt: Date.now(), updatedAt: Date.now() }
      working.set(id, note); titles.set(titleKey, id); normalized.push({ ...raw, id, title, content, category: note.category, tags: note.tags })
    } else if (raw.action === 'update') {
      const current = working.get(raw.id)
      if (!current) return { valid: false, error: 'A proposed update refers to a memory note that does not exist.' }
      if (raw.content !== undefined && raw.appendContent !== undefined) return { valid: false, error: 'A memory update cannot replace and append content at the same time.' }
      const title = raw.title?.trim() || current.title
      const titleKey = normalizeTitle(title)
      const existingTitleId = titles.get(titleKey)
      if (existingTitleId && existingTitleId !== current.id) return { valid: false, error: `A memory note titled “${title}” already exists.` }
      const content = raw.content !== undefined ? raw.content : raw.appendContent !== undefined ? `${current.content}\n\n${raw.appendContent}` : current.content
      if (!content.trim()) return { valid: false, error: `The memory note “${title}” cannot be empty.` }
      if (content.length > MEMORY_SOFT_LIMIT) return { valid: false, error: `The update for “${title}” exceeds the 5000-character limit.` }
      titles.delete(normalizeTitle(current.title)); titles.set(titleKey, current.id)
      working.set(current.id, { ...current, title, content, category: raw.category?.trim() || current.category, tags: raw.tags ? [...new Set(raw.tags.map((tag) => tag.trim()).filter(Boolean))] : current.tags, updatedAt: Date.now() })
      normalized.push({ ...raw, title, ...(raw.content !== undefined ? { content } : {}), ...(raw.appendContent !== undefined ? { appendContent: raw.appendContent } : {}) })
    } else {
      const current = working.get(raw.id)
      if (!current) return { valid: false, error: 'A proposed deletion refers to a memory note that does not exist.' }
      working.delete(raw.id); titles.delete(normalizeTitle(current.title)); normalized.push(raw)
    }
  }
  return { valid: true, mutations: normalized }
}
