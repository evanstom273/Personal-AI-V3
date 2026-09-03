export type Role = 'user' | 'assistant'

export interface Message {
  id: string
  role: Role
  content: string
  createdAt: number
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
