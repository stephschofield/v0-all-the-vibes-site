/**
 * Lightweight in-memory rate limiting + webhook payload sanitization for the
 * no-auth maintainer submit path (eng H2/M3).
 *
 * The rate limiter is a fixed-window counter keyed by client IP. In-memory is
 * sufficient for a low-volume community form on a single container; it bounds the
 * worst of bot floods (Azure rows, webhook spam, GitHub rate-limit burn) without
 * new infra. A multi-replica deployment would want a shared store — noted, deferred.
 */

interface RateLimiterOptions {
  limit: number
  windowMs: number
  now?: () => number
}

interface Bucket {
  count: number
  resetAt: number
}

export class RateLimiter {
  private readonly limit: number
  private readonly windowMs: number
  private readonly now: () => number
  private readonly buckets = new Map<string, Bucket>()

  constructor({ limit, windowMs, now }: RateLimiterOptions) {
    this.limit = limit
    this.windowMs = windowMs
    this.now = now ?? (() => Date.now())
  }

  /** Number of live buckets (for tests / introspection). */
  get size(): number {
    return this.buckets.size
  }

  /** Drop every bucket whose window has expired — keeps the map bounded. */
  private sweep(t: number): void {
    for (const [key, bucket] of this.buckets) {
      if (t >= bucket.resetAt) this.buckets.delete(key)
    }
  }

  /** Returns true if this key is allowed (and records the hit), false if over limit. */
  check(key: string): boolean {
    const k = key || '__unknown__'
    const t = this.now()
    // Opportunistic eviction so unique-key floods can't grow the map without bound.
    this.sweep(t)
    const bucket = this.buckets.get(k)
    if (!bucket || t >= bucket.resetAt) {
      this.buckets.set(k, { count: 1, resetAt: t + this.windowMs })
      return true
    }
    if (bucket.count >= this.limit) return false
    bucket.count += 1
    return true
  }
}

/**
 * Extract the client IP to rate-limit on from an `X-Forwarded-For` header.
 *
 * XFF is `client, proxy1, proxy2, …` — the LEFT-most value is whatever the original
 * caller *sent* and is fully attacker-spoofable. Trusted ingress (Azure Container
 * Apps) appends the real observed peer on the RIGHT, so we key on the right-most hop.
 * Keying on the left-most hop lets an attacker mint a fresh bucket per request and
 * defeat the limiter entirely (eng review HIGH).
 */
export function clientIpFromForwarded(forwarded: string | null | undefined): string {
  if (!forwarded) return ''
  const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean)
  return parts.length ? parts[parts.length - 1] : ''
}

/** Shared limiter for the maintainer submit action: 5 submissions / IP / hour. */
export const maintainerSubmitLimiter = new RateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 })

const WEBHOOK_FIELD_MAX = 200

/**
 * Neutralize a user-supplied value before interpolating it into a chat webhook:
 * strip `@` (kills @everyone/@here/mentions), drop control chars + newlines
 * (message forgery), collapse whitespace, and length-cap. (eng M3)
 */
export function sanitizeWebhookField(value: string): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(/[\x00-\x1f\x7f-\x9f]/g, ' ') // control chars + newlines → space
    .replace(/@/g, '') // strip mentions
    .replace(/[[\]()`>]/g, '') // neutralize markdown links/code/quotes (phishing)
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim()
    .slice(0, WEBHOOK_FIELD_MAX)
}
