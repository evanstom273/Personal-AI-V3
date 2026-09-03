import type { MemoryNote } from '../types'
import { MEMORY_STORE, openDatabase } from './database'
import type { MemoryRepository } from './memory'

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
  }
}
