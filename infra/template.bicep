@description('Cosmos account')
resource cosmos 'Microsoft.DocumentDB/databaseAccounts@2021-04-15' = {
  name: 'cosmos-billing-prod'
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    capabilities: [{ name: 'EnableServerless' }]
    locations: [{ locationName: resourceGroup().location }]
    backupPolicy: {
      type: 'Periodic'
      periodicModeProperties: {
        backupIntervalInMinutes: 240
        backupRetentionIntervalInHours: 720
      }
    }
  }
}

@description('Blob storage account')
resource stg 'Microsoft.Storage/storageAccounts@2021-04-01' = {
  name: 'stgarchiveprod01'
  sku: { name: 'Standard_RAGRS' }
  kind: 'StorageV2'
  properties: { accessTier: 'Cool' }
}
