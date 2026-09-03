import type { ChangelogRelease } from '../types'

export const changelog: ChangelogRelease[] = [
  {
    version: '0.4.1',
    date: '2026-09-03',
    title: 'Mobile Settings Fix',
    fixed: [
      'Fixed Settings layout being squeezed into an unusably narrow panel on mobile.',
      'Fixed clipped Settings headings and controls.',
      'Fixed excessive wrapping of model and settings information.',
      'Fixed Changelog controls extending beyond the mobile viewport.',
      'Improved responsive behaviour of Settings and Changelog views.',
      'Prevented horizontal overflow in mobile Settings.'
    ]
  },
  {
    version: '0.4.0',
    date: '2026-09-03',
    title: 'Interface Refresh',
    added: [
      'Changelog access from Settings.'
    ],
    changed: [
      'Redesigned the application top bar.',
      'Grouped Personal AI, version and live date/time on the left side of the header.',
      'Replaced text-based Clear Chat and Settings controls with compact icon buttons.',
      'Moved Changelog access from the top bar into Settings.',
      'Added clearer visual separation between user and Personal AI messages.',
      'User messages now use compact right-aligned message bubbles.',
      'Personal AI responses now use a cleaner left-aligned conversational layout.',
      'Improved conversation spacing and readability.',
      'Refined generated media presentation.',
      'Refined composer spacing and mobile presentation.',
      'Improved responsive behaviour of the top bar on narrow screens.'
    ]
  },
  {
    version: '0.3.0',
    date: '2026-09-03',
    title: 'Media Generation',
    added: [
      'Image generation using Gemini 3.1 Flash Lite Image / Nano Banana 2 Lite.',
      'Music generation using Lyria 3 Pro.',
      'Create Image option in the composer "+" menu.',
      'Create Music option in the composer "+" menu.',
      'Inline generated images in conversations.',
      'Inline playback of generated music.',
      'Download support for generated images.',
      'Download support for generated audio.',
      'Local persistence for generated media.',
      'Media-specific generation and error states.',
      'Support for image and audio content within the conversation data model.'
    ]
  },
  {
    version: '0.2.1',
    date: '2026-09-03',
    title: 'Markdown Rendering & Clear Chat',
    added: [
      'Added the ability to clear the current conversation with confirmation.'
    ],
    fixed: [
      'Assistant responses now render Markdown instead of displaying raw Markdown syntax.',
      'Improved rendering of headings, emphasis, lists, links, blockquotes, code and other common Markdown content.',
      'Markdown rendering works with streamed Gemini responses.',
      'Improved mobile presentation of Markdown content such as code blocks and tables.'
    ]
  },
  {
    version: '0.2.0',
    date: '2026-09-03',
    title: 'Search Grounding & Composer Menu',
    added: [
      'Composer "+" menu with actions and quick toggles.',
      'Google Search Grounding toggle powered by Google Search.',
      'Interactive search status badge indicator in the message composer.',
      'Keyboard and click-outside dismissal for composer popover menu.'
    ],
    changed: [
      'Configured Google Search grounding with Gemini 3.1 Flash-Lite.',
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
