const { CosmosClient } = require("@azure/cosmos");
const { BlobServiceClient } = require("@azure/storage-blob");

module.exports = async function (context, req) {
  const id = req.query.id || req.body?.id;
  const cutoff = Date.now() - 90*24*3600*1000;
  const cosmos = new CosmosClient(process.env.COSMOS_CONN);
  const container = cosmos.database("db").container("billing");

  try {
    const { resource } = await container.item(id, id).read();
    if (new Date(resource.timestamp).getTime() > cutoff) {
      return context.res = { status: 200, body: resource };
    }
  } catch (e) {
    console.warn("Cosmos read failed", e);
  }

  const blobSvc = BlobServiceClient.fromConnectionString(process.env.BLOB_CONN);
  const blob = blobSvc.getContainerClient("archives").getBlockBlobClient(`${id}.json`);
  const download = await blob.download();
  const data = await new Promise((res, rej) => {
    const chunks = [];
    download.readableStreamBody.on("data", c => chunks.push(c));
    download.readableStreamBody.on("end", () => res(Buffer.concat(chunks).toString()));
    download.readableStreamBody.on("error", rej);
  });
  return context.res = { status: 200, body: JSON.parse(data) };
};