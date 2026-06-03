import { unstable_cache } from 'next/cache'

/**
 * Live org-repository list for the maintainer-application repo picker.
 *
 * - `fetchOrgRepos` does the raw unauthenticated GitHub fetch with a hardcoded
 *   fallback (pure-ish, unit-tested with a mocked global fetch).
 * - `getOrgRepos` wraps it in `unstable_cache` with an explicit TTL — NOT bare
 *   `fetch` `revalidate`, whose semantics are unreliable inside a server action on
 *   Next 16 (fetch is no longer cached by default). (eng M1)
 */

export interface Repo {
  name: string // bare repo name (slash-free — safe as an Azure PartitionKey)
  fullName: string // "owner/repo"
}

const CACHE_TTL_SECONDS = 3600

/**
 * Small, real, slash-free fallback list so the form still works when the GitHub
 * fetch fails/rate-limits or the org slug is wrong. Must never be empty (eng L2).
 * These are real public repos in the All-The-Vibes org.
 */
export const FALLBACK_REPOS: Repo[] = [
  { name: 'atv-platform', fullName: 'All-The-Vibes/atv-platform' },
  { name: 'ATV-StarterKit', fullName: 'All-The-Vibes/ATV-StarterKit' },
]

/** Map the GitHub `/orgs/{org}/repos` payload to our `Repo` shape, dropping junk. */
export function normalizeRepos(raw: unknown[]): Repo[] {
  if (!Array.isArray(raw)) return []
  const out: Repo[] = []
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue
    const r = item as { name?: unknown; full_name?: unknown }
    if (typeof r.name === 'string' && r.name && typeof r.full_name === 'string' && r.full_name) {
      out.push({ name: r.name, fullName: r.full_name })
    }
  }
  return out
}

/**
 * Raw fetch of an org's public repos. Falls back to FALLBACK_REPOS on any failure
 * (non-OK, thrown, or empty list). No token — public repos only (eng T4/T4-confirm).
 */
export async function fetchOrgRepos(org: string): Promise<Repo[]> {
  try {
    const res = await fetch(`https://api.github.com/orgs/${org}/repos?per_page=100&type=public`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!res.ok) return FALLBACK_REPOS
    const repos = normalizeRepos(await res.json())
    return repos.length > 0 ? repos : FALLBACK_REPOS
  } catch {
    return FALLBACK_REPOS
  }
}

/** Default org slug — the All The Vibes GitHub org. MUST be an ORG, not a user:
 *  the picker calls GET /orgs/{slug}/repos, which 404s for a personal account and
 *  then silently falls back to FALLBACK_REPOS (the "only one repo shows" bug). */
export const DEFAULT_ORG = 'All-The-Vibes'

/**
 * Cached org-repo accessor (explicit TTL via unstable_cache — M1).
 * Reads the org slug from GITHUB_ORG, defaulting to the All The Vibes org.
 */
export const getOrgRepos = unstable_cache(
  async (): Promise<Repo[]> => {
    const org = process.env.GITHUB_ORG || DEFAULT_ORG
    return fetchOrgRepos(org)
  },
  ['maintainer-org-repos'],
  { revalidate: CACHE_TTL_SECONDS, tags: ['maintainer-org-repos'] },
)
