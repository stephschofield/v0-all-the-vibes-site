import { NextResponse } from 'next/server'
import { checkStorageHealth } from '@/lib/maintainers-db'

/**
 * TEMPORARY storage-path health probe for PATH B private-endpoint verification.
 * See infra/PATH-B-private-endpoint-runbook.md. REMOVE (or leave HEALTH_PROBE_TOKEN
 * unset) after the new VNet-injected environment is validated.
 *
 * Why this exists: under PATH B the maintainer table is reachable ONLY from inside the
 * ACA VNet, so an external operator host cannot verify the data path. This route runs the
 * SAME AAD-authenticated table round-trip the form uses, from INSIDE the app, and is
 * reachable over the app's public ingress (ingress north–south is independent of the
 * private east–west egress to storage).
 *
 * Contract:
 *  - Requires header `x-health-token` to equal env HEALTH_PROBE_TOKEN. If the env var is
 *    unset, the probe is DISABLED (404) so it can't be left hot in production.
 *  - On a valid token: always HTTP 200 with the StorageHealthResult JSON; pass/fail is the
 *    `ok` field and `class` buckets the failure. Never returns secrets.
 */
export const dynamic = 'force-dynamic' // never cache a health result
export const runtime = 'nodejs' // DefaultAzureCredential needs the Node runtime

export async function GET(request: Request): Promise<NextResponse> {
  const expected = process.env.HEALTH_PROBE_TOKEN
  // Disabled unless an operator sets the token — prevents a hot probe lingering in prod.
  if (!expected) {
    return NextResponse.json({ ok: false, class: 'disabled' }, { status: 404 })
  }
  if (request.headers.get('x-health-token') !== expected) {
    return NextResponse.json({ ok: false, class: 'forbidden' }, { status: 403 })
  }

  const result = await checkStorageHealth()
  // Always 200 so curl/jq can parse; the GREEN/RED signal is `result.ok`.
  return NextResponse.json(result, { status: 200 })
}
