const { CosmosClient } = require("@azure/cosmos");
const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuid } = require("uuid");

module.exports = async function (context, timer) {
  const cutoffISO = new Date(Date.now() - 90*24*3600*1000).toISOString();
  const cosmos = new CosmosClient(process.env.COSMOS_CONN);
  const container = cosmos.database("db").container("billing");
  const blobSvc = BlobServiceClient.fromConnectionString(process.env.BLOB_CONN);
  const archives = blobSvc.getContainerClient("archives");
  const batchSize = 500;

  let { resources } = await container.items
    .query({
      query: "SELECT * FROM c WHERE c.timestamp <= @cutoff LIMIT @batch",
      parameters: [{ name: "@cutoff", value: cutoffISO }, { name: "@batch", value: batchSize }]
    })
    .fetchAll();

  while (resources.length) {
    const date = resources[0].timestamp.split("T")[0];
    const blobPath = `${date}/${uuid()}.json`;
    const payload = JSON.stringify(resources);

    await archives.getBlockBlobClient(blobPath).upload(payload, Buffer.byteLength(payload));
    for (const doc of resources) {
      if (process.env.ARCHIVE_ENABLED === "true") {
        await container.item(doc.id, doc.partitionKey).delete();
      }
    }

    ({ resources } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.timestamp <= @cutoff LIMIT @batch",
        parameters: [{ name: "@cutoff", value: cutoffISO }, { name: "@batch", value: batchSize }]
      })
      .fetchAll());
  }
};