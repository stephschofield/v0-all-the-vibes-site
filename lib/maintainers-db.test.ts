import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  deriveKeys,
  AZURE_FORBIDDEN_KEY_CHARS,
} from './maintainers-db'

describe('deriveKeys (C1 PartitionKey slash / H3 case-fold)', () => {
  it('C1: PartitionKey is the BARE repo name (no owner, no slash)', () => {
    const { partitionKey } = deriveKeys('stephschofield/v0-all-the-vibes-site', 'ada-lovelace')
    expect(partitionKey).toBe('v0-all-the-vibes-site')
    expect(partitionKey).not.toContain('/')
  })

  it('C1: derived keys contain NONE of the Azure-forbidden chars (/ \\ # ?) or control chars', () => {
    const { partitionKey, rowKey } = deriveKeys('owner/some-repo', 'Some-User')
    for (const ch of AZURE_FORBIDDEN_KEY_CHARS) {
      expect(partitionKey).not.toContain(ch)
      expect(rowKey).not.toContain(ch)
    }
    // no control chars
    expect(/[\x00-\x1f\x7f-\x9f]/.test(partitionKey)).toBe(false)
    expect(/[\x00-\x1f\x7f-\x9f]/.test(rowKey)).toBe(false)
  })

  it('H3: RowKey is the lowercased, trimmed github username', () => {
    expect(deriveKeys('o/r', 'Ada-Lovelace').rowKey).toBe('ada-lovelace')
    expect(deriveKeys('o/r', '  ADA-LOVELACE  ').rowKey).toBe('ada-lovelace')
  })

  it('H3: Ada-Lovelace and ada-lovelace dedupe to the SAME RowKey', () => {
    expect(deriveKeys('o/r', 'Ada-Lovelace').rowKey).toBe(deriveKeys('o/r', 'ada-lovelace').rowKey)
  })

  it('handles a repository value that is already a bare name (no slash)', () => {
    expect(deriveKeys('v0-all-the-vibes-site', 'user').partitionKey).toBe('v0-all-the-vibes-site')
  })
})

