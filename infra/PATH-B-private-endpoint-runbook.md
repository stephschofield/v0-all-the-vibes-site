# PATH B — Private Endpoint runbook (maintainer storage network block)

> **Status:** ready to execute (operator action). Resolves the production maintainer-form
> save failure **without** ever re-enabling public network access on the storage account.
> Researched + verified against Microsoft Learn (2026-06-05); all resource names below are
> the real live values for subscription `MCAPS-Hybrid-sschofield` / `ba7e3331…`.

## Go / No-Go summary

**GO — with one hard prerequisite that makes this a bigger change than "add a private endpoint".**

The storage-layer fix is trivial and safe: a Private Endpoint for the `table` sub-resource
bypasses the storage firewall entirely, so `publicNetworkAccess=Disabled`,
`allowSharedKeyAccess=false`, and `defaultAction=Allow` all stay exactly as they are. AAD
auth via the managed identity is unaffected.

**The catch (the single biggest risk):** a Private Endpoint is only reachable by clients whose
egress originates *inside the VNet hosting it*. The current Container Apps environment
`cae-allthevibes` has `vnetConfiguration=null` — it is **not** VNet-injected, and ACA network
type is **fixed at environment-creation time and immutable**. So the PE alone does **not** fix
the block: the app would still resolve the table host to the public (Disabled) endpoint and
fail. **PATH B therefore requires standing up a new VNet-injected environment and redeploying
the app into it.**

Because storage, the table, its data, and the `Storage Table Data Contributor` role assignment
are **never touched**, data loss is structurally impossible and rollback is cheap.

## Decision: side-by-side, NOT in-place

**Stand up a new env (`cae-allthevibes-vnet`) beside the live one, validate, then cut over.**
Never delete the live env to gain injection — in-place delete destroys the env *and its rollback
target* simultaneously, for a ~15–40 min hard outage. Side-by-side keeps the old FQDN serving as
a fallback until the new path is proven; the only blip is repointing references at cutover.

The unavoidable sharp edge: **the app FQDN changes** (new env = new `defaultDomain`). There are
no custom domains today, so blast radius is limited — but **audit every reference to the current
FQDN/env name before cutover** (see step 7).

## Prerequisites

```bash
source infra/azure-vars.sh   # SUBSCRIPTION_ID, RG, LOCATION, ACR, MAINTAINER_SA, RUNTIME_CID, etc.
az account set -s "$SUBSCRIPTION_ID"
# Confirm the containerapp CLI extension is current (workload-profiles flags):
az extension add -n containerapp --upgrade -y
```

Network design (no VNet exists in the RG today — create one):

| Resource | Value | Why |
|---|---|---|
| VNet | `vnet-allthevibes` `10.40.0.0/22` | new; avoid `100.100.0.0/17`, `169.254/16`, `172.30/16`, `172.31/16`, `192.0.2/24` |
| ACA infra subnet | `snet-aca-infra` `10.40.0.0/26` | **delegated** to `Microsoft.App/environments`; workload-profiles min `/27`, `/26` for headroom; dedicated to ACA |
| Private-endpoint subnet | `snet-privatelink` `10.40.1.0/28` | **non-delegated**; PE cannot share the ACA infra subnet |

## Exact command sequence

