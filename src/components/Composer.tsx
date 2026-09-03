import { useEffect, useRef, useState } from 'react'

interface ComposerProps {
  disabled: boolean
  generating: boolean
  searchGrounding: boolean
  onToggleSearchGrounding: (enabled: boolean) => void
  onSend: (content: string) => void
  onStop: () => void
}

export function Composer({
  disabled,
  generating,
  searchGrounding,
  onToggleSearchGrounding,
  onSend,
  onStop
}: ComposerProps) {
  const [value, setValue] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuContainerRef = useRef<HTMLDivElement>(null)

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
      onSend(content)
      setValue('')
    }
  }

  return (
    <form className="composer" onSubmit={(event) => { event.preventDefault(); submit() }}>
      {searchGrounding && (
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
            className={`plus-button ${isMenuOpen ? 'open' : ''} ${searchGrounding ? 'grounding-active' : ''}`}
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
              <div className="popover-heading">Tools & Extensions</div>
              <button
                type="button"
                className={`popover-item ${searchGrounding ? 'active' : ''}`}
                onClick={() => {
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
                    <span>Google Search Grounding</span>
                    {searchGrounding && <span className="badge-pill">ON</span>}
                  </div>
                  <div className="popover-item-desc">Browse live web data via Gemini 2 search</div>
                </div>
                <div className={`switch-track ${searchGrounding ? 'checked' : ''}`}>
                  <div className="switch-thumb" />
                </div>
              </button>
            </div>
          )}
        </div>

        <textarea
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
              : searchGrounding
              ? 'Ask anything with Google Search...'
              : 'Message Personal AI...'
          }
          rows={1}
          aria-label="Message"
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
            Send
          </button>
        )}
      </div>
    </form>
  )
}
