import type { MemoryNote } from '../types'
import { MEMORY_STORE, openDatabase } from './database'
import { validateMemoryMutations, type MemoryMutation, type MemoryRepository, type VerifiedMemoryMutationResult } from './memory'
import { normalizeTitle, replaceWikiLinkTitle } from './memory'

export const indexedDbMemoryRepository: MemoryRepository = {
  async list() {
    const db = await openDatabase()
    return new Promise((resolve, reject) => {
      const request = db.transaction(MEMORY_STORE, 'readonly').objectStore(MEMORY_STORE).getAll()
      request.onsuccess = () => resolve((request.result as MemoryNote[]).sort((a, b) => b.updatedAt - a.updatedAt))
      request.onerror = () => reject(request.error ?? new Error('Could not load memory notes.'))
    })
  },
  async get(id) {
    const db = await openDatabase()
    return new Promise((resolve, reject) => {
      const request = db.transaction(MEMORY_STORE, 'readonly').objectStore(MEMORY_STORE).get(id)
      request.onsuccess = () => resolve(request.result as MemoryNote | undefined)
      request.onerror = () => reject(request.error ?? new Error('Could not load the memory note.'))
    })
  },
  async save(note) {
    const db = await openDatabase()
    return new Promise((resolve, reject) => {
      const request = db.transaction(MEMORY_STORE, 'readwrite').objectStore(MEMORY_STORE).put(note)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error ?? new Error('Could not save the memory note.'))
    })
  },
  async delete(id) {
    const db = await openDatabase()
    return new Promise((resolve, reject) => {
      const request = db.transaction(MEMORY_STORE, 'readwrite').objectStore(MEMORY_STORE).delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error ?? new Error('Could not delete the memory note.'))
    })
  },
  async applyMutations(mutations: MemoryMutation[]): Promise<VerifiedMemoryMutationResult> {
    const before = await this.list()
    const validation = validateMemoryMutations(mutations, before)
    if (!validation.valid) return { verified: false, created: [], updated: [], deleted: [], error: validation.error }
    const working = new Map(before.map((note) => [note.id, { ...note, tags: [...note.tags] }]))
    const created: string[] = []
    const updated = new Set<string>()
    const deleted: Array<{ id: string; title: string }> = []
    for (const mutation of validation.mutations) {
      if (mutation.action === 'create') {
        const now = Date.now()
        const note = { id: mutation.id!, title: mutation.title, content: mutation.content, category: mutation.category || 'General', tags: mutation.tags || [], createdAt: now, updatedAt: now }
        working.set(note.id, note); created.push(note.id)
      } else if (mutation.action === 'update') {
        const current = working.get(mutation.id)!
        const next = { ...current, title: mutation.title || current.title, content: mutation.content !== undefined ? mutation.content : mutation.appendContent !== undefined ? `${current.content}\n\n${mutation.appendContent}` : current.content, category: mutation.category || current.category, tags: mutation.tags || current.tags, updatedAt: Date.now() }
        working.set(next.id, next); updated.add(next.id)
        if (normalizeTitle(next.title) !== normalizeTitle(current.title)) {
          for (const [id, related] of working) if (id !== next.id) {
            const rewritten = replaceWikiLinkTitle(related.content, current.title, next.title)
            if (rewritten !== related.content) {
              working.set(id, { ...related, content: rewritten, updatedAt: Date.now() })
              updated.add(id)
            }
          }
        }
      } else {
        const current = working.get(mutation.id)!
        deleted.push({ id: current.id, title: current.title }); working.delete(mutation.id)
      }
    }
    const writeSnapshot = async (notes: MemoryNote[]): Promise<void> => {
      const db = await openDatabase()
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(MEMORY_STORE, 'readwrite')
        const store = transaction.objectStore(MEMORY_STORE)
        const clear = store.clear()
        clear.onsuccess = () => { for (const note of notes) store.put(note) }
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error ?? new Error('Could not restore memory notes.'))
      })
    }
    try {
      const db = await openDatabase()
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(MEMORY_STORE, 'readwrite')
        const store = transaction.objectStore(MEMORY_STORE)
        store.clear()
        for (const note of working.values()) store.put(note)
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error ?? new Error('Could not apply the memory operation.'))
        transaction.onabort = () => reject(transaction.error ?? new Error('The memory operation was rolled back.'))
      })
      const after = await this.list()
      const afterById = new Map(after.map((note) => [note.id, note]))
      const verified = [...working.values()].every((expected) => {
        const actual = afterById.get(expected.id)
        return actual && actual.title === expected.title && actual.content === expected.content && actual.category === expected.category && JSON.stringify(actual.tags) === JSON.stringify(expected.tags)
      }) && after.length === working.size
      if (!verified) {
        await writeSnapshot(before)
        return { verified: false, created: [], updated: [], deleted: [], error: 'Memory verification failed after persistence; the previous archive was restored.' }
      }
      return { verified: true, created: created.map((id) => afterById.get(id)!), updated: [...updated].map((id) => afterById.get(id)!), deleted }
    } catch (cause) {
      try { await writeSnapshot(before) } catch { /* preserve the original failure */ }
      return { verified: false, created: [], updated: [], deleted: [], error: cause instanceof Error ? cause.message : 'The memory operation failed and the previous archive was restored.' }
    }
  }
}
