import { describe, it, expect } from 'vitest'
import { RateLimiter, sanitizeWebhookField, clientIpFromForwarded } from './rate-limit'

describe('clientIpFromForwarded (H2 — trust the proxy-appended right hop, not client-set left)', () => {
  it('takes the RIGHT-most hop (appended by trusted ingress), not the spoofable left', () => {
    // attacker sets "1.1.1.1", ingress appends real peer "203.0.113.9"
    expect(clientIpFromForwarded('1.1.1.1, 203.0.113.9')).toBe('203.0.113.9')
  })
  it('handles a single hop', () => {
    expect(clientIpFromForwarded('203.0.113.9')).toBe('203.0.113.9')
  })
  it('returns empty string for empty/missing header (shared bounded bucket)', () => {
    expect(clientIpFromForwarded('')).toBe('')
    expect(clientIpFromForwarded(null)).toBe('')
  })
  it('trims whitespace around hops', () => {
    expect(clientIpFromForwarded('1.1.1.1 ,  203.0.113.9 ')).toBe('203.0.113.9')
  })
})

describe('RateLimiter (H2 — IP-keyed fixed-window)', () => {
  it('allows up to the limit within the window, then rejects', () => {
    const now = 1_000_000
    const rl = new RateLimiter({ limit: 3, windowMs: 60_000, now: () => now })
    expect(rl.check('1.2.3.4')).toBe(true) // 1
    expect(rl.check('1.2.3.4')).toBe(true) // 2
    expect(rl.check('1.2.3.4')).toBe(true) // 3
    expect(rl.check('1.2.3.4')).toBe(false) // 4th — over limit
  })

  it('tracks IPs independently', () => {
    const now = 1_000_000
    const rl = new RateLimiter({ limit: 1, windowMs: 60_000, now: () => now })
    expect(rl.check('1.1.1.1')).toBe(true)
    expect(rl.check('1.1.1.1')).toBe(false)
    expect(rl.check('2.2.2.2')).toBe(true) // different IP unaffected
  })

  it('resets after the window elapses', () => {
    let now = 1_000_000
    const rl = new RateLimiter({ limit: 1, windowMs: 60_000, now: () => now })
    expect(rl.check('1.1.1.1')).toBe(true)
    expect(rl.check('1.1.1.1')).toBe(false)
    now += 60_001 // window passed
    expect(rl.check('1.1.1.1')).toBe(true)
  })

  it('treats an unknown/empty IP as a single shared bucket (fails safe, still bounded)', () => {
    const now = 1_000_000
    const rl = new RateLimiter({ limit: 1, windowMs: 60_000, now: () => now })
    expect(rl.check('')).toBe(true)
    expect(rl.check('')).toBe(false)
  })

  it('evicts expired buckets so the map cannot grow unbounded (memory-DoS guard)', () => {
    let now = 1_000_000
    const rl = new RateLimiter({ limit: 1, windowMs: 1_000, now: () => now })
    // 100 distinct one-shot keys
    for (let i = 0; i < 100; i++) rl.check(`ip-${i}`)
    expect(rl.size).toBe(100)
    now += 2_000 // all windows expired
    rl.check('fresh') // any check triggers an opportunistic sweep
    expect(rl.size).toBe(1) // expired buckets evicted, only 'fresh' remains
  })
})

describe('sanitizeWebhookField (M3 — mention/markdown/control-char stripping)', () => {
  it('strips @ to neutralize @everyone / @here / mentions', () => {
    expect(sanitizeWebhookField('@everyone ship it')).not.toContain('@')
  })
  it('neutralizes markdown link/format metacharacters (phishing-in-notification)', () => {
    const out = sanitizeWebhookField('[click](https://evil.example) `code` >quote')
    expect(out).not.toMatch(/[[\]()`>]/)
  })
  it('strips control characters and newlines (message forgery)', () => {
    const out = sanitizeWebhookField('line1\nline2\r ')
    expect(out).not.toMatch(/[\n\r]/)
  })
  it('length-caps long input', () => {
    expect(sanitizeWebhookField('a'.repeat(500)).length).toBeLessThanOrEqual(200)
  })
  it('leaves a normal value essentially intact', () => {
    expect(sanitizeWebhookField('Ada Lovelace')).toBe('Ada Lovelace')
  })
  it('handles non-string input safely', () => {
    expect(sanitizeWebhookField(undefined as unknown as string)).toBe('')
  })
})
