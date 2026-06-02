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
