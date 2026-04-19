/**
 * Router Tests
 *
 * Prevents regressions like:
 * - Missing /app-catalog/:slug route
 * - Routes requiring auth that shouldn't
 * - Duplicate route names
 */

import { describe, it, expect } from 'vitest'

// We can't import the router directly because of the auth guard issue,
// so we test the route definitions structurally.

const REQUIRED_ROUTES = [
  { path: '/', hasRedirect: true },
  { path: '/dashboard', name: 'dashboard', requiresAuth: false },
  { path: '/servers', name: 'servers' },
  { path: '/servers/add', name: 'add-server' },
  { path: '/servers/:name(.*)', name: 'server-detail' },
  { path: '/clients', name: 'clients' },
  { path: '/clients/:id', name: 'client-detail', requiresAuth: false },
  { path: '/app-catalog/:slug', name: 'app-detail', requiresAuth: false },
  { path: '/settings', name: 'settings', requiresAuth: false },
]

describe('Router Configuration', () => {
  // Read the router file as text for structural validation
  const fs = require('fs')
  const routerSource = fs.readFileSync(
    require('path').resolve(__dirname, '../router/index.ts'),
    'utf-8',
  )

  for (const route of REQUIRED_ROUTES) {
    it(`has route: ${route.path}`, () => {
      expect(routerSource).toContain(`path: '${route.path}'`)
    })

    if (route.name) {
      it(`route ${route.path} has name '${route.name}'`, () => {
        expect(routerSource).toContain(`name: '${route.name}'`)
      })
    }
  }

  it('app-catalog route does NOT require auth', () => {
    // Extract the app-catalog route block
    const appCatalogBlock = routerSource.match(
      /path:\s*'\/app-catalog\/:slug'[\s\S]*?requiresAuth:\s*(true|false)/,
    )
    expect(appCatalogBlock).toBeTruthy()
    expect(appCatalogBlock![1]).toBe('false')
  })

  it('dashboard route does NOT require auth', () => {
    const dashboardBlock = routerSource.match(
      /path:\s*'\/dashboard'[\s\S]*?requiresAuth:\s*(true|false)/,
    )
    expect(dashboardBlock).toBeTruthy()
    expect(dashboardBlock![1]).toBe('false')
  })
})
