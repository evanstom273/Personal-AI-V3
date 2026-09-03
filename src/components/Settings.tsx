import { useState } from 'react'
import { changelog, changelogAsMarkdown } from '../data/changelog'
import { saveApiKey } from '../services/settings'

interface SettingsProps { apiKey: string; onSaved: (key: string) => void; onClose: () => void; showChangelog?: boolean }

export function Settings({ apiKey, onSaved, onClose, showChangelog = false }: SettingsProps) {
  const [value, setValue] = useState(apiKey)
  const [saved, setSaved] = useState(false)
  function save() { saveApiKey(value); onSaved(value.trim()); setSaved(true); setTimeout(() => setSaved(false), 1800) }
  function download() { const url = URL.createObjectURL(new Blob([changelogAsMarkdown(changelog)], { type: 'text/markdown' })); const link = document.createElement('a'); link.href = url; link.download = 'personal-ai-changelog.md'; link.click(); URL.revokeObjectURL(url) }
  return <section className="panel"><div className="panel-heading"><button className="back-button" onClick={onClose}>←</button><h1>{showChangelog ? 'Changelog' : 'Settings'}</h1></div>{showChangelog ? <><button className="download-button" onClick={download}>Download Markdown</button><div className="releases">{changelog.map((release) => <article className="release" key={release.version}><h2>v{release.version}{release.title && ` — ${release.title}`}</h2><p className="release-date">Released: {release.date}</p>{(['added', 'changed', 'fixed', 'removed'] as const).map((key) => release[key]?.length ? <div key={key}><h3>{key}</h3><ul>{release[key].map((entry) => <li key={entry}>{entry}</li>)}</ul></div> : null)}</article>)}</div></> : <div className="settings-form"><label htmlFor="api-key">Gemini API Key</label><input id="api-key" type="password" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Paste your API key" autoComplete="off"/><button className="primary-button" onClick={save}>{saved ? 'Saved' : 'Save key'}</button><div className="setting-row"><span>Current model</span><strong>Gemini 3.1 Flash-Lite</strong></div><p className="muted">Your key is stored locally in this browser and is sent directly to Google’s Gemini API.</p></div>}</section>
}
