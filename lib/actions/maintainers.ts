'use server'

import { headers } from 'next/headers'
import { MaintainerSchema, isAllowedRepo } from '@/lib/maintainers-validation'
import { insertApplication } from '@/lib/maintainers-db'
import { getOrgRepos } from '@/lib/repos'
import { maintainerSubmitLimiter, sanitizeWebhookField, clientIpFromForwarded } from '@/lib/rate-limit'

export type SubmitResult = {
  success?: boolean
  error?: string
  duplicate?: boolean
}

/**
 * Server action for the maintainer application form. Order matters:
 *   1. honeypot short-circuit BEFORE anything else (L3 — zero writes/webhook)
 *   2. rate-limit the no-auth path by IP (H2)
 *   3. Zod validation (email rule incl. substring-spoof, github charset — 2A/M4)
 *   4. re-validate repo against the live org list (1A)
 *   5. insert-or-409 dedup (M2); friendly errors on failure (1B)
 *   6. fire-and-forget webhook with sanitized fields (D1/M3)
 */
export async function submitMaintainerApplication(formData: FormData): Promise<SubmitResult> {
  // 1. Honeypot — hidden field must be empty. Bots fill it; fake success, do nothing.
  const honeypot = formData.get('website')
  if (honeypot) {
    return { success: true }
  }

  // 2. Rate limit by client IP (best-effort; behind Container Apps ingress).
  const headersList = await headers()
  const ip = clientIpFromForwarded(headersList.get('x-forwarded-for'))
  if (!maintainerSubmitLimiter.check(ip)) {
    return { error: 'Too many submissions. Please try again later.' }
  }

  // 3. Validate.
  const raw = {
    name: formData.get('name') ?? '',
    email: formData.get('email') ?? '',
    githubUsername: formData.get('githubUsername') ?? '',
    repository: formData.get('repository') ?? '',
  }
  const parsed = MaintainerSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  // 4. Re-validate the repo against the live org list (defends the no-auth write path).
  //    Use the CACHED accessor — same source as the form dropdown, one fetch/hour, so a
  //    valid selection can't be rejected by a per-submit GitHub rate-limit (eng review).
  const repos = await getOrgRepos()
  const allowed = repos.map((r) => r.fullName)
  if (!isAllowedRepo(parsed.data.repository, allowed)) {
    return { error: "That repository isn't open for maintainer applications." }
  }

  // 5. Insert (insert-or-409 dedup).
  try {
    const result = await insertApplication({
      name: parsed.data.name,
      email: parsed.data.email,
      githubUsername: parsed.data.githubUsername,
      repository: parsed.data.repository,
    })
    if (!result.ok && result.duplicate) {
      return {
        error: `You've already applied to maintain ${parsed.data.repository} — your application is on file. Questions? Reach out to the All The Vibes community.`,
        duplicate: true,
      }
    }
  } catch (error) {
    console.error('Failed to save maintainer application:', error)
    return { error: 'Something went wrong saving your application. Please try again in a moment.' }
  }

  // 6. Notify (fire-and-forget; never blocks or fails the submission).
  notifyWebhook(parsed.data).catch((err) =>
    console.error('Maintainer notification failed:', err),
  )

  return { success: true }
}

async function notifyWebhook(app: {
  name: string
  email: string
  githubUsername: string
  repository: string
}): Promise<void> {
  const webhookUrl = process.env.MAINTAINER_NOTIFY_WEBHOOK
  if (!webhookUrl) return

  const name = sanitizeWebhookField(app.name)
  const githubUsername = sanitizeWebhookField(app.githubUsername)
  const repository = sanitizeWebhookField(app.repository)
  const email = sanitizeWebhookField(app.email)
  const content = `New maintainer application: ${name} (github: ${githubUsername}) → ${repository} · ${email}`

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content,
      // Discord: never resolve mentions, even if one slipped through sanitization.
      allowed_mentions: { parse: [] },
    }),
  })
}
