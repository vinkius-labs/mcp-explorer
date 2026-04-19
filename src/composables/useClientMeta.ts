/**
 * Client logo & brand metadata.
 * Uses Google's favicon proxy for consistent 128px icons.
 * Direct URLs used where higher-quality assets are available.
 */

const gf = (domain: string) =>
  `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`

export interface ClientBrand {
  logo: string
  color: string
}

const clientMeta: Record<string, ClientBrand> = {
  claude: {
    color: '#D97757',
    logo: gf('claude.ai'),
  },
  cursor: {
    color: '#00D1FF',
    logo: gf('cursor.com'),
  },
  vscode: {
    color: '#007ACC',
    logo: gf('code.visualstudio.com'),
  },
  'vscode-insiders': {
    color: '#24BFA5',
    logo: gf('code.visualstudio.com'),
  },
  windsurf: {
    color: '#00C853',
    logo: gf('windsurf.com'),
  },
  continue: {
    color: '#E8573A',
    logo: gf('continue.dev'),
  },
  copilot: {
    color: '#6E40C9',
    logo: gf('github.com'),
  },
  gemini: {
    color: '#4285F4',
    logo: 'https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06b.png',
  },
  antigravity: {
    color: '#FBBC04',
    logo: 'https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06b.png',
  },
  jetbrains: {
    color: '#FC801D',
    logo: gf('jetbrains.com'),
  },
  goose: {
    color: '#FF6B35',
    logo: 'https://raw.githubusercontent.com/block/goose/main/ui/desktop/src/images/icon.png',
  },
  cline: {
    color: '#F5A623',
    logo: gf('cline.bot'),
  },
  'cline-insiders': {
    color: '#F5A623',
    logo: gf('cline.bot'),
  },
  'roo-code': {
    color: '#8B5CF6',
    logo: gf('roocode.com'),
  },
  'roo-code-insiders': {
    color: '#8B5CF6',
    logo: gf('roocode.com'),
  },
  'claude-code': {
    color: '#D97757',
    logo: gf('claude.ai'),
  },
  openclaw: {
    color: '#EF4444',
    logo: gf('openclaw.ai'),
  },
  codex: {
    color: '#10B981',
    logo: gf('openai.com'),
  },
}

const fallback: ClientBrand = { color: '#6B7280', logo: '' }

export function getClientMeta(clientId: string): ClientBrand {
  return clientMeta[clientId] ?? fallback
}

export function getClientInitial(name: string): string {
  return name.charAt(0).toUpperCase()
}
