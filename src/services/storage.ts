import type { Message } from '../types'

const DB_NAME = 'personal-ai-v3'
const STORE_NAME = 'messages'
const CONVERSATION_ID = 'default'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open local conversation storage.'))
  })
}

export async function loadMessages(): Promise<Message[]> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll()
    request.onsuccess = () => resolve((request.result as Message[]).sort((a, b) => a.createdAt - b.createdAt))
    request.onerror = () => reject(request.error ?? new Error('Could not load the conversation.'))
  })
}

export async function saveMessage(message: Message): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(message)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Could not save the conversation.'))
  })
}

export async function deleteMessage(id: string): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Could not delete the message.'))
  })
}

export async function deleteMessages(ids: string[]): Promise<void> {
  if (!ids.length) return
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    for (const id of ids) {
      store.delete(id)
    }
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not delete messages.'))
  })
}

export async function clearMessages(): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).clear()
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Could not clear the conversation.'))
  })
}

export const conversationId = CONVERSATION_ID

