import { useState } from 'react'
import { APP_VERSION } from '../config'

interface TopBarProps {
  onMemory?: () => void
  onSettings: () => void
  onClearChat?: () => void
  hasMessages?: boolean
  clock?: Date
}

export function TopBar({ onMemory, onSettings, onClearChat, hasMessages = false, clock = new Date() }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const formattedTime = clock.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })

  return <header className="topbar">
    <div className="topbar-identity">
      <strong className="app-title">Personal AI</strong><span className="dot-separator" aria-hidden="true">·</span><span className="version-tag">v{APP_VERSION}</span><span className="dot-separator" aria-hidden="true">·</span><time className="topbar-clock" dateTime={clock.toISOString()}>{formattedTime}</time>
    </div>
    <div className="topbar-spacer" aria-hidden="true" />
    <div className="topbar-actions">
      {onClearChat && <button type="button" className="top-icon-button clear-btn" onClick={onClearChat} disabled={!hasMessages} aria-label="Clear chat" title="Clear chat"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>}
      <div className="topbar-menu-wrap">
        <button type="button" className="top-icon-button settings-btn" onClick={() => setMenuOpen((open) => !open)} aria-label="Open navigation menu" title="Menu" aria-expanded={menuOpen}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg></button>
        {menuOpen && <div className="topbar-menu" role="menu"><button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onMemory?.() }}>Memory Archive</button><button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onSettings() }}>Settings</button></div>}
      </div>
    </div>
  </header>
}
