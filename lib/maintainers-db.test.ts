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
