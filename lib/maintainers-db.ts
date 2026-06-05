import { TableClient } from '@azure/data-tables'
import { DefaultAzureCredential } from '@azure/identity'

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

/**
 * Build the Azure Table client. Two auth modes, in priority order:
 *
 *  1. **Azure AD (preferred)** — set MAINTAINER_TABLE_ACCOUNT_URL
 *     (e.g. https://atvmaintainersba7e3331.table.core.windows.net). Auth via
 *     DefaultAzureCredential: the Container App's user-assigned managed identity in
 *     prod, or your `az login` creds locally. This is the ONLY mode that works on
 *     storage accounts where Azure Policy forbids shared-key auth
 *     (allowSharedKeyAccess=false) — which is the case for this subscription.
 *
 *  2. **Connection string (fallback)** — set MAINTAINER_TABLE_CONNECTION_STRING.
 *     Shared-key auth; only usable on accounts that permit it. Kept for local
 *     emulator (Azurite) and non-policy-bound environments.
 *
 * With managed identity there is NO secret to store or rotate — it matches the
 * site's existing secretless OIDC/UAMI architecture (see infra/README.md).
 */
function getClient(): TableClient {
  if (_client) return _client

  const accountUrl = process.env.MAINTAINER_TABLE_ACCOUNT_URL
  if (accountUrl) {
    // AZURE_CLIENT_ID (the runtime UAMI's clientId) scopes DefaultAzureCredential to
    // the right user-assigned identity when several are attached to the Container App.
    const credential = new DefaultAzureCredential()
    _client = new TableClient(accountUrl, TABLE_NAME, credential)
    return _client
  }

  const connectionString = process.env.MAINTAINER_TABLE_CONNECTION_STRING
  if (connectionString) {
    _client = TableClient.fromConnectionString(connectionString, TABLE_NAME)
    return _client
  }

  throw new Error(
    'Missing Azure Table config. Set MAINTAINER_TABLE_ACCOUNT_URL (AAD/managed identity, ' +
      'preferred) or MAINTAINER_TABLE_CONNECTION_STRING (shared key) in .env.local',
  )
}

/**
 * Insert a maintainer application. Insert-only (`createEntity`) IS the atomic dedup:
 * a duplicate (repo + lowercased user) throws 409, which we map to a friendly
 * `{ ok:false, duplicate:true }` instead of a generic error (M2). No separate pre-read.
 *
 * Self-heals a missing table: if the first insert fails with `TableNotFound` (404) —
 * the table was never provisioned (it is created out-of-band, not by CI, and the
 * provisioning `az storage table create` cannot run from a host blocked by the
 * account's network rules) — create the table (idempotent) and retry the insert ONCE.
 * Any other error (403/500/network) propagates so the real failure surfaces and is not
 * masked by the self-heal.
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
    if (isTableNotFound(err)) {
      // Table missing → create it (idempotent: no-op if it already exists) and retry once.
      await client.createTable()
      try {
        await client.createEntity(entity)
        return { ok: true }
      } catch (retryErr) {
        if (isConflict(retryErr)) {
          return { ok: false, duplicate: true }
        }
        throw retryErr
      }
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

/**
 * True when an Azure Table error means "the table does not exist" — the signal to
 * self-provision it and retry. Azure returns 404 with code `TableNotFound`; we also
 * accept `ResourceNotFound` defensively (older/variant error shapes).
 */
function isTableNotFound(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false
  const e = err as { statusCode?: number; code?: string }
  return e.code === 'TableNotFound' || e.code === 'ResourceNotFound' || e.statusCode === 404
}
