import type { MemoryNote } from '../types'

export const MEMORY_SOFT_LIMIT = 5000
export const MEMORY_WARNING_LIMIT = 4500

export interface MemoryRepository {
  list(): Promise<MemoryNote[]>
  get(id: string): Promise<MemoryNote | undefined>
  save(note: MemoryNote): Promise<void>
  delete(id: string): Promise<void>
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