describe('insertApplication (M2 insert-or-409, missing-config throw)', () => {
  const ORIGINAL_CONN = process.env.MAINTAINER_TABLE_CONNECTION_STRING
  const ORIGINAL_URL = process.env.MAINTAINER_TABLE_ACCOUNT_URL

  beforeEach(() => {
    vi.resetModules()
    delete process.env.MAINTAINER_TABLE_ACCOUNT_URL
    process.env.MAINTAINER_TABLE_CONNECTION_STRING =
      'DefaultEndpointsProtocol=https;AccountName=fake;AccountKey=Zm9v;EndpointSuffix=core.windows.net'
  })
  afterEach(() => {
    process.env.MAINTAINER_TABLE_CONNECTION_STRING = ORIGINAL_CONN
    process.env.MAINTAINER_TABLE_ACCOUNT_URL = ORIGINAL_URL
    vi.restoreAllMocks()
  })

  it('throws a clear error when NO auth config is present', async () => {
    delete process.env.MAINTAINER_TABLE_CONNECTION_STRING
    delete process.env.MAINTAINER_TABLE_ACCOUNT_URL
    vi.resetModules()
    const mod = await import('./maintainers-db')
    await expect(
      mod.insertApplication({
        name: 'Ada',
        email: 'ada@microsoft.com',
        githubUsername: 'ada-lovelace',
        repository: 'stephschofield/v0-all-the-vibes-site',
      }),
    ).rejects.toThrow(/Missing Azure Table config/i)
  })

  it('uses Azure AD (DefaultAzureCredential) when MAINTAINER_TABLE_ACCOUNT_URL is set', async () => {
    delete process.env.MAINTAINER_TABLE_CONNECTION_STRING
    process.env.MAINTAINER_TABLE_ACCOUNT_URL =
      'https://atvmaintainersba7e3331.table.core.windows.net'
    const createEntity = vi.fn().mockResolvedValue({})
    // Regular function (not arrow) so `new TableClient(...)` has a [[Construct]] slot.
    // Declare the ctor params so mock.calls is typed as a non-empty tuple.
    const TableClientCtor = vi.fn(function (
      this: Record<string, unknown>,
      _url: string,
      _table: string,
      _credential: unknown,
    ) {
      this.createEntity = createEntity
    })
    const credentialCtor = vi.fn()
    vi.doMock('@azure/data-tables', () => ({ TableClient: TableClientCtor }))
    vi.doMock('@azure/identity', () => ({
      DefaultAzureCredential: credentialCtor,
    }))
    vi.resetModules()
    const mod = await import('./maintainers-db')
    const res = await mod.insertApplication({
      name: 'Ada Lovelace',
      email: 'ada@microsoft.com',
      githubUsername: 'Ada-Lovelace',
      repository: 'stephschofield/v0-all-the-vibes-site',
    })
    expect(res).toEqual({ ok: true })
    // Constructed the AAD client (url, table, credential) — NOT fromConnectionString.
    expect(TableClientCtor).toHaveBeenCalledOnce()
    expect(credentialCtor).toHaveBeenCalledOnce()
    expect(TableClientCtor.mock.calls[0][0]).toBe(
      'https://atvmaintainersba7e3331.table.core.windows.net',
    )
    expect(createEntity).toHaveBeenCalledOnce()
    expect(createEntity.mock.calls[0][0].partitionKey).toBe('v0-all-the-vibes-site')
  })

  it('inserts an entity with the corrected keys (PartitionKey bare, RowKey lowercased)', async () => {
    const createEntity = vi.fn().mockResolvedValue({})
    vi.doMock('@azure/data-tables', () => ({
      TableClient: { fromConnectionString: () => ({ createEntity }) },
    }))
    vi.resetModules()
    const mod = await import('./maintainers-db')
    const res = await mod.insertApplication({
      name: 'Ada Lovelace',
      email: 'ada@microsoft.com',
      githubUsername: 'Ada-Lovelace',
      repository: 'stephschofield/v0-all-the-vibes-site',
    })
    expect(res).toEqual({ ok: true })
    expect(createEntity).toHaveBeenCalledOnce()
    const entity = createEntity.mock.calls[0][0]
    expect(entity.partitionKey).toBe('v0-all-the-vibes-site')
    expect(entity.rowKey).toBe('ada-lovelace')
    // full owner/repo preserved as a non-key property
    expect(entity.repository).toBe('stephschofield/v0-all-the-vibes-site')
    expect(entity.githubUsername).toBe('Ada-Lovelace') // original casing kept for display
    expect(entity.email).toBe('ada@microsoft.com')
    expect(typeof entity.submittedAt).toBe('string')
  })

  it('M2: a 409 (entity already exists) maps to { ok:false, duplicate:true }, NOT a throw', async () => {
    const err: Error & { statusCode?: number } = new Error('exists')
    err.statusCode = 409
    const createEntity = vi.fn().mockRejectedValue(err)
    vi.doMock('@azure/data-tables', () => ({
      TableClient: { fromConnectionString: () => ({ createEntity }) },
    }))
    vi.resetModules()
    const mod = await import('./maintainers-db')
    const res = await mod.insertApplication({
      name: 'Ada',
      email: 'ada@microsoft.com',
      githubUsername: 'ada-lovelace',
      repository: 'stephschofield/v0-all-the-vibes-site',
    })
    expect(res).toEqual({ ok: false, duplicate: true })
  })

  it('re-throws non-409 Azure errors so the caller can show a generic error', async () => {
    const err: Error & { statusCode?: number } = new Error('boom')
    err.statusCode = 500
    const createEntity = vi.fn().mockRejectedValue(err)
    vi.doMock('@azure/data-tables', () => ({
      TableClient: { fromConnectionString: () => ({ createEntity }) },
    }))
    vi.resetModules()
    const mod = await import('./maintainers-db')
    await expect(
      mod.insertApplication({
        name: 'Ada',
        email: 'ada@microsoft.com',
        githubUsername: 'ada-lovelace',
        repository: 'stephschofield/v0-all-the-vibes-site',
      }),
    ).rejects.toThrow(/boom/)
  })
})

