import { APP_VERSION } from '../config'

interface TopBarProps {
  onSettings: () => void
  onChangelog: () => void
  onClearChat?: () => void
  hasMessages?: boolean
}

export function TopBar({ onSettings, onChangelog, onClearChat, hasMessages = false }: TopBarProps) {
  return (
    <header className="topbar">
      <div>
        <strong>Personal AI</strong>
        <span className="version">v{APP_VERSION}</span>
      </div>
      <div className="top-actions">
        {onClearChat && (
          <button
            type="button"
            className="text-button clear-button"
            onClick={onClearChat}
            disabled={!hasMessages}
            title={hasMessages ? 'Clear current chat' : 'No messages to clear'}
          >
            Clear chat
          </button>
        )}
        <button type="button" className="text-button" onClick={onChangelog}>
          Changelog
        </button>
        <button type="button" className="icon-button" onClick={onSettings} aria-label="Open settings">
          Settings
        </button>
      </div>
    </header>
  )
}
