# Azure deployment variables for All The Vibes site → Container Apps
export SUBSCRIPTION_ID="ba7e3331-8922-4ac6-a801-16d39aac84d4"   # MCAPS-Hybrid-sschofield
export TENANT_ID="16b3c013-d300-468d-ac64-7eda0820b6d3"          # Microsoft Non-Production
export LOCATION="eastus2"
export RG="rg-allthevibes-prod"
export ACR="atvsiteacrba7e3331"
export LAW="log-allthevibes"
export ACA_ENV="cae-allthevibes"
export ACA_APP="ca-allthevibes"
export UAMI_RUNTIME="id-allthevibes-runtime"
export UAMI_DEPLOY="id-allthevibes-deploy"
export GH_REPO="stephschofield/v0-all-the-vibes-site"
export IMAGE="allthevibes-site"

# --- populated during provisioning ---
export RUNTIME_RID="/subscriptions/ba7e3331-8922-4ac6-a801-16d39aac84d4/resourcegroups/rg-allthevibes-prod/providers/Microsoft.ManagedIdentity/userAssignedIdentities/id-allthevibes-runtime"
export ACR_LOGIN="atvsiteacrba7e3331.azurecr.io"
export DEPLOY_CID="8a4a411b-4f52-4638-896b-b4103ced3d76"
export DEPLOY_PID="92266ec6-b110-4fc3-b286-07431acc761c"
