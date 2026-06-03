'use server'

import { getOrgRepos, type Repo } from '@/lib/repos'

/**
 * Server action wrapper so the client `MaintainerApplyForm` can load the repo list
 * from a `useEffect` (EditorPane is a client component and cannot server-fetch — H1).
 */
export async function loadOrgRepos(): Promise<Repo[]> {
  return getOrgRepos()
}
