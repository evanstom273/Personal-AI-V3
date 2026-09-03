import { API_KEY_STORAGE_KEY } from '../config'

export function getApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE_KEY) ?? ''
}

export function saveApiKey(apiKey: string): void {
  const trimmed = apiKey.trim()
  if (trimmed) localStorage.setItem(API_KEY_STORAGE_KEY, trimmed)
  else localStorage.removeItem(API_KEY_STORAGE_KEY)
}
