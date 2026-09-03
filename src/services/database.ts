const DB_NAME = 'personal-ai-v3'
const DB_VERSION = 2

export const MESSAGE_STORE = 'messages'
export const MEMORY_STORE = 'memoryNotes'

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(MESSAGE_STORE)) db.createObjectStore(MESSAGE_STORE, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(MEMORY_STORE)) db.createObjectStore(MEMORY_STORE, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open local storage.'))
  })
}
