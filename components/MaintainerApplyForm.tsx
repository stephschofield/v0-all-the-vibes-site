'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { submitMaintainerApplication, type SubmitResult } from '@/lib/actions/maintainers'
import { loadOrgRepos } from '@/lib/actions/repos'
import type { Repo } from '@/lib/repos'

const initialState: SubmitResult = {}

function submitAction(_prev: SubmitResult, formData: FormData): Promise<SubmitResult> {
  return submitMaintainerApplication(formData)
}

const inputClasses =
  'w-full px-4 py-3 bg-[rgba(0,0,0,0.3)] border border-[var(--ide-border)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent text-base'
const labelClasses = 'block text-sm font-medium mb-2 text-[var(--text-secondary)]'
const helperClasses = 'mt-1 text-xs text-[var(--text-muted)]'

export function MaintainerApplyForm() {
  const [state, formAction, isPending] = useActionState(submitAction, initialState)
  const [repos, setRepos] = useState<Repo[] | null>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // H1: client-side repo load via server action (EditorPane can't server-fetch).
  useEffect(() => {
    let active = true
    loadOrgRepos()
      .then((r) => {
        if (active) setRepos(r)
      })
      .catch(() => {
        if (active) setRepos([])
      })
    return () => {
      active = false
    }
  }, [])

  // Move focus to the status (success/error) container on transition (a11y — Finding 8).
  useEffect(() => {
    if ((state.success || state.error) && statusRef.current) {
      statusRef.current.focus()
    }
    // Reset the form only on a true success (not on a duplicate — keep their input).
    if (state.success && formRef.current) {
      formRef.current.reset()
    }
  }, [state])

  const reposLoading = repos === null
  const reposEmpty = repos !== null && repos.length === 0

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
        Apply to maintain an All The Vibes repository
      </h2>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        Tell us who you are and which repo you&apos;d like to help maintain.
      </p>

      <form ref={formRef} action={formAction} className="space-y-5">
        {/* Honeypot — first, hidden from users, catches bots (L3) */}
        <div
          aria-hidden="true"
          tabIndex={-1}
          style={{ position: 'absolute', left: '-9999px', height: 0, overflow: 'hidden' }}
        >
          <label htmlFor="website">Website</label>
          <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        {/* 1. Name */}
        <div>
          <label htmlFor="name" className={labelClasses}>
            Your name
          </label>
          <input type="text" id="name" name="name" required className={inputClasses} placeholder="Ada Lovelace" />
        </div>

        {/* 2. Microsoft email */}
        <div>
          <label htmlFor="email" className={labelClasses}>
            Your @microsoft.com email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className={inputClasses}
            placeholder="ada@microsoft.com"
          />
        </div>

        {/* 3. GitHub username (disambiguated — Finding 1) */}
        <div>
          <label htmlFor="githubUsername" className={labelClasses}>
            Your github.com username
          </label>
          <input
            type="text"
            id="githubUsername"
            name="githubUsername"
            required
            className={inputClasses}
            placeholder="ada-lovelace"
            aria-describedby="githubUsername-help"
          />
          <p id="githubUsername-help" className={helperClasses}>
            The handle you use on github.com (e.g. ada-lovelace). NOT your Microsoft-managed GitHub
            Enterprise account or your @microsoft.com email.
          </p>
        </div>

        {/* 4. Repository */}
        <div>
          <label htmlFor="repository" className={labelClasses}>
            Repository to maintain
          </label>
          {reposEmpty ? (
            <p className="text-sm text-[var(--text-muted)]">
              No repositories are open for maintainer applications right now. Check back later.
            </p>
          ) : (
            <select
              id="repository"
              name="repository"
              required
              defaultValue=""
              disabled={reposLoading}
              className={inputClasses}
            >
              <option value="" disabled>
                {reposLoading ? 'Loading repositories…' : 'Select a repository…'}
              </option>
              {repos?.map((r) => (
                <option key={r.fullName} value={r.fullName}>
                  {r.fullName}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Status region — focus moves here; screen readers announce it */}
        {state.error && (
          <div
            ref={statusRef}
            tabIndex={-1}
            role="alert"
            aria-live="assertive"
            className="p-3 rounded-md text-sm bg-red-900/30 border border-red-500/50 text-red-300 outline-none"
          >
            {state.error}
          </div>
        )}
        {state.success && (
          <div
            ref={statusRef}
            tabIndex={-1}
            role="status"
            aria-live="polite"
            className="p-3 rounded-md text-sm bg-green-900/30 border border-green-500/50 text-green-300 outline-none"
          >
            Application submitted! We&apos;ll review your request and reach out if you&apos;re selected.
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || reposLoading || reposEmpty}
          className="w-full px-4 py-3 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/80 disabled:bg-[var(--accent-blue)]/50 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors text-base"
        >
          {isPending ? 'Submitting application…' : 'Apply to Maintain'}
        </button>
      </form>
    </div>
  )
}
