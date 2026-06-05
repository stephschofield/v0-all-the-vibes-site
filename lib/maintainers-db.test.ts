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

  it('TableNotFound (404) on insert → creates the table (idempotent) and retries the insert, returning ok', async () => {
    const notFound: Error & { statusCode?: number; code?: string } = new Error('table not found')
    notFound.statusCode = 404
    notFound.code = 'TableNotFound'
    const createEntity = vi
      .fn()
      .mockRejectedValueOnce(notFound) // first insert: table is missing
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
    const notFound: Error & { statusCode?: number; code?: string } = new Error('no table')
    notFound.statusCode = 404
    notFound.code = 'TableNotFound'
    const conflict: Error & { statusCode?: number } = new Error('exists')
    conflict.statusCode = 409
    const createEntity = vi
      .fn()
      .mockRejectedValueOnce(notFound)
      .mockRejectedValueOnce(conflict)
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
    const notFound: Error & { statusCode?: number; code?: string } = new Error('no table')
    notFound.statusCode = 404
    notFound.code = 'TableNotFound'
    const forbidden: Error & { statusCode?: number } = new Error('forbidden creating table')
    forbidden.statusCode = 403
    const createEntity = vi.fn().mockRejectedValue(notFound)
    const createTable = vi.fn().mockRejectedValue(forbidden)
    vi.doMock('@azure/data-tables', () => ({
      TableClient: { fromConnectionString: () => ({ createEntity, createTable }) },
    }))
    vi.resetModules()
    const mod = await import('./maintainers-db')
    await expect(mod.insertApplication(APP)).rejects.toThrow(/forbidden creating table/)
  })

  it('does NOT attempt createTable for a plain 500 (only TableNotFound triggers the self-heal)', async () => {
    const err: Error & { statusCode?: number } = new Error('boom 500')
    err.statusCode = 500
    const createEntity = vi.fn().mockRejectedValue(err)
    const createTable = vi.fn().mockResolvedValue(undefined)
    vi.doMock('@azure/data-tables', () => ({
      TableClient: { fromConnectionString: () => ({ createEntity, createTable }) },
    }))
    vi.resetModules()
    const mod = await import('./maintainers-db')
    await expect(mod.insertApplication(APP)).rejects.toThrow(/boom 500/)
    expect(createTable).not.toHaveBeenCalled()
    expect(createEntity).toHaveBeenCalledOnce()
  })
})
