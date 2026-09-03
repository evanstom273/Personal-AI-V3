import type { Message } from '../types'
import { MESSAGE_STORE, openDatabase } from './database'
const CONVERSATION_ID = 'default'

export async function loadMessages(): Promise<Message[]> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = db.transaction(MESSAGE_STORE, 'readonly').objectStore(MESSAGE_STORE).getAll()
    request.onsuccess = () => resolve((request.result as Message[]).sort((a, b) => a.createdAt - b.createdAt))
    request.onerror = () => reject(request.error ?? new Error('Could not load the conversation.'))
  })
}

export async function saveMessage(message: Message): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = db.transaction(MESSAGE_STORE, 'readwrite').objectStore(MESSAGE_STORE).put(message)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Could not save the conversation.'))
  })
}

export async function deleteMessage(id: string): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = db.transaction(MESSAGE_STORE, 'readwrite').objectStore(MESSAGE_STORE).delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Could not delete the message.'))
  })
}

export async function deleteMessages(ids: string[]): Promise<void> {
  if (!ids.length) return
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(MESSAGE_STORE, 'readwrite')
    const store = transaction.objectStore(MESSAGE_STORE)
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
    const request = db.transaction(MESSAGE_STORE, 'readwrite').objectStore(MESSAGE_STORE).clear()
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Could not clear the conversation.'))
  })
}

export const conversationId = CONVERSATION_ID