```bash
source infra/azure-vars.sh
SA_ID="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RG/providers/Microsoft.Storage/storageAccounts/$MAINTAINER_SA"
NEW_ENV="cae-allthevibes-vnet"
VNET="vnet-allthevibes"
TOKEN="$(openssl rand -hex 24)"   # capture ONCE — used for --secrets AND the verify curls below
echo "HEALTH_PROBE_TOKEN=$TOKEN"   # save it somewhere for the verification step

# 0. CAPTURE rollback blueprint (current app + env as code) BEFORE any change.
az containerapp show -g "$RG" -n "$ACA_APP" -o yaml > /tmp/ca-allthevibes.backup.yaml
az containerapp env show -g "$RG" -n "$ACA_ENV" -o yaml > /tmp/cae-allthevibes.backup.yaml

# 1. VNet + two subnets.
az network vnet create -g "$RG" -n "$VNET" -l "$LOCATION" \
  --address-prefixes 10.40.0.0/22 \
  --subnet-name snet-aca-infra --subnet-prefixes 10.40.0.0/26
az network vnet subnet create -g "$RG" --vnet-name "$VNET" \
  -n snet-privatelink --address-prefixes 10.40.1.0/28 \
  --disable-private-endpoint-network-policies true
# Delegate the ACA infra subnet (REQUIRED for workload profiles).
az network vnet subnet update -g "$RG" --vnet-name "$VNET" -n snet-aca-infra \
  --delegations Microsoft.App/environments
INFRA_SUBNET_ID="$(az network vnet subnet show -g "$RG" --vnet-name "$VNET" -n snet-aca-infra --query id -o tsv)"

# 2. Private Endpoint for the TABLE sub-resource (storage stays Disabled — no storage edits).
az network private-endpoint create -g "$RG" -l "$LOCATION" \
  --name pe-atvmaintainers-table \
  --connection-name pe-atvmaintainers-table-conn \
  --private-connection-resource-id "$SA_ID" \
  --group-id table \
  --vnet-name "$VNET" --subnet snet-privatelink

# 3. Private DNS zone + VNet link + zone-group (auto-maintains the A record).
az network private-dns zone create -g "$RG" -n privatelink.table.core.windows.net
az network private-dns link vnet create -g "$RG" \
  --zone-name privatelink.table.core.windows.net \
  --name link-atv-vnet --virtual-network "$VNET" --registration-enabled false
az network private-endpoint dns-zone-group create -g "$RG" \
  --endpoint-name pe-atvmaintainers-table \
  --name zg-table --private-dns-zone privatelink.table.core.windows.net --zone-name table

# 4. NEW VNet-injected workload-profiles env (creation-time injection; reuse the Log Analytics workspace).
LAW_ID="$(az monitor log-analytics workspace show -g "$RG" -n "$LAW" --query customerId -o tsv)"
LAW_KEY="$(az monitor log-analytics workspace get-shared-keys -g "$RG" -n "$LAW" --query primarySharedKey -o tsv)"
az containerapp env create -g "$RG" -n "$NEW_ENV" -l "$LOCATION" \
  --infrastructure-subnet-resource-id "$INFRA_SUBNET_ID" \
  --logs-workspace-id "$LAW_ID" --logs-workspace-key "$LAW_KEY"
# (workload profiles is the default; the app keeps PUBLIC ingress so the probe + form are
#  reachable from outside. Do NOT pass --internal-only unless you also front it with Front Door.)

# 5. Redeploy the app into the new env (same identity, same env vars, same image, ACR pull).
IMAGE="$(az containerapp show -g "$RG" -n "$ACA_APP" --query 'properties.template.containers[0].image' -o tsv)"
az containerapp create -g "$RG" -n "$ACA_APP-vnet" \
  --environment "$NEW_ENV" \
  --image "$IMAGE" \
  --user-assigned "$RUNTIME_RID" \
  --registry-server "$ACR_LOGIN" --registry-identity "$RUNTIME_RID" \
  --ingress external --target-port 3000 \
  --env-vars \
    "MAINTAINER_TABLE_ACCOUNT_URL=$MAINTAINER_TABLE_ACCOUNT_URL" \
    "AZURE_CLIENT_ID=$RUNTIME_CID" \
    "GITHUB_ORG=All-The-Vibes" \
    "HEALTH_PROBE_TOKEN=secretref:health-probe-token" \
  --secrets "health-probe-token=$TOKEN"
#   ^ confirm --target-port against the live app (revision ...0000008) before running.
#     Carry over any OTHER env vars the live app sets (e.g. MAINTAINER_NOTIFY_WEBHOOK) —
#     diff with: az containerapp show -g "$RG" -n "$ACA_APP" --query 'properties.template.containers[0].env'
```

## TDD verification (RED → GREEN)

The external harness `infra/verify-maintainer-storage.sh` **must stay RED forever** under PATH B —
the data plane is private, so an external host cannot reach it. *Green from outside = public leak =
regression.* The real GREEN signal comes from **inside the VNet**, via the in-app probe.

