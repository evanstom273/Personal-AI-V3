import type { ChangelogRelease } from '../types'

export const changelog: ChangelogRelease[] = [
  {
    version: '0.2.0',
    date: '2026-09-03',
    title: 'Search Grounding & Composer Menu',
    added: [
      'Composer "+" menu with actions and quick toggles.',
      'Google Search Grounding toggle powered by Gemini 2 search.',
      'Interactive search status badge indicator in the message composer.',
      'Keyboard and click-outside dismissal for composer popover menu.'
    ],
    changed: [
      'Updated default AI model to Gemini 2.5 Flash-Lite.',
      'Enhanced mobile composer viewport anchoring and safe area handling.',
      'Optimized GitHub Pages automated deployment workflow.'
    ]
  },
  {
    version: '0.1.0',
    date: '2026-09-03',
    title: 'Initial Chat',
    added: [
      'Initial Personal AI V3 application foundation.',
      'Mobile-first React, TypeScript and Vite interface.',
      'Basic conversational chat interface.',
      'Gemini 3.1 Flash-Lite integration.',
      'Streaming assistant responses.',
      'Conversational context for follow-up messages.',
      'Ability to stop an active generation.',
      'Local Gemini API-key configuration.',
      'Basic Settings interface.',
      'Local conversation persistence using IndexedDB.',
      'Persistent API/settings storage.',
      'Basic API and generation error handling.',
      'Stable UUID-based message IDs.',
      'Application versioning.',
      'In-app changelog.',
      'Current version displayed in the top bar.',
      'Live local date and time displayed in the top bar.',
      'Markdown export for the complete application changelog.'
    ]
  }
]

export function changelogAsMarkdown(releases: ChangelogRelease[]): string {
  const sections = releases.map((release) => {
    const lines = [`## v${release.version}${release.title ? ` — ${release.title}` : ''}`, '', `Released: ${release.date}`]
    for (const [label, items] of [['Added', release.added], ['Changed', release.changed], ['Fixed', release.fixed], ['Removed', release.removed]] as const) {
      if (items?.length) lines.push('', `### ${label}`, '', ...items.map((item) => `- ${item}`))
    }
    return lines.join('\n')
  })
  return `# Personal AI — Changelog\n\n${sections.join('\n\n') }\n`
}

export const changelogToMarkdown = changelogAsMarkdown
