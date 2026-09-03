import { useState } from 'react'
import { changelog, changelogAsMarkdown } from '../data/changelog'
import { saveApiKey } from '../services/settings'
import { DISPLAY_MODEL } from '../config'

interface SettingsProps {
  apiKey: string
  onSaved: (key: string) => void
  onClose: () => void
  showChangelog?: boolean
}

export function Settings({ apiKey, onSaved, onClose, showChangelog = false }: SettingsProps) {
  const [value, setValue] = useState(apiKey)
  const [saved, setSaved] = useState(false)
  const [isViewingChangelog, setIsViewingChangelog] = useState(showChangelog)

  function save() {
    saveApiKey(value)
    onSaved(value.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  function download() {
    const url = URL.createObjectURL(new Blob([changelogAsMarkdown(changelog)], { type: 'text/markdown' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'personal-ai-changelog.md'
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isViewingChangelog) {
    return (
      <section className="panel">
        <div className="panel-heading">
          <button
            type="button"
            className="back-button"
            onClick={() => setIsViewingChangelog(false)}
            aria-label="Back to Settings"
            title="Back to Settings"
          >
            ← Back
          </button>
          <h1>Changelog</h1>
        </div>
        <div className="changelog-actions">
          <button type="button" className="download-button" onClick={download}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Download Markdown</span>
          </button>
        </div>
        <div className="releases">
          {changelog.map((release) => (
            <article className="release" key={release.version}>
              <div className="release-header">
                <h2>v{release.version}{release.title && ` — ${release.title}`}</h2>
                <span className="release-date">Released: {release.date}</span>
              </div>
              {(['added', 'changed', 'fixed', 'removed'] as const).map((key) =>
                release[key]?.length ? (
                  <div key={key} className="release-section">
                    <h3>{key}</h3>
                    <ul>
                      {release[key]!.map((entry) => (
                        <li key={entry}>{entry}</li>
                      ))}
                    </ul>
                  </div>
                ) : null
              )}
            </article>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <button
          type="button"
          className="back-button"
          onClick={onClose}
          aria-label="Back to Chat"
          title="Back to Chat"
        >
          ← Back
        </button>
        <h1>Settings</h1>
      </div>

      <div className="settings-form">
        <label htmlFor="api-key">Gemini API Key</label>
        <input
          id="api-key"
          type="password"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Paste your API key"
          autoComplete="off"
        />
        <button type="button" className="primary-button" onClick={save}>
          {saved ? 'Saved' : 'Save key'}
        </button>

        <div className="setting-row">
          <span>Current model</span>
          <strong>{DISPLAY_MODEL}</strong>
        </div>

        <div className="setting-row changelog-link-row">
          <div>
            <div className="setting-label-bold">Application Changelog</div>
            <div className="setting-desc">View release history and download Markdown notes</div>
          </div>
          <button
            type="button"
            className="secondary-button changelog-nav-btn"
            onClick={() => setIsViewingChangelog(true)}
          >
            View Changelog →
          </button>
        </div>

        <p className="muted">Your key is stored locally in this browser and is sent directly to Google’s Gemini API.</p>
      </div>
    </section>
  )
}

