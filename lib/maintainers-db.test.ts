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

describe('insertApplication (M2 insert-or-409, missing-conn-string throw)', () => {
  const ORIGINAL = process.env.MAINTAINER_TABLE_CONNECTION_STRING

  beforeEach(() => {
    vi.resetModules()
    process.env.MAINTAINER_TABLE_CONNECTION_STRING =
      'DefaultEndpointsProtocol=https;AccountName=fake;AccountKey=Zm9v;EndpointSuffix=core.windows.net'
  })
  afterEach(() => {
    process.env.MAINTAINER_TABLE_CONNECTION_STRING = ORIGINAL
    vi.restoreAllMocks()
  })

  it('throws a clear error when the connection string is missing', async () => {
    delete process.env.MAINTAINER_TABLE_CONNECTION_STRING
    vi.resetModules()
    const mod = await import('./maintainers-db')
    await expect(
      mod.insertApplication({
        name: 'Ada',
        email: 'ada@microsoft.com',
        githubUsername: 'ada-lovelace',
        repository: 'stephschofield/v0-all-the-vibes-site',
      }),
    ).rejects.toThrow(/connection string/i)
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
