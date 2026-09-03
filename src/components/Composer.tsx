import { useState } from 'react'

interface ComposerProps { disabled: boolean; generating: boolean; onSend: (content: string) => void; onStop: () => void }

export function Composer({ disabled, generating, onSend, onStop }: ComposerProps) {
  const [value, setValue] = useState('')
  function submit() { const content = value.trim(); if (content && !disabled && !generating) { onSend(content); setValue('') } }
  return <form className="composer" onSubmit={(event) => { event.preventDefault(); submit() }}><textarea value={value} disabled={disabled || generating} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit() } }} placeholder={disabled ? 'Add your Gemini API key in Settings' : 'Message Personal AI...'} rows={1} aria-label="Message" />{generating ? <button type="button" className="stop-button" onClick={onStop}>Stop</button> : <button type="submit" className="send-button" disabled={disabled || !value.trim()} aria-label="Send message">Send</button>}</form>
}
