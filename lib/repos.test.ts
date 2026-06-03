import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { normalizeRepos, FALLBACK_REPOS, fetchOrgRepos, DEFAULT_ORG, type Repo } from './repos'

describe('normalizeRepos', () => {
  it('maps the GitHub API shape to {name, fullName}', () => {
    const raw = [
      { name: 'v0-all-the-vibes-site', full_name: 'stephschofield/v0-all-the-vibes-site' },
      { name: 'other', full_name: 'stephschofield/other' },
    ]
    expect(normalizeRepos(raw)).toEqual<Repo[]>([
      { name: 'v0-all-the-vibes-site', fullName: 'stephschofield/v0-all-the-vibes-site' },
      { name: 'other', fullName: 'stephschofield/other' },
    ])
  })

  it('drops entries missing name or full_name (defensive)', () => {
    const raw = [
      { name: 'ok', full_name: 'o/ok' },
      { name: '', full_name: 'o/blank' },
      { full_name: 'o/noname' },
      { name: 'nofull' },
    ]
    expect(normalizeRepos(raw as unknown[])).toEqual([{ name: 'ok', fullName: 'o/ok' }])
  })

  it('returns an empty array for non-array input', () => {
    expect(normalizeRepos(null as unknown as unknown[])).toEqual([])
    expect(normalizeRepos({} as unknown as unknown[])).toEqual([])
  })
})

describe('DEFAULT_ORG', () => {
  // Regression guard for the "only one repo shows" bug: the default MUST be the
  // All-The-Vibes *org*, never a personal user (whose /orgs/{user}/repos 404s and
  // silently degrades to FALLBACK_REPOS).
  it('is the All-The-Vibes org slug', () => {
    expect(DEFAULT_ORG).toBe('All-The-Vibes')
  })
  it('is never a known personal account', () => {
    expect(DEFAULT_ORG).not.toBe('stephschofield')
  })
})

describe('FALLBACK_REPOS', () => {
  it('is non-empty (must never ship an empty fallback — eng L2/Finding 3)', () => {
    expect(FALLBACK_REPOS.length).toBeGreaterThan(0)
  })
  it('every fallback name is slash-free (safe as an Azure PartitionKey)', () => {
    for (const r of FALLBACK_REPOS) expect(r.name).not.toContain('/')
  })
})

describe('fetchOrgRepos (live fetch + fallback)', () => {
  const realFetch = globalThis.fetch
  beforeEach(() => { vi.restoreAllMocks() })
  afterEach(() => { globalThis.fetch = realFetch })

  it('returns normalized repos on a 200', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ name: 'r1', full_name: 'org/r1' }],
    }) as unknown as typeof fetch
    const repos = await fetchOrgRepos('org')
    expect(repos).toEqual([{ name: 'r1', fullName: 'org/r1' }])
  })

  it('falls back to FALLBACK_REPOS on a non-OK response (403 rate-limit)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({}) }) as unknown as typeof fetch
    expect(await fetchOrgRepos('org')).toEqual(FALLBACK_REPOS)
  })

  it('falls back when fetch throws (network down)', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED')) as unknown as typeof fetch
    expect(await fetchOrgRepos('org')).toEqual(FALLBACK_REPOS)
  })

  it('falls back when the org returns an empty repo list', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] }) as unknown as typeof fetch
    expect(await fetchOrgRepos('org')).toEqual(FALLBACK_REPOS)
  })

  it('calls the correct GitHub org endpoint', async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ name: 'r', full_name: 'o/r' }] })
    globalThis.fetch = f as unknown as typeof fetch
    await fetchOrgRepos('my-org')
    expect(f).toHaveBeenCalledOnce()
    expect(String(f.mock.calls[0][0])).toContain('/orgs/my-org/repos')
  })
})
