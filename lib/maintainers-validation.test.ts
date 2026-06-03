import { describe, it, expect } from 'vitest'
import {
  isMicrosoftEmail,
  isAllowedRepo,
  MaintainerSchema,
} from './maintainers-validation'

describe('isMicrosoftEmail (2A — exact last-@ domain parse)', () => {
  it('accepts a microsoft.com corporate address', () => {
    expect(isMicrosoftEmail('ada@microsoft.com')).toBe(true)
  })
  it('is case-insensitive on the domain', () => {
    expect(isMicrosoftEmail('ada@MICROSOFT.COM')).toBe(true)
  })
  it('rejects a non-Microsoft domain', () => {
    expect(isMicrosoftEmail('ada@gmail.com')).toBe(false)
  })
  it('★CRITICAL: rejects the substring-spoof x@microsoft.com.evil.com', () => {
    expect(isMicrosoftEmail('ada@microsoft.com.evil.com')).toBe(false)
  })
  it('★CRITICAL: rejects a prefix-spoof microsoft.com@evil.com', () => {
    expect(isMicrosoftEmail('microsoft.com@evil.com')).toBe(false)
  })
  it('rejects a lookalike subdomain spoof evilmicrosoft.com', () => {
    expect(isMicrosoftEmail('ada@evilmicrosoft.com')).toBe(false)
  })
  it('rejects garbage / no-@ input', () => {
    expect(isMicrosoftEmail('not-an-email')).toBe(false)
    expect(isMicrosoftEmail('')).toBe(false)
    expect(isMicrosoftEmail('a@b@microsoft.com')).toBe(false)
  })
})

describe('isAllowedRepo (1A — repo allow-list re-validation)', () => {
  const allowed = ['stephschofield/v0-all-the-vibes-site', 'stephschofield/other']
  it('accepts a repo in the org list', () => {
    expect(isAllowedRepo('stephschofield/other', allowed)).toBe(true)
  })
  it('rejects a tampered repo not in the org list', () => {
    expect(isAllowedRepo('attacker/evil', allowed)).toBe(false)
  })
  it('rejects empty / missing repo', () => {
    expect(isAllowedRepo('', allowed)).toBe(false)
  })
})

describe('MaintainerSchema (M4 githubUsername charset/length + name/email)', () => {
  const valid = {
    name: 'Ada Lovelace',
    email: 'ada@microsoft.com',
    githubUsername: 'ada-lovelace',
    repository: 'stephschofield/v0-all-the-vibes-site',
  }

  it('accepts a valid application', () => {
    expect(MaintainerSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects a missing name', () => {
    expect(MaintainerSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
  })
  it('rejects a name over 100 chars', () => {
    expect(MaintainerSchema.safeParse({ ...valid, name: 'a'.repeat(101) }).success).toBe(false)
  })

  it('M4: rejects a githubUsername over 39 chars', () => {
    expect(MaintainerSchema.safeParse({ ...valid, githubUsername: 'a'.repeat(40) }).success).toBe(false)
  })
  it('M4: rejects an underscore (not a valid GitHub char)', () => {
    expect(MaintainerSchema.safeParse({ ...valid, githubUsername: 'ada_lovelace' }).success).toBe(false)
  })
  it('M4: rejects leading/trailing hyphen', () => {
    expect(MaintainerSchema.safeParse({ ...valid, githubUsername: '-ada' }).success).toBe(false)
    expect(MaintainerSchema.safeParse({ ...valid, githubUsername: 'ada-' }).success).toBe(false)
  })
  it('M4: accepts a normal hyphenated handle and single-char handle', () => {
    expect(MaintainerSchema.safeParse({ ...valid, githubUsername: 'ada-lovelace' }).success).toBe(true)
    expect(MaintainerSchema.safeParse({ ...valid, githubUsername: 'a' }).success).toBe(true)
  })
  it('M4: rejects a slash in the username (defense-in-depth vs Azure key chars)', () => {
    expect(MaintainerSchema.safeParse({ ...valid, githubUsername: 'a/b' }).success).toBe(false)
  })

  it('rejects a non-Microsoft email via the schema refine', () => {
    expect(MaintainerSchema.safeParse({ ...valid, email: 'ada@gmail.com' }).success).toBe(false)
  })
  it('★ rejects the substring-spoof email via the schema refine', () => {
    expect(MaintainerSchema.safeParse({ ...valid, email: 'ada@microsoft.com.evil.com' }).success).toBe(false)
  })
})
