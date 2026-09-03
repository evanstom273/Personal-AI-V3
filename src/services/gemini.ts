import { GoogleGenAI } from '@google/genai'
import { MODEL_NAME } from '../config'
import type { Message } from '../types'

export async function* streamReply(apiKey: string, messages: Message[], signal: AbortSignal, searchGrounding = false): AsyncGenerator<string> {
  const ai = new GoogleGenAI({ apiKey })
  const contents = messages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }]
  }))
  const stream = await ai.models.generateContentStream({
    model: MODEL_NAME,
    contents,
    config: searchGrounding ? { tools: [{ googleSearch: {} }] } : undefined
  })
  for await (const chunk of stream) {
    if (signal.aborted) throw new DOMException('Generation stopped.', 'AbortError')
    const text = (chunk as unknown as { text?: string }).text
    if (text) yield text
  }
}

export async function streamGeminiResponse(apiKey: string, messages: Message[], signal: AbortSignal, onChunk: (text: string) => void, searchGrounding = false): Promise<void> {
  for await (const chunk of streamReply(apiKey, messages, signal, searchGrounding)) onChunk(chunk)
}
