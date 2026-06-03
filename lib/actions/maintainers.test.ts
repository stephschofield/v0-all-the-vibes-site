import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Build a FormData from a plain object for action tests.
function fd(obj: Record<string, string>): FormData {
  const f = new FormData()
  for (const [k, v] of Object.entries(obj)) f.append(k, v)
  return f
}

const VALID = {
  name: 'Ada Lovelace',
  email: 'ada@microsoft.com',
  githubUsername: 'ada-lovelace',
  repository: 'stephschofield/v0-all-the-vibes-site',
  website: '', // honeypot empty
}

// Shared mock handles, reset per test.
let insertApplication: ReturnType<typeof vi.fn>
let fetchOrgRepos: ReturnType<typeof vi.fn>
let limiterCheck: ReturnType<typeof vi.fn>
let fetchMock: ReturnType<typeof vi.fn>

async function loadAction() {
  vi.doMock('@/lib/maintainers-db', () => ({
    insertApplication,
    deriveKeys: (r: string, u: string) => ({ partitionKey: r.split('/').pop(), rowKey: u.toLowerCase() }),
  }))
  vi.doMock('@/lib/repos', () => ({
    fetchOrgRepos,
    getOrgRepos: fetchOrgRepos,
    FALLBACK_REPOS: [{ name: 'v0-all-the-vibes-site', fullName: 'stephschofield/v0-all-the-vibes-site' }],
  }))
  vi.doMock('@/lib/rate-limit', async () => {
    const actual = await vi.importActual<typeof import('@/lib/rate-limit')>('@/lib/rate-limit')
    return {
      ...actual,
      maintainerSubmitLimiter: { check: limiterCheck },
    }
  })
  vi.doMock('next/headers', () => ({
    headers: async () => new Map([['x-forwarded-for', '9.9.9.9']]),
  }))
  return import('@/lib/actions/maintainers')
}

beforeEach(() => {
  vi.resetModules()
  insertApplication = vi.fn().mockResolvedValue({ ok: true })
  fetchOrgRepos = vi.fn().mockResolvedValue([
    { name: 'v0-all-the-vibes-site', fullName: 'stephschofield/v0-all-the-vibes-site' },
  ])
  limiterCheck = vi.fn().mockReturnValue(true)
  fetchMock = vi.fn().mockResolvedValue({ ok: true })
  globalThis.fetch = fetchMock as unknown as typeof fetch
  process.env.MAINTAINER_NOTIFY_WEBHOOK = ''
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs?.()
})

describe('submitMaintainerApplication', () => {
  it('happy path: valid application inserts and returns success', async () => {
    const { submitMaintainerApplication } = await loadAction()
    const res = await submitMaintainerApplication(fd(VALID))
    expect(res.success).toBe(true)
    expect(insertApplication).toHaveBeenCalledOnce()
    const arg = insertApplication.mock.calls[0][0]
    expect(arg.repository).toBe('stephschofield/v0-all-the-vibes-site')
    expect(arg.githubUsername).toBe('ada-lovelace')
  })

  it('L3: honeypot filled → fake success, ZERO db writes, ZERO webhook calls', async () => {
    const { submitMaintainerApplication } = await loadAction()
    const res = await submitMaintainerApplication(fd({ ...VALID, website: 'http://bot.example' }))
    expect(res.success).toBe(true)
    expect(insertApplication).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(limiterCheck).not.toHaveBeenCalled()
  })

  it('H2: over the rate limit → friendly error, no insert', async () => {
    limiterCheck.mockReturnValue(false)
    const { submitMaintainerApplication } = await loadAction()
    const res = await submitMaintainerApplication(fd(VALID))
    expect(res.error).toMatch(/too many|try again/i)
    expect(insertApplication).not.toHaveBeenCalled()
  })

  it('rejects a non-Microsoft email with a clear message, no insert', async () => {
    const { submitMaintainerApplication } = await loadAction()
    const res = await submitMaintainerApplication(fd({ ...VALID, email: 'ada@gmail.com' }))
    expect(res.error).toMatch(/@microsoft\.com/i)
    expect(insertApplication).not.toHaveBeenCalled()
  })

  it('★ rejects the substring-spoof email, no insert', async () => {
    const { submitMaintainerApplication } = await loadAction()
    const res = await submitMaintainerApplication(fd({ ...VALID, email: 'ada@microsoft.com.evil.com' }))
    expect(res.error).toBeTruthy()
    expect(insertApplication).not.toHaveBeenCalled()
  })

  it('1A: rejects a repo not in the org list (tampered), no insert', async () => {
    const { submitMaintainerApplication } = await loadAction()
    const res = await submitMaintainerApplication(fd({ ...VALID, repository: 'attacker/evil' }))
    expect(res.error).toMatch(/repository/i)
    expect(insertApplication).not.toHaveBeenCalled()
  })

  it('M2: duplicate (insert returns duplicate) → friendly "already applied", form not cleared', async () => {
    insertApplication.mockResolvedValue({ ok: false, duplicate: true })
    const { submitMaintainerApplication } = await loadAction()
    const res = await submitMaintainerApplication(fd(VALID))
    expect(res.error).toMatch(/already applied/i)
    expect(res.duplicate).toBe(true)
  })

  it('1B: Azure insert throws → friendly "something went wrong", no leak', async () => {
    insertApplication.mockRejectedValue(new Error('azure 500'))
    const { submitMaintainerApplication } = await loadAction()
    const res = await submitMaintainerApplication(fd(VALID))
    expect(res.error).toMatch(/went wrong|try again/i)
    expect(res.error).not.toMatch(/azure 500/)
  })

  it('fires the webhook on success when MAINTAINER_NOTIFY_WEBHOOK is set, with @ stripped', async () => {
    process.env.MAINTAINER_NOTIFY_WEBHOOK = 'https://example.com/hook'
    const { submitMaintainerApplication } = await loadAction()
    await submitMaintainerApplication(fd({ ...VALID, name: '@everyone Ada' }))
    // fire-and-forget — allow the microtask to flush
    await new Promise((r) => setTimeout(r, 0))
    expect(fetchMock).toHaveBeenCalledOnce()
    const body = String((fetchMock.mock.calls[0][1] as RequestInit).body)
    expect(body).not.toContain('@everyone')
  })

  it('does NOT fire the webhook when MAINTAINER_NOTIFY_WEBHOOK is unset', async () => {
    process.env.MAINTAINER_NOTIFY_WEBHOOK = ''
    const { submitMaintainerApplication } = await loadAction()
    await submitMaintainerApplication(fd(VALID))
    await new Promise((r) => setTimeout(r, 0))
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
