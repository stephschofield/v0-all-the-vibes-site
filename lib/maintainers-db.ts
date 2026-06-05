import { randomUUID } from 'node:crypto'
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
 * Self-heals a missing table: if the first insert fails with `TableNotFound` (a 404 whose
 * service error code — nested at `response.parsedBody.odataError.code` — is `TableNotFound`)
 * the table was never provisioned (it is created out-of-band, not by CI, and the
 * provisioning `az storage table create` cannot run from a host blocked by the
 * account's network rules) — create the table (idempotent) and retry the insert ONCE.
 * Any other error (an unrelated 404, 403/500/network) propagates so the real failure
 * surfaces and is not masked by the self-heal.
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

/** Result of a storage-path health probe. Never contains secrets (no URL, key, or token). */
export type StorageHealthFailureClass =
  | 'dns'
  | 'network-egress-blocked'
  | 'authz-or-public-blocked'
  | 'auth-token'
  | 'table-missing'
  | 'unknown'

export type StorageHealthResult =
  | { ok: true; stage: 'roundtrip'; latencyMs: number }
  | {
      ok: false
      stage: 'roundtrip'
      class: StorageHealthFailureClass
      status?: number
      latencyMs: number
    }

/** The throwaway partition health-probe rows live in — never a real application key. */
const HEALTH_PARTITION = '__healthcheck__'

/**
 * Bucket a thrown Azure/SDK error into a coarse failure class for the health probe.
 * The point is to tell WHICH wall a request hit — DNS vs network egress vs auth vs
 * public-access-block — without surfacing any error detail that could contain secrets.
 */
function classifyStorageError(err: unknown): StorageHealthFailureClass {
  const code = azureErrorCode(err)
  const status = azureStatusCode(err)
  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') return 'dns'
  if (code === 'ETIMEDOUT' || code === 'ECONNREFUSED' || code === 'ECONNRESET') {
    return 'network-egress-blocked'
  }
  if (status === 403) return 'authz-or-public-blocked'
  if (status === 401) return 'auth-token'
  if (isTableNotFound(err)) return 'table-missing'
  return 'unknown'
}

/**
 * In-VNet health probe for the maintainer storage data path. Performs the SAME
 * AAD-authenticated table round-trip the form uses (insert with self-heal → read →
 * delete) against a throwaway `__healthcheck__` partition, then cleans up.
 *
 * Built for the PATH B private-endpoint verification (see
 * infra/PATH-B-private-endpoint-runbook.md): under PATH B the storage table is reachable
 * only from INSIDE the ACA VNet, so an external host cannot verify it — but a route that
 * calls this from the deployed app can. It NEVER throws and NEVER returns secrets (no
 * account URL, connection string, or token): only `ok`, a coarse failure `class`, an
 * optional HTTP `status`, and a latency number. The calling route is responsible for
 * auth-gating and shaping the HTTP response.
 */
export async function checkStorageHealth(): Promise<StorageHealthResult> {
  const startedAt = Date.now()
  // randomUUID (not Date.now()) so two probes in the same millisecond can't collide
  // into a spurious 409 that would be misreported as a failure.
  const rowKey = `probe-${randomUUID()}`
  const entity = { partitionKey: HEALTH_PARTITION, rowKey, probe: true }
  let wrote = false

  try {
    const client = getClient()
    // Mirror the app's self-heal so a missing table is provisioned, not a false failure.
    try {
      await client.createEntity(entity)
    } catch (err) {
      if (isTableNotFound(err)) {
        await client.createTable()
        await client.createEntity(entity)
      } else {
        throw err
      }
    }
    wrote = true
    await client.getEntity(HEALTH_PARTITION, rowKey)
    await client.deleteEntity(HEALTH_PARTITION, rowKey)
    wrote = false // deleted on the happy path; nothing for finally to clean up
    return { ok: true, stage: 'roundtrip', latencyMs: Date.now() - startedAt }
  } catch (err) {
    const status = azureStatusCode(err)
    return {
      ok: false,
      stage: 'roundtrip',
      class: classifyStorageError(err),
      ...(status === undefined ? {} : { status }),
      latencyMs: Date.now() - startedAt,
    }
  } finally {
    // Best-effort cleanup: if the row was written but a later step (read/delete) threw,
    // don't leave an orphan probe row behind. Swallow errors — cleanup must never change
    // the probe's verdict or throw out of the function.
    if (wrote) {
      try {
        await getClient().deleteEntity(HEALTH_PARTITION, rowKey)
      } catch {
        // orphan row in the throwaway __healthcheck__ partition; harmless
      }
    }
  }
}

function isConflict(err: unknown): boolean {
  if (azureStatusCode(err) === 409) return true
  const code = azureErrorCode(err)
  return code === 'EntityAlreadyExists' || code === 'TableEntityAlreadyExists'
}

/**
 * Read an Azure Table Storage error code from wherever the SDK actually puts it.
 *
 * `@azure/data-tables` surfaces the service error code NESTED at
 * `error.response.parsedBody.odataError.code` — this is the exact field the SDK's own
 * `handleTableAlreadyExists` reads. The top-level `error.code` is `undefined` for this
 * shape: `@azure/core-client`'s deserializationPolicy sets `error.code = internalError.code`
 * where `internalError` is the deserialized `TableServiceError` (`{ odataError: { code } }`),
 * which has no top-level `code`. We still check a top-level `code` first to stay compatible
 * with the local Azurite emulator and any future/variant error shapes that expose it there.
 */
function azureErrorCode(err: unknown): string | undefined {
  if (typeof err !== 'object' || err === null) return undefined
  const e = err as {
    code?: string
    response?: { parsedBody?: { odataError?: { code?: string } } }
  }
  return e.code ?? e.response?.parsedBody?.odataError?.code
}

function azureStatusCode(err: unknown): number | undefined {
  if (typeof err !== 'object' || err === null) return undefined
  return (err as { statusCode?: number }).statusCode
}

/**
 * True when an Azure Table error means "the table does not exist" — the signal to
 * self-provision it and retry. The real prod error is a 404 whose code (nested under
 * `response.parsedBody.odataError.code`) is `TableNotFound`. We require that explicit
 * code rather than blindly self-healing on ANY 404: an unrelated 404 must NOT trigger a
 * state-changing `createTable()` + retry that would then mask the original error.
 * `ResourceNotFound` is intentionally NOT treated as a missing table — it signals a
 * missing entity/resource on other calls, not a missing table.
 */
function isTableNotFound(err: unknown): boolean {
  return azureStatusCode(err) === 404 && azureErrorCode(err) === 'TableNotFound'
}
