# Azure Infrastructure — All The Vibes Site

The site runs on **Azure Container Apps** in the `MCAPS-Hybrid-sschofield` subscription
(tenant: Microsoft Non-Production). CI/CD is GitHub Actions with OIDC federated
credentials — no stored secrets.

## Live URL

https://ca-allthevibes.icygrass-85e1ec19.eastus2.azurecontainerapps.io

## Resources (region: East US 2)

| Resource | Name | Purpose |
|----------|------|---------|
| Resource Group | `rg-allthevibes-prod` | Container for all resources |
| Container Registry | `atvsiteacrba7e3331` | Hosts the Docker image (Basic SKU) |
| Log Analytics | `log-allthevibes` | Container App logs/metrics |
| Container Apps Env | `cae-allthevibes` | Runtime environment |
| Container App | `ca-allthevibes` | The app (external ingress :3000, 1–3 replicas, 0.5 vCPU / 1 GiB) |
| Managed Identity | `id-allthevibes-runtime` | ACA pulls image from ACR (AcrPull) |
| Managed Identity | `id-allthevibes-deploy` | GitHub Actions OIDC (AcrPush + Contributor on RG) |

## Identities & roles

- **Runtime identity** (`id-allthevibes-runtime`): `AcrPull` on the registry. The
  Container App uses it to pull images — no registry admin creds enabled.
- **Deploy identity** (`id-allthevibes-deploy`): `AcrPush` on the registry +
  `Contributor` on the resource group. Federated to GitHub via OIDC:
  - `repo:stephschofield/v0-all-the-vibes-site:ref:refs/heads/main`
  - `repo:stephschofield/v0-all-the-vibes-site:pull_request`

## CI/CD

`.github/workflows/deploy-azure.yml` runs on push to `main`:
1. OIDC login to Azure (no secrets)
2. `az acr build` builds the image server-side from the `Dockerfile`
3. `az containerapp update` rolls out the new image (tagged with the commit SHA)

Trigger manually with the **workflow_dispatch** button in the Actions tab.

## Manual operations

```bash
# Authenticate to the right subscription
az login --tenant 16b3c013-d300-468d-ac64-7eda0820b6d3
az account set --subscription ba7e3331-8922-4ac6-a801-16d39aac84d4

# Rebuild + redeploy by hand
az acr build -r atvsiteacrba7e3331 -t allthevibes-site:latest .
az containerapp update -g rg-allthevibes-prod -n ca-allthevibes \
  --image atvsiteacrba7e3331.azurecr.io/allthevibes-site:latest

# Tail logs
az containerapp logs show -g rg-allthevibes-prod -n ca-allthevibes --follow

# Show current revision / status
az containerapp show -g rg-allthevibes-prod -n ca-allthevibes \
  --query "{fqdn:properties.configuration.ingress.fqdn, state:properties.provisioningState}" -o table
```

`azure-vars.sh` holds the resource names/IDs for scripted operations (no secrets).

## Maintainer form storage (Azure Table)

The **maintainers.md** form persists applications to **Azure Table Storage**.

| Resource | Name | Notes |
|----------|------|-------|
| Storage account | `atvmaintainersba7e3331` | StorageV2, Standard_LRS, eastus2, TLS1_2 |
| Table | `MaintainerApplications` | PartitionKey = bare repo, RowKey = lowercased gh user |

### Auth: managed identity, NOT a connection string

This subscription enforces an Azure Policy that **forbids shared-key auth**
(`allowSharedKeyAccess` is forced to `false`), so connection strings do not work.
The app authenticates with Azure AD via `DefaultAzureCredential`:

- **In prod:** the Container App's runtime identity `id-allthevibes-runtime`
  (`AZURE_CLIENT_ID` env var selects it) holds **Storage Table Data Contributor**
  on the account. No secret is stored or rotated.
- **Locally:** your `az login` credentials are used — you also need the role
  (granted below) on the account.

The app reads `MAINTAINER_TABLE_ACCOUNT_URL`
(`https://atvmaintainersba7e3331.table.core.windows.net`). A
`MAINTAINER_TABLE_CONNECTION_STRING` fallback exists only for the local Azurite
emulator.

### Provisioning runbook (already applied; here for rebuild/DR)

```bash
source infra/azure-vars.sh
# 1. Storage account (shared-key auth will be policy-disabled automatically)
az storage account create -n "$MAINTAINER_SA" -g "$RG" --location "$LOCATION" \
  --sku Standard_LRS --kind StorageV2 --min-tls-version TLS1_2 \
  --allow-blob-public-access false

SA_ID=$(az storage account show -n "$MAINTAINER_SA" -g "$RG" --query id -o tsv)

# 2. Grant the runtime identity + yourself the data-plane role
az role assignment create --assignee-object-id "$RUNTIME_PID" \
  --assignee-principal-type ServicePrincipal \
  --role "Storage Table Data Contributor" --scope "$SA_ID"
az role assignment create --assignee-object-id "$(az ad signed-in-user show --query id -o tsv)" \
  --assignee-principal-type User \
  --role "Storage Table Data Contributor" --scope "$SA_ID"

# 3. Create the table over AAD auth (NOT --auth-mode key)
az storage table create -n "$MAINTAINER_TABLE" --account-name "$MAINTAINER_SA" --auth-mode login

# 4. Wire the Container App (the deploy workflow also sets these on every rollout)
az containerapp update -g "$RG" -n "$ACA_APP" --set-env-vars \
  "MAINTAINER_TABLE_ACCOUNT_URL=$MAINTAINER_TABLE_ACCOUNT_URL" \
  "AZURE_CLIENT_ID=$RUNTIME_CID" "GITHUB_ORG=All-The-Vibes"
```

## Decommissioning Vercel

This deployment replaces Vercel. To stop Vercel auto-deploying `main`:
1. In the Vercel dashboard → project **v0-all-the-vibes-site** → Settings → Git →
   **Disconnect** the GitHub repository (or delete the Vercel project).
2. Remove the Vercel GitHub App from the repo if no other projects use it.

## Future: custom domain

To map a custom domain (e.g. `allthevibes.dev`):
```bash
az containerapp hostname add -g rg-allthevibes-prod -n ca-allthevibes --hostname <domain>
az containerapp hostname bind -g rg-allthevibes-prod -n ca-allthevibes \
  --hostname <domain> --environment cae-allthevibes --validation-method CNAME
```
Add the ACA-managed certificate after DNS validation.
