#!/usr/bin/env bash
# Deploy Azure Resources

# 1. Resource Group
az group create --name rg-billing-prod --location eastus

# 2. Cosmos DB (Serverless)
az cosmosdb create \
  --name cosmos-billing-prod \
  --resource-group rg-billing-prod \
  --kind MongoDB \
  --capabilities EnableServerless \
  --locations regionName=eastus failoverPriority=0 isZoneRedundant=False

# 3. Blob Storage (Cool Tier)
az storage account create \
  --name stgarchiveprod01 \
  --resource-group rg-billing-prod \
  --sku Standard_RAGRS \
  --kind StorageV2 \
  --location eastus \
  --access-tier Cool

az storage container create \
  --account-name stgarchiveprod01 \
  --name archives \
  --public-access off

# 4. Function App Plan & App
az functionapp plan create \
  --name plan-billing-prod \
  --resource-group rg-billing-prod \
  --location eastus \
  --sku Y1

az functionapp create \
  --name func-billing-api-prod \
  --storage-account stgarchiveprod01 \
  --plan plan-billing-prod \
  --resource-group rg-billing-prod \
  --runtime node \
  --functions-version 4
