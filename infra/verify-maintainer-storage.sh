#!/usr/bin/env bash
#
# verify-maintainer-storage.sh — end-to-end check that the maintainer-application
# table write path is OPEN (network reachable) and AAD-only auth still works.
#
# This is the executable "test" for the storage network-block fix (PR #21 follow-up):
#   - RED  (before operator fix): every data-plane step fails with a network-rule block.
#   - GREEN (after PATH A in infra/README.md): all steps pass, AND shared-key stays OFF.
#
# It uses AAD (--auth-mode login) exclusively — never shared key — matching the app's
# DefaultAzureCredential path. Safe to re-run: it writes a clearly-marked probe row to a
# throwaway partition and deletes it; it never touches real application rows.
#
# Usage:  ./infra/verify-maintainer-storage.sh
# Exit:   0 = GREEN (path open, AAD works, shared-key disabled)
#         1 = RED   (path blocked or a control regressed)  — message says which
#
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/azure-vars.sh"

PROBE_TABLE="${MAINTAINER_TABLE}"
PROBE_PK="__healthcheck__"
PROBE_RK="probe-$(date +%s)-$$"

pass() { printf '  \033[32m✓\033[0m %s\n' "$1"; }
fail() { printf '  \033[31m✗\033[0m %s\n' "$1"; }
# Strip the pkg_resources deprecation warning some az builds print, and any CR/LF
# (the Windows az build under WSL emits CRLF, which breaks string comparisons).
strip() { grep -v "pkg_resources" 2>/dev/null | tr -d '\r\n' || true; }

echo "── Maintainer storage path verification ──────────────────────────────"
echo "account=$MAINTAINER_SA  rg=$RG  table=$MAINTAINER_TABLE  (AAD-only)"
echo

errors=0

# 1) CONTROL: shared-key auth MUST stay disabled (the load-bearing security control).
#    PATH A only re-opens the network; it must NOT re-enable shared key.
shared_key="$(az storage account show -n "$MAINTAINER_SA" -g "$RG" \
  --query allowSharedKeyAccess -o tsv 2>/dev/null | strip)"
if [[ "$shared_key" == "false" ]]; then
  pass "allowSharedKeyAccess=false (AAD-only enforced)"
else
  fail "allowSharedKeyAccess=$shared_key — EXPECTED false. Shared key must stay OFF."
  errors=$((errors + 1))
fi

# 2) NETWORK/DATA PLANE: list tables via AAD. This is the call that 404s/blocks today.
if az storage table list --account-name "$MAINTAINER_SA" --auth-mode login -o none 2>/dev/null; then
  pass "table list via AAD succeeded (network path open)"
else
  fail "table list via AAD failed — network path still blocked (run PATH A in infra/README.md)"
  errors=$((errors + 1))
fi

# 3) WRITE: insert a probe entity (mirrors the app's createEntity). Auto-creates the
#    table to match the app's self-heal; tolerated if it already exists.
az storage table create -n "$PROBE_TABLE" --account-name "$MAINTAINER_SA" \
  --auth-mode login -o none 2>/dev/null || true
if az storage entity insert --account-name "$MAINTAINER_SA" --auth-mode login \
  -t "$PROBE_TABLE" \
  -e PartitionKey="$PROBE_PK" RowKey="$PROBE_RK" probe=true \
  -o none 2>/dev/null; then
  pass "probe entity write succeeded"
else
  fail "probe entity write failed — AAD RBAC or network issue"
  errors=$((errors + 1))
fi

# 4) READ-BACK + CLEANUP: confirm the row landed, then delete it.
if az storage entity show --account-name "$MAINTAINER_SA" --auth-mode login \
  -t "$PROBE_TABLE" --partition-key "$PROBE_PK" --row-key "$PROBE_RK" \
  -o none 2>/dev/null; then
  pass "probe entity read-back succeeded"
  if az storage entity delete --account-name "$MAINTAINER_SA" --auth-mode login \
    -t "$PROBE_TABLE" --partition-key "$PROBE_PK" --row-key "$PROBE_RK" \
    --if-match '*' -o none 2>/dev/null; then
    pass "probe entity cleaned up"
  else
    fail "probe cleanup failed (orphan row left in $PROBE_PK — harmless, delete manually)"
  fi
else
  fail "probe entity read-back failed"
  errors=$((errors + 1))
fi

echo
if [[ "$errors" -eq 0 ]]; then
  echo "── GREEN: maintainer storage path is OPEN and AAD-only. ──────────────"
  exit 0
else
  echo "── RED: $errors check(s) failed. See infra/README.md 'Known production failure'. ──"
  exit 1
fi
