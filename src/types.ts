export type Role = 'user' | 'assistant'
export type MediaType = 'text' | 'image' | 'audio'

export interface MediaMetadata {
  type: 'image' | 'audio'
  dataUrl: string
  mimeType: string
  fileName?: string
  prompt?: string
}

export interface Message {
  id: string
  role: Role
  content: string
  createdAt: number
  mediaType?: MediaType
  media?: MediaMetadata
  memoryUsed?: string[]
}

export interface MemoryNote {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
  tags: string[]
  category: string
  metadata?: Record<string, unknown>
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  updatedAt: number
}

export type MessageRole = Role
export interface ChangelogRelease {
  version: string
  date: string
  title?: string
  added?: string[]
  changed?: string[]
  fixed?: string[]
  removed?: string[]
}