```bash
# RED (prove the probe can fail): deploy the probe to the CURRENT non-injected app first,
# and set HEALTH_PROBE_TOKEN on it (the CI deploy workflow does NOT set it, so set it here):
az containerapp update -g "$RG" -n "$ACA_APP" \
  --set-env-vars "HEALTH_PROBE_TOKEN=secretref:health-probe-token" \
  --secrets "health-probe-token=$TOKEN"
curl -fsS -H "x-health-token: $TOKEN" \
  https://ca-allthevibes.icygrass-85e1ec19.eastus2.azurecontainerapps.io/api/health/storage | jq .
#  expect {"ok":false, ...} with class in {authz-or-public-blocked, network-egress-blocked, dns}.
#  NOTE: because publicNetworkAccess=Disabled, the non-VNet app reaches the storage PUBLIC
#  front-end and is rejected there → class is most likely "authz-or-public-blocked" (status 403),
#  NOT a DNS/egress error. Any ok:false is a valid RED; the point is the probe CAN fail.

# GREEN (after steps 1–5), from inside the new env's VNet:
NEW_FQDN="$(az containerapp show -g "$RG" -n "$ACA_APP-vnet" --query properties.configuration.ingress.fqdn -o tsv)"
# a) DNS resolves to a PRIVATE IP (PE NIC), not a public Microsoft IP:
az containerapp exec -g "$RG" -n "$ACA_APP-vnet" \
  --command "/bin/sh -c 'getent hosts $MAINTAINER_SA.table.core.windows.net'"
# b) full-stack probe round-trips (DNS + egress + AAD token + RBAC + SDK):
curl -fsS -H "x-health-token: $TOKEN" "https://$NEW_FQDN/api/health/storage" | jq '.ok==true'
# c) acceptance: submit the real maintainer form on the new FQDN → 200, row persists.

# RE-SEAL: rerun the external harness — it MUST still be RED with a network/public-blocked class.
./infra/verify-maintainer-storage.sh   # exit 1 expected (this is correct under PATH B)
```

The probe route is `app/api/health/storage/route.ts` (token-guarded; reuses the form's own
`checkStorageHealth()` table path, writing + reading + deleting a throwaway row in the
`__healthcheck__` partition). **Remove it (or unset `HEALTH_PROBE_TOKEN`) after verification** —
see step 8. The route is disabled-by-default: with `HEALTH_PROBE_TOKEN` unset it returns 404.

## Cutover & cleanup

```bash
# 7. AUDIT references to the old FQDN/env BEFORE cutover (the FQDN changes!):
grep -rn "icygrass-85e1ec19\|cae-allthevibes\b" --exclude-dir=node_modules .   # this repo
#   + check any OTHER app/site env vars that hardcode the maintainer FQDN.
# Repoint the deploy workflow to the new env + app name:
#   .github/workflows/deploy-azure.yml  CONTAINERAPP_NAME → ca-allthevibes-vnet
#   (the workflow references the env only implicitly via the app; verify after cutover).

# 8. Remove the probe, redeploy, and re-assert invariants:
#   - delete app/api/health/storage/route.ts, push, let CI roll out
#   - storage: publicNetworkAccess=Disabled, allowSharedKeyAccess=false  (UNCHANGED)
#   - MAINTAINER_TABLE_ACCOUNT_URL unchanged

# 9. Decommission the OLD env ONLY after the new path is proven and references cut over:
az containerapp delete -g "$RG" -n "$ACA_APP"        # old app
az containerapp env delete -g "$RG" -n "$ACA_ENV"    # old env
```

## Rollback (zero data loss)

Storage/table/data/role are never modified, so rollback is purely compute + network:

- **New env fails before cutover:** the old env never went down — just don't cut over. Delete the
  half-built env, PE, DNS zone, subnets/VNet. Baseline restored; storage stayed `Disabled` throughout.
- **Regression after cutover:** repoint the deploy workflow + any FQDN reference back to the
  still-alive old env/FQDN, then investigate.

## What changed from raw research

The adversarial verification pass corrected one common trip-up that the initial framing had
backwards: **workload-profiles environments REQUIRE the `Microsoft.App/environments` subnet
delegation** (min `/27`). Leaving the subnet *undelegated* is the *legacy Consumption-only* rule,
not the workload-profiles rule — using it here would fail env creation. The commands above use the
correct delegated-subnet form.

## Permanent cost of PATH B

After cutover: Private Endpoint ~$7–8/mo + Private DNS zone ~$0.50/mo. VNet injection on the
Consumption profile adds no fixed env fee; the outbound storage PE does not trigger the ACA
Dedicated Plan management charge. Reuse the existing Log Analytics workspace to avoid duplicate
ingest cost.
