import { useEffect, useRef, useState } from 'react'

export type ComposerMode = 'chat' | 'image' | 'music'

interface ComposerProps {
  disabled: boolean
  generating: boolean
  mode: ComposerMode
  onModeChange: (mode: ComposerMode) => void
  searchGrounding: boolean
  onToggleSearchGrounding: (enabled: boolean) => void
  onSend: (content: string, mode: ComposerMode) => void
  onStop: () => void
}

export function Composer({
  disabled,
  generating,
  mode,
  onModeChange,
  searchGrounding,
  onToggleSearchGrounding,
  onSend,
  onStop
}: ComposerProps) {
  const [value, setValue] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuContainerRef.current && !menuContainerRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  function submit() {
    const content = value.trim()
    if (content && !disabled && !generating) {
      onSend(content, mode)
      setValue('')
    }
  }

  const isMediaMode = mode === 'image' || mode === 'music'
  const isSearchActive = mode === 'chat' && searchGrounding

  return (
    <form className="composer" onSubmit={(event) => { event.preventDefault(); submit() }}>
      {mode === 'image' && (
        <div className="grounding-badge media-badge image-badge">
          <span className="grounding-badge-icon">🖼</span>
          <span className="grounding-badge-text">Create image (Nano Banana 2 Lite)</span>
          <button
            type="button"
            className="grounding-badge-close"
            onClick={() => onModeChange('chat')}
            aria-label="Cancel image mode"
          >
            ×
          </button>
        </div>
      )}

      {mode === 'music' && (
        <div className="grounding-badge media-badge music-badge">
          <span className="grounding-badge-icon">🎵</span>
          <span className="grounding-badge-text">Create music (Lyria 3 Pro)</span>
          <button
            type="button"
            className="grounding-badge-close"
            onClick={() => onModeChange('chat')}
            aria-label="Cancel music mode"
          >
            ×
          </button>
        </div>
      )}

      {isSearchActive && (
        <div className="grounding-badge">
          <span className="grounding-badge-icon">🌐</span>
          <span className="grounding-badge-text">Google Search Grounding active</span>
          <button
            type="button"
            className="grounding-badge-close"
            onClick={() => onToggleSearchGrounding(false)}
            aria-label="Disable search grounding"
          >
            ×
          </button>
        </div>
      )}

      <div className="composer-inner">
        <div className="composer-menu-wrapper" ref={menuContainerRef}>
          <button
            type="button"
            className={`plus-button ${isMenuOpen ? 'open' : ''} ${isSearchActive ? 'grounding-active' : ''} ${isMediaMode ? 'media-active' : ''}`}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            disabled={disabled || generating}
            aria-label="Composer actions"
            aria-expanded={isMenuOpen}
            title="Options & Tools"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>

          {isMenuOpen && (
            <div className="composer-popover" role="menu" aria-label="Composer Options">
              <div className="popover-heading">Tools & Creation</div>
              
              <button
                type="button"
                className={`popover-item ${isSearchActive ? 'active' : ''}`}
                onClick={() => {
                  onModeChange('chat')
                  onToggleSearchGrounding(!searchGrounding)
                  setIsMenuOpen(false)
                }}
                role="menuitem"
              >
                <div className="popover-icon-box">
                  🌐
                </div>
                <div className="popover-item-details">
                  <div className="popover-item-title">
                    <span>Google Search</span>
                    {isSearchActive && <span className="badge-pill">ON</span>}
                  </div>
                  <div className="popover-item-desc">Ground chat answers with live Google Search</div>
                </div>
                <div className={`switch-track ${isSearchActive ? 'checked' : ''}`}>
                  <div className="switch-thumb" />
                </div>
              </button>

              <button
                type="button"
                className={`popover-item ${mode === 'image' ? 'active' : ''}`}
                onClick={() => {
                  onModeChange(mode === 'image' ? 'chat' : 'image')
                  setIsMenuOpen(false)
                  textareaRef.current?.focus()
                }}
                role="menuitem"
              >
                <div className="popover-icon-box image-icon-box">
                  🖼
                </div>
                <div className="popover-item-details">
                  <div className="popover-item-title">
                    <span>Create image</span>
                    {mode === 'image' && <span className="badge-pill media-pill">ACTIVE</span>}
                  </div>
                  <div className="popover-item-desc">Generate images with Gemini 3.1 Flash Lite Image</div>
                </div>
              </button>

              <button
                type="button"
                className={`popover-item ${mode === 'music' ? 'active' : ''}`}
                onClick={() => {
                  onModeChange(mode === 'music' ? 'chat' : 'music')
                  setIsMenuOpen(false)
                  textareaRef.current?.focus()
                }}
                role="menuitem"
              >
                <div className="popover-icon-box music-icon-box">
                  🎵
                </div>
                <div className="popover-item-details">
                  <div className="popover-item-title">
                    <span>Create music</span>
                    {mode === 'music' && <span className="badge-pill media-pill">ACTIVE</span>}
                  </div>
                  <div className="popover-item-desc">Generate full songs with Lyria 3 Pro</div>
                </div>
              </button>
            </div>
          )}
        </div>

        <textarea
          ref={textareaRef}
          value={value}
          disabled={disabled || generating}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              submit()
            }
          }}
          placeholder={
            disabled
              ? 'Add your Gemini API key in Settings'
              : mode === 'image'
              ? 'Describe an image...'
              : mode === 'music'
              ? 'Describe the music you want...'
              : searchGrounding
              ? 'Ask anything with Google Search...'
              : 'Message Personal AI...'
          }
          rows={1}
          aria-label={
            mode === 'image'
              ? 'Describe an image'
              : mode === 'music'
              ? 'Describe music'
              : 'Message'
          }
        />

        {generating ? (
          <button type="button" className="stop-button" onClick={onStop}>
            Stop
          </button>
        ) : (
          <button
            type="submit"
            className="send-button"
            disabled={disabled || !value.trim()}
            aria-label="Send message"
          >
            {mode === 'image' ? 'Generate' : mode === 'music' ? 'Compose' : 'Send'}
          </button>
        )}
      </div>
    </form>
  )
}

