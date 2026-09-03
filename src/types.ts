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
