import { z } from 'zod'

/**
 * Pure validation helpers for the maintainer application form.
 * Kept separate from the `'use server'` action so they unit-test directly
 * (a 'use server' module may only export async functions).
 */

const MICROSOFT_DOMAIN = 'microsoft.com'

/**
 * Microsoft corporate-email rule (2A). Parse the domain as everything after the
 * LAST `@` and exact-match `microsoft.com`. NEVER substring-match —
 * `includes('microsoft.com')` would accept `x@microsoft.com.evil.com`.
 */
export function isMicrosoftEmail(email: string): boolean {
  if (typeof email !== 'string') return false
  const at = email.lastIndexOf('@')
  if (at <= 0 || at === email.length - 1) return false
  const local = email.slice(0, at)
  const domain = email.slice(at + 1)
  // Reject a second '@' in the local part (e.g. a@b@microsoft.com).
  if (local.includes('@')) return false
  if (!local.length) return false
  return domain.toLowerCase() === MICROSOFT_DOMAIN
}

/** Re-validate a submitted repository against the cached org repo list (1A). */
export function isAllowedRepo(repository: string, allowed: readonly string[]): boolean {
  if (!repository) return false
  return allowed.includes(repository)
}

/**
 * GitHub username: 1–39 chars, alphanumeric with single internal hyphens, no
 * leading/trailing hyphen (M4). Also guarantees no Azure-forbidden key chars.
 */
const githubUsername = z
  .string()
  .trim()
  .min(1, 'Please enter your github.com username.')
  .max(39, 'Please enter your github.com username.')
  .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/, 'Please enter your github.com username.')

export const MaintainerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Please enter your name.')
    .max(100, 'Name must be under 100 characters.'),
  email: z
    .string()
    .trim()
    .max(254, 'Email must be under 254 characters.')
    .refine(isMicrosoftEmail, { message: 'Please use your @microsoft.com corporate email.' }),
  githubUsername,
  repository: z.string().trim().min(1, 'Please select a repository.'),
})

export type MaintainerInput = z.infer<typeof MaintainerSchema>