describe('insertApplication — self-heal a missing table (H2/DR)', () => {
  const ORIGINAL_CONN = process.env.MAINTAINER_TABLE_CONNECTION_STRING
  const ORIGINAL_URL = process.env.MAINTAINER_TABLE_ACCOUNT_URL

  beforeEach(() => {
    vi.resetModules()
    delete process.env.MAINTAINER_TABLE_ACCOUNT_URL
    process.env.MAINTAINER_TABLE_CONNECTION_STRING =
      'DefaultEndpointsProtocol=https;AccountName=fake;AccountKey=Zm9v;EndpointSuffix=core.windows.net'
  })
  afterEach(() => {
    process.env.MAINTAINER_TABLE_CONNECTION_STRING = ORIGINAL_CONN
    process.env.MAINTAINER_TABLE_ACCOUNT_URL = ORIGINAL_URL
    vi.restoreAllMocks()
  })

  const APP = {
    name: 'Ada',
    email: 'ada@microsoft.com',
    githubUsername: 'ada-lovelace',
    repository: 'stephschofield/v0-all-the-vibes-site',
  }

  /**
   * Build an error shaped like the REAL @azure/data-tables v13.3.2 RestError that
   * Azure Table Storage emits in PRODUCTION.
   *
   * Against live Azure Table Storage the service error code is surfaced NESTED at
   * `response.parsedBody.odataError.code` — this is the exact field the SDK's own
   * `handleTableAlreadyExists` reads (see @azure/data-tables errorHelpers.js). The
   * top-level `.code` is `undefined` for this shape: @azure/core-client's
   * deserializationPolicy sets `error.code = internalError.code` where
   * `internalError` deserializes (via the `TableServiceError` mapper) to
   * `{ odataError: { code } }`, so there is no top-level `.code`.
   *
   * The old tests set BOTH `statusCode` AND a top-level `code` on every error — but the
   * production Azure service path never populates the top-level `code`, so those tests
   * gave false confidence and could not catch a regression around the nested contract.
   * (A top-level `code` CAN appear against the local Azurite emulator / variant shapes;
   * `azureErrorCode()` still honors it, and the dedicated "Azurite-style" test below
   * locks that fallback branch.) `odataCode` omitted ⇒ a 404 with no parseable code.
   */
  function makeRestError(
    statusCode: number,
    odataCode?: string,
  ): Error & {
    name: string
    statusCode: number
    response: { parsedBody: { odataError?: { code: string; message: { value: string } } } }
  } {
    const err = new Error(odataCode ?? `HTTP ${statusCode}`) as Error & {
      name: string
      statusCode: number
      response: { parsedBody: { odataError?: { code: string; message: { value: string } } } }
    }
    err.name = 'RestError'
    err.statusCode = statusCode
    // NOTE: top-level `err.code` is intentionally NOT set — faithful to production.
    err.response = {
      parsedBody: odataCode
        ? { odataError: { code: odataCode, message: { value: odataCode } } }
        : {},
    }
    return err
  }

  it('TableNotFound (nested odataError.code, 404) on insert → creates the table (idempotent) and retries, returning ok', async () => {
    const createEntity = vi
      .fn()
      .mockRejectedValueOnce(makeRestError(404, 'TableNotFound')) // first insert: table is missing
      .mockResolvedValueOnce({}) // retry insert after createTable: succeeds
    const createTable = vi.fn().mockResolvedValue(undefined)
    vi.doMock('@azure/data-tables', () => ({
      TableClient: { fromConnectionString: () => ({ createEntity, createTable }) },
    }))
    vi.resetModules()
    const mod = await import('./maintainers-db')
    const res = await mod.insertApplication(APP)
    expect(res).toEqual({ ok: true })
    expect(createTable).toHaveBeenCalledOnce()
    expect(createEntity).toHaveBeenCalledTimes(2)
  })

  it('after auto-creating the table, a 409 on the retried insert maps to duplicate (not a throw)', async () => {
    const createEntity = vi
      .fn()
      .mockRejectedValueOnce(makeRestError(404, 'TableNotFound'))
      .mockRejectedValueOnce(makeRestError(409, 'EntityAlreadyExists'))
    const createTable = vi.fn().mockResolvedValue(undefined)
    vi.doMock('@azure/data-tables', () => ({
      TableClient: { fromConnectionString: () => ({ createEntity, createTable }) },
    }))
    vi.resetModules()
    const mod = await import('./maintainers-db')
    const res = await mod.insertApplication(APP)
    expect(res).toEqual({ ok: false, duplicate: true })
    expect(createTable).toHaveBeenCalledOnce()
  })

  it('re-throws when createTable() itself fails after a TableNotFound (e.g. 403 — different root cause surfaces, not swallowed)', async () => {
    const createEntity = vi.fn().mockRejectedValue(makeRestError(404, 'TableNotFound'))
    const createTable = vi.fn().mockRejectedValue(makeRestError(403, 'AuthorizationFailure'))
    vi.doMock('@azure/data-tables', () => ({
      TableClient: { fromConnectionString: () => ({ createEntity, createTable }) },
    }))
    vi.resetModules()
    const mod = await import('./maintainers-db')
    await expect(mod.insertApplication(APP)).rejects.toThrow(/AuthorizationFailure/)
  })

  it('retries the insert EXACTLY once — a second TableNotFound after createTable() propagates (no retry loop)', async () => {
    // Guards the bounded-retry contract: if createTable() "succeeds" but the table is
    // still missing on the retried insert, the 2nd 404 must bubble out, not loop forever.
    const createEntity = vi.fn().mockRejectedValue(makeRestError(404, 'TableNotFound')) // ALWAYS 404
    const createTable = vi.fn().mockResolvedValue(undefined)
    vi.doMock('@azure/data-tables', () => ({
      TableClient: { fromConnectionString: () => ({ createEntity, createTable }) },
    }))
    vi.resetModules()
    const mod = await import('./maintainers-db')
    await expect(mod.insertApplication(APP)).rejects.toThrow(/TableNotFound/)
    expect(createTable).toHaveBeenCalledOnce() // self-heal attempted once
    expect(createEntity).toHaveBeenCalledTimes(2) // original + exactly one retry, then stop
  })

  it('does NOT attempt createTable for a plain 500 (only a missing table triggers the self-heal)', async () => {
    const createEntity = vi.fn().mockRejectedValue(makeRestError(500, 'InternalError'))
    const createTable = vi.fn().mockResolvedValue(undefined)
    vi.doMock('@azure/data-tables', () => ({
      TableClient: { fromConnectionString: () => ({ createEntity, createTable }) },
    }))
    vi.resetModules()
    const mod = await import('./maintainers-db')
    await expect(mod.insertApplication(APP)).rejects.toThrow(/InternalError/)
    expect(createTable).not.toHaveBeenCalled()
    expect(createEntity).toHaveBeenCalledOnce()
  })

  it('does NOT self-heal on a 404 whose code is NOT TableNotFound (e.g. a stray ResourceNotFound) — no misfire', async () => {
    // A 404 from an unrelated cause must NOT trigger a state-changing createTable()
    // and must surface the original error rather than a follow-up createTable/retry error.
    const createEntity = vi.fn().mockRejectedValue(makeRestError(404, 'ResourceNotFound'))
    const createTable = vi.fn().mockResolvedValue(undefined)
    vi.doMock('@azure/data-tables', () => ({
      TableClient: { fromConnectionString: () => ({ createEntity, createTable }) },
    }))
    vi.resetModules()
    const mod = await import('./maintainers-db')
    await expect(mod.insertApplication(APP)).rejects.toThrow(/ResourceNotFound/)
    expect(createTable).not.toHaveBeenCalled()
    expect(createEntity).toHaveBeenCalledOnce()
  })

  it('does NOT self-heal on a bare 404 with no parseable error code — requires an explicit TableNotFound', async () => {
    const createEntity = vi.fn().mockRejectedValue(makeRestError(404)) // no odataError.code
    const createTable = vi.fn().mockResolvedValue(undefined)
    vi.doMock('@azure/data-tables', () => ({
      TableClient: { fromConnectionString: () => ({ createEntity, createTable }) },
    }))
    vi.resetModules()
    const mod = await import('./maintainers-db')
    await expect(mod.insertApplication(APP)).rejects.toThrow(/HTTP 404/)
    expect(createTable).not.toHaveBeenCalled()
    expect(createEntity).toHaveBeenCalledOnce()
  })

  it('self-heals when ONLY the nested odataError.code is present (no top-level code) — locks the real prod contract', async () => {
    // Proves the feature works on the exact shape production emits: statusCode + nested
    // odataError.code, with NO top-level .code. If someone "simplifies" detection back to
    // a top-level `err.code` check, this test goes red.
    const createEntity = vi
      .fn()
      .mockRejectedValueOnce(makeRestError(404, 'TableNotFound'))
      .mockResolvedValueOnce({})
    const createTable = vi.fn().mockResolvedValue(undefined)
    vi.doMock('@azure/data-tables', () => ({
      TableClient: { fromConnectionString: () => ({ createEntity, createTable }) },
    }))
    vi.resetModules()
    const mod = await import('./maintainers-db')
    const res = await mod.insertApplication(APP)
    expect(res).toEqual({ ok: true })
    expect(createTable).toHaveBeenCalledOnce()
  })

  it('Azurite-style TableNotFound (top-level code, NO nested odataError) → self-heals — locks the emulator fallback branch', async () => {
    // The local Azurite emulator / variant shapes expose the code at the TOP LEVEL
    // (err.code) with no response.parsedBody.odataError. azureErrorCode() honors that
    // fallback; this test pins it so a future "nested-only" refactor can't silently
    // break local-emulator self-heal while the prod tests stay green.
    const notFound = new Error('TableNotFound') as Error & { statusCode?: number; code?: string }
    notFound.statusCode = 404
    notFound.code = 'TableNotFound' // top-level only — no .response
    const createEntity = vi.fn().mockRejectedValueOnce(notFound).mockResolvedValueOnce({})
    const createTable = vi.fn().mockResolvedValue(undefined)
    vi.doMock('@azure/data-tables', () => ({
      TableClient: { fromConnectionString: () => ({ createEntity, createTable }) },
    }))
    vi.resetModules()
    const mod = await import('./maintainers-db')
    const res = await mod.insertApplication(APP)
    expect(res).toEqual({ ok: true })
    expect(createTable).toHaveBeenCalledOnce()
    expect(createEntity).toHaveBeenCalledTimes(2)
  })
})

