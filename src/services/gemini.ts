import { GoogleGenAI } from '@google/genai'
import { IMAGE_MODEL_NAME, MODEL_NAME, MUSIC_MODEL_NAME } from '../config'
import type { MediaMetadata, Message } from '../types'

export async function* streamReply(apiKey: string, messages: Message[], signal: AbortSignal, searchGrounding = false): AsyncGenerator<string> {
  const ai = new GoogleGenAI({ apiKey })
  const contents = messages
    .filter((message) => !message.mediaType || message.mediaType === 'text')
    .map((message) => ({
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

export async function generateImage(apiKey: string, prompt: string, signal?: AbortSignal): Promise<MediaMetadata> {
  const ai = new GoogleGenAI({ apiKey })

  if (signal?.aborted) {
    throw new DOMException('Image generation stopped.', 'AbortError')
  }

  try {
    const response = await ai.models.generateImages({
      model: IMAGE_MODEL_NAME,
      prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        abortSignal: signal
      }
    })

    if (signal?.aborted) {
      throw new DOMException('Image generation stopped.', 'AbortError')
    }

    const generatedImage = response.generatedImages?.[0]?.image
    if (generatedImage?.imageBytes) {
      const mimeType = generatedImage.mimeType || 'image/jpeg'
      const ext = mimeType.includes('png') ? 'png' : 'jpg'
      const dataUrl = `data:${mimeType};base64,${generatedImage.imageBytes}`
      return {
        type: 'image',
        dataUrl,
        mimeType,
        fileName: `personal-ai-image-${Date.now()}.${ext}`,
        prompt
      }
    }
  } catch (err) {
    if (signal?.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
      throw new DOMException('Image generation stopped.', 'AbortError')
    }

    // Fallback: try generateContent if model is multimodal content based
    try {
      const contentResp = await ai.models.generateContent({
        model: IMAGE_MODEL_NAME,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          abortSignal: signal
        }
      })
      const candidateParts = contentResp.candidates?.[0]?.content?.parts || []
      for (const part of candidateParts) {
        const inline = (part as unknown as { inlineData?: { mimeType: string; data: string } }).inlineData
        if (inline?.data) {
          const mimeType = inline.mimeType || 'image/jpeg'
          const ext = mimeType.includes('png') ? 'png' : 'jpg'
          return {
            type: 'image',
            dataUrl: `data:${mimeType};base64,${inline.data}`,
            mimeType,
            fileName: `personal-ai-image-${Date.now()}.${ext}`,
            prompt
          }
        }
      }
    } catch {
      // ignore fallback error and propagate original error
    }

    throw err
  }

  throw new Error('No image was returned by the model.')
}

export async function generateMusic(apiKey: string, prompt: string, signal?: AbortSignal): Promise<MediaMetadata> {
  const ai = new GoogleGenAI({ apiKey })

  if (signal?.aborted) {
    throw new DOMException('Music generation stopped.', 'AbortError')
  }

  try {
    const response = await ai.models.generateContent({
      model: MUSIC_MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        abortSignal: signal
      }
    })

    if (signal?.aborted) {
      throw new DOMException('Music generation stopped.', 'AbortError')
    }

    const candidateParts = response.candidates?.[0]?.content?.parts || []
    for (const part of candidateParts) {
      const inline = (part as unknown as { inlineData?: { mimeType: string; data: string } }).inlineData
      if (inline?.data) {
        const mimeType = inline.mimeType || 'audio/mp3'
        const ext = mimeType.includes('wav') ? 'wav' : mimeType.includes('ogg') ? 'ogg' : 'mp3'
        return {
          type: 'audio',
          dataUrl: `data:${mimeType};base64,${inline.data}`,
          mimeType,
          fileName: `personal-ai-music-${Date.now()}.${ext}`,
          prompt
        }
      }
    }

    const textPart = candidateParts.find((p) => (p as { text?: string }).text)
    if (textPart && (textPart as { text?: string }).text) {
      throw new Error((textPart as { text?: string }).text)
    }
  } catch (err) {
    if (signal?.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
      throw new DOMException('Music generation stopped.', 'AbortError')
    }
    throw err
  }

  throw new Error('No audio data was returned by the model.')
}

