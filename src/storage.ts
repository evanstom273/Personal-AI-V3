import type { Conversation } from './types'

const DB_NAME = 'personal-ai-v3'
const STORE_NAME = 'conversations'
const SETTINGS_KEY = 'personal-ai-settings'

export interface Settings { apiKey: string; model: string }
const defaultSettings: Settings = { apiKey: '', model: 'gemini-2.5-flash' }

function openDatabase(): Promise<IDBDatabase> { return new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, 1)
  request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error)
}) }

export async function loadConversations(): Promise<Conversation[]> { const db = await openDatabase(); return new Promise((resolve, reject) => {
  const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll()
  request.onsuccess = () => resolve((request.result as Conversation[]).sort((a, b) => b.updatedAt - a.updatedAt))
  request.onerror = () => reject(request.error)
}) }

export async function saveConversation(conversation: Conversation): Promise<void> { const db = await openDatabase(); return new Promise((resolve, reject) => {
  const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(conversation)
  request.onsuccess = () => resolve(); request.onerror = () => reject(request.error)
}) }

export async function deleteConversation(id: string): Promise<void> { const db = await openDatabase(); return new Promise((resolve, reject) => {
  const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(id)
  request.onsuccess = () => resolve(); request.onerror = () => reject(request.error)
}) }

export function loadSettings(): Settings { try { return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<Settings> } } catch { return defaultSettings } }
export function saveSettings(settings: Settings): void { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) }