describe('checkStorageHealth — in-VNet probe for the PATH B private-endpoint path', () => {
  const ORIGINAL_CONN = process.env.MAINTAINER_TABLE_CONNECTION_STRING
  const ORIGINAL_URL = process.env.MAINTAINER_TABLE_ACCOUNT_URL

  beforeEach(() => {
    vi.resetModules()
    delete process.env.MAINTAINER_TABLE_ACCOUNT_URL
    process.env.MAINTAINER_TABLE_CONNECTION_STRING =
      'DefaultEndpointsProtocol=https;AccountName=fake;AccountKey=Zm9v;EndpointSuffix=core.windows.net'
  })
  afterEach(() => {
    process.env.MAINTAINER_TABLE_CONNECTION_STRING = ORIGINAL_CONN
    process.env.MAINTAINER_TABLE_ACCOUNT_URL = ORIGINAL_URL
    vi.restoreAllMocks()
  })

  function mockClient(impl: Record<string, unknown>) {
    vi.doMock('@azure/data-tables', () => ({
      TableClient: { fromConnectionString: () => impl },
    }))
  }

  it('GREEN: a full write→read→delete round-trip returns { ok:true, stage:"roundtrip" } with latencyMs', async () => {
    const createTable = vi.fn().mockResolvedValue(undefined)
    const createEntity = vi.fn().mockResolvedValue({})
    const getEntity = vi.fn().mockResolvedValue({ partitionKey: '__healthcheck__', rowKey: 'x' })
    const deleteEntity = vi.fn().mockResolvedValue({})
    mockClient({ createTable, createEntity, getEntity, deleteEntity })
    vi.resetModules()
    const mod = await import('./maintainers-db')
    const res = await mod.checkStorageHealth()
    expect(res.ok).toBe(true)
    expect(res.stage).toBe('roundtrip')
    expect(typeof res.latencyMs).toBe('number')
    // The probe must clean up after itself — no orphaned health rows.
    expect(createEntity).toHaveBeenCalledOnce()
    expect(getEntity).toHaveBeenCalledOnce()
    expect(deleteEntity).toHaveBeenCalledOnce()
    // Probe row lands in the throwaway health partition, never a real application key.
    expect(createEntity.mock.calls[0][0].partitionKey).toBe('__healthcheck__')
  })

  it('never throws — a DNS failure (ENOTFOUND) is classified, not propagated', async () => {
    const dnsErr = Object.assign(new Error('getaddrinfo ENOTFOUND'), { code: 'ENOTFOUND' })
    mockClient({ createEntity: vi.fn().mockRejectedValue(dnsErr), createTable: vi.fn() })
    vi.resetModules()
    const mod = await import('./maintainers-db')
    const res = await mod.checkStorageHealth()
    if (res.ok) throw new Error('expected probe to fail')
    expect(res.class).toBe('dns')
  })

  it('classifies a blocked network egress (ETIMEDOUT) as network-egress-blocked', async () => {
    const netErr = Object.assign(new Error('connect ETIMEDOUT'), { code: 'ETIMEDOUT' })
    mockClient({ createEntity: vi.fn().mockRejectedValue(netErr), createTable: vi.fn() })
    vi.resetModules()
    const mod = await import('./maintainers-db')
    const res = await mod.checkStorageHealth()
    if (res.ok) throw new Error('expected probe to fail')
    expect(res.class).toBe('network-egress-blocked')
  })

  it('classifies a 403 (public access disabled / authz) as authz-or-public-blocked', async () => {
    const forbidden = Object.assign(new Error('public access disabled'), { statusCode: 403 })
    mockClient({ createTable: vi.fn().mockResolvedValue(undefined), createEntity: vi.fn().mockRejectedValue(forbidden) })
    vi.resetModules()
    const mod = await import('./maintainers-db')
    const res = await mod.checkStorageHealth()
    if (res.ok) throw new Error('expected probe to fail')
    expect(res.class).toBe('authz-or-public-blocked')
    expect(res.status).toBe(403)
  })

  it('classifies a 401 (no/!valid token) as auth-token', async () => {
    const unauth = Object.assign(new Error('no token'), { statusCode: 401 })
    mockClient({ createTable: vi.fn().mockResolvedValue(undefined), createEntity: vi.fn().mockRejectedValue(unauth) })
    vi.resetModules()
    const mod = await import('./maintainers-db')
    const res = await mod.checkStorageHealth()
    if (res.ok) throw new Error('expected probe to fail')
    expect(res.class).toBe('auth-token')
  })

  it('does not leak secrets — the result never contains the account URL, connection string, or token', async () => {
    process.env.MAINTAINER_TABLE_ACCOUNT_URL = 'https://atvmaintainersba7e3331.table.core.windows.net'
    delete process.env.MAINTAINER_TABLE_CONNECTION_STRING
    const forbidden = Object.assign(new Error('AuthorizationFailure'), { statusCode: 403 })
    // AAD path: TableClient ctor + DefaultAzureCredential
    const TableClientCtor = vi.fn(function (this: Record<string, unknown>) {
      this.createTable = vi.fn().mockResolvedValue(undefined)
      this.createEntity = vi.fn().mockRejectedValue(forbidden)
    })
    vi.doMock('@azure/data-tables', () => ({ TableClient: TableClientCtor }))
    vi.doMock('@azure/identity', () => ({ DefaultAzureCredential: vi.fn() }))
    vi.resetModules()
    const mod = await import('./maintainers-db')
    const res = await mod.checkStorageHealth()
    const serialized = JSON.stringify(res)
    expect(serialized).not.toContain('atvmaintainersba7e3331')
    expect(serialized).not.toContain('AccountKey')
    // The RestError.message must not leak through either — only the coarse class/status do.
    expect(serialized).not.toContain('AuthorizationFailure')
    expect(res.ok).toBe(false)
  })

  it('classifies a post-self-heal table-missing (404 TableNotFound that persists) as table-missing', async () => {
    // createTable "succeeds" but the retried insert still 404s — the self-heal can't help,
    // so the probe reports table-missing rather than masking it.
    const notFound = new Error('TableNotFound') as Error & { statusCode?: number; code?: string }
    notFound.statusCode = 404
    notFound.code = 'TableNotFound'
    mockClient({
      createEntity: vi.fn().mockRejectedValue(notFound), // always 404
      createTable: vi.fn().mockResolvedValue(undefined),
    })
    vi.resetModules()
    const mod = await import('./maintainers-db')
    const res = await mod.checkStorageHealth()
    if (res.ok) throw new Error('expected probe to fail')
    expect(res.class).toBe('table-missing')
  })

  it('classifies an unrecognized failure (plain 500) as unknown', async () => {
    const boom = Object.assign(new Error('internal'), { statusCode: 500 })
    mockClient({ createEntity: vi.fn().mockRejectedValue(boom), createTable: vi.fn() })
    vi.resetModules()
    const mod = await import('./maintainers-db')
    const res = await mod.checkStorageHealth()
    if (res.ok) throw new Error('expected probe to fail')
    expect(res.class).toBe('unknown')
    expect(res.status).toBe(500)
  })

  it("exercises the probe's OWN self-heal (first insert 404 → createTable → retry → GREEN)", async () => {
    const notFound = new Error('TableNotFound') as Error & { statusCode?: number; code?: string }
    notFound.statusCode = 404
    notFound.code = 'TableNotFound'
    const createEntity = vi.fn().mockRejectedValueOnce(notFound).mockResolvedValueOnce({})
    const createTable = vi.fn().mockResolvedValue(undefined)
    const getEntity = vi.fn().mockResolvedValue({ partitionKey: '__healthcheck__', rowKey: 'x' })
    const deleteEntity = vi.fn().mockResolvedValue({})
    mockClient({ createEntity, createTable, getEntity, deleteEntity })
    vi.resetModules()
    const mod = await import('./maintainers-db')
    const res = await mod.checkStorageHealth()
    expect(res.ok).toBe(true)
    expect(createTable).toHaveBeenCalledOnce()
    expect(createEntity).toHaveBeenCalledTimes(2)
  })

  it('cleans up the probe row even when read-back fails mid-round-trip (no orphan)', async () => {
    // write succeeds, getEntity throws — the finally block must still delete the row.
    const readErr = Object.assign(new Error('read blew up'), { statusCode: 500 })
    const createEntity = vi.fn().mockResolvedValue({})
    const getEntity = vi.fn().mockRejectedValue(readErr)
    const deleteEntity = vi.fn().mockResolvedValue({})
    mockClient({ createEntity, createTable: vi.fn(), getEntity, deleteEntity })
    vi.resetModules()
    const mod = await import('./maintainers-db')
    const res = await mod.checkStorageHealth()
    if (res.ok) throw new Error('expected probe to fail')
    expect(res.class).toBe('unknown')
    // best-effort cleanup ran despite the read failure → no orphan probe row
    expect(deleteEntity).toHaveBeenCalledOnce()
    expect(deleteEntity.mock.calls[0]).toEqual(['__healthcheck__', expect.stringMatching(/^probe-/)])
  })
})

