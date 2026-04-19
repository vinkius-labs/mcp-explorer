/**
 * Design System Regression Tests
 *
 * Prevents regressions like:
 * - Spotify green (#1db954) leaking back into source files
 * - Indigo/purple accent reappearing
 * - BOM markers corrupting Vue SFC files
 * - Hardcoded competitor names in UI components
 */

import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join, extname } from 'path'

const SRC_DIR = join(__dirname, '..')

function walkFiles(dir: string, extensions: string[]): string[] {
  const results: string[] = []
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      const stat = statSync(full)
      if (stat.isDirectory() && entry !== 'node_modules' && entry !== '__tests__') {
        results.push(...walkFiles(full, extensions))
      } else if (stat.isFile() && extensions.includes(extname(full))) {
        results.push(full)
      }
    }
  } catch {
    // skip unreadable dirs
  }
  return results
}

const sourceFiles = walkFiles(SRC_DIR, ['.vue', '.ts', '.css'])

describe('No Spotify Green (#1db954)', () => {
  it.each(sourceFiles)('%s does not contain #1db954', (file) => {
    const content = readFileSync(file, 'utf-8')
    expect(content).not.toContain('#1db954')
  })

  it.each(sourceFiles)('%s does not contain #1ed760', (file) => {
    const content = readFileSync(file, 'utf-8')
    expect(content).not.toContain('#1ed760')
  })
})

describe('No Competitor Names in UI', () => {
  const uiFiles = sourceFiles.filter((f) => f.endsWith('.vue'))
  const competitors = ['Smithery', 'Glama', 'Composio', 'PulseMCP', 'mcp.so', 'MCPServers']

  for (const competitor of competitors) {
    it.each(uiFiles)(`%s does not reference "${competitor}"`, (file) => {
      const content = readFileSync(file, 'utf-8')
      // Allow mentions in comments, but not in template or script logic
      const withoutComments = content
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*/g, '')
      expect(withoutComments).not.toContain(competitor)
    })
  }
})

describe('No BOM Markers', () => {
  it.each(sourceFiles)('%s has no UTF-8 BOM', (file) => {
    const buffer = readFileSync(file)
    const hasBom = buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf
    expect(hasBom).toBe(false)
  })
})

describe('Titanium Design Tokens', () => {
  it('dark mode primary is titanium (neutral hue, high lightness)', () => {
    const cssPath = sourceFiles.find((f) => f.endsWith('index.css'))
    expect(cssPath).toBeDefined()

    const css = readFileSync(cssPath!, 'utf-8')

    // Extract the --primary value from .dark block
    const darkBlock = css.match(/\.dark\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''
    const primaryMatch = darkBlock.match(/--primary:\s*([^;]+);/)

    expect(primaryMatch).toBeTruthy()

    const [h, s] = primaryMatch![1].trim().split(/\s+/).map(v => parseFloat(v))
    // Titanium = neutral hue (0), low saturation (0%), high lightness
    expect(h).toBe(0)
    expect(s).toBe(0)
  })
})
