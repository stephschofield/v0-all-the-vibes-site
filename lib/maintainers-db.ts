import { TableClient } from '@azure/data-tables'

/**
 * Azure Table Storage data module for maintainer applications.
 *
 * Schema (corrected in eng review — C1/H3):
 *   PartitionKey = BARE repo name (e.g. "v0-all-the-vibes-site")  ← no slash
 *   RowKey       = githubUsername.toLowerCase()                   ← case-insensitive dedup
 *   repository   = full "owner/repo" (non-key property, for the record + notification)
 *
 * Azure Table Storage forbids `/ \ # ?` and control chars in PartitionKey AND RowKey.
 * A GitHub "owner/repo" fullName contains `/`, so it CANNOT be a key — every insert and
 * lookup would 400. The org is constant for this app, so the owner prefix is redundant;
 * the bare repo name is unique and slash-free (GitHub disallows `/` in repo names).
 */

const TABLE_NAME = 'MaintainerApplications'

/** Characters Azure Table Storage disallows in key fields (PartitionKey/RowKey). */
export const AZURE_FORBIDDEN_KEY_CHARS = ['/', '\\', '#', '?'] as const

export interface MaintainerApplicationInput {
  name: string
  email: string
  githubUsername: string
  repository: string // full "owner/repo"
}

export type InsertResult = { ok: true } | { ok: false; duplicate: true }

/**
 * Derive slash-free Azure Table keys from a repository + github username.
 * Pure + synchronous so it unit-tests without an Azure client.
 */
export function deriveKeys(
  repository: string,
  githubUsername: string,
): { partitionKey: string; rowKey: string } {
  // Bare repo name = segment after the last '/'. If there's no slash it's already bare.
  const bareRepo = repository.includes('/')
    ? repository.slice(repository.lastIndexOf('/') + 1)
    : repository
  return {
    partitionKey: bareRepo,
    rowKey: githubUsername.trim().toLowerCase(),
  }
}

let _client: TableClient | null = null

function getClient(): TableClient {
  const connectionString = process.env.MAINTAINER_TABLE_CONNECTION_STRING
  if (!connectionString) {
    throw new Error(
      'Missing Azure Table connection string. Set MAINTAINER_TABLE_CONNECTION_STRING in .env.local',
    )
  }
  if (!_client) {
    _client = TableClient.fromConnectionString(connectionString, TABLE_NAME)
  }
  return _client
}

/**
 * Insert a maintainer application. Insert-only (`createEntity`) IS the atomic dedup:
 * a duplicate (repo + lowercased user) throws 409, which we map to a friendly
 * `{ ok:false, duplicate:true }` instead of a generic error (M2). No separate pre-read.
 */
export async function insertApplication(
  input: MaintainerApplicationInput,
): Promise<InsertResult> {
  const client = getClient()
  const { partitionKey, rowKey } = deriveKeys(input.repository, input.githubUsername)

  const entity = {
    partitionKey,
    rowKey,
    name: input.name,
    email: input.email,
    githubUsername: input.githubUsername, // original casing preserved for display
    repository: input.repository, // full owner/repo as a non-key property
    submittedAt: new Date().toISOString(),
  }

  try {
    await client.createEntity(entity)
    return { ok: true }
  } catch (err) {
    if (isConflict(err)) {
      return { ok: false, duplicate: true }
    }
    throw err
  }
}

function isConflict(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false
  const e = err as { statusCode?: number; code?: string; message?: string }
  return (
    e.statusCode === 409 ||
    e.code === 'EntityAlreadyExists' ||
    e.code === 'TableEntityAlreadyExists'
  )
}
