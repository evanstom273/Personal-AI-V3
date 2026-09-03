import { APP_VERSION } from '../config'

interface TopBarProps { onSettings: () => void; onChangelog: () => void }

export function TopBar({ onSettings, onChangelog }: TopBarProps) {
  return <header className="topbar">
    <div><strong>Personal AI</strong><span className="version">v{APP_VERSION}</span></div>
    <div className="top-actions"><button className="text-button" onClick={onChangelog}>Changelog</button><button className="icon-button" onClick={onSettings} aria-label="Open settings">Settings</button></div>
  </header>
}
