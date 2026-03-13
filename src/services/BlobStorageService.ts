import { BlobServiceClient } from "@azure/storage-blob";
import { env } from "../config/env";

export class BlobStorageService {
  private readonly client?: BlobServiceClient;

  constructor() {
    if (env.AZURE_BLOB_CONNECTION_STRING) {
      this.client = BlobServiceClient.fromConnectionString(env.AZURE_BLOB_CONNECTION_STRING);
    }
  }

  async uploadJson(blobName: string, payload: unknown): Promise<string> {
    if (!this.client) throw new Error("Azure Blob Storage is not configured");
    const containerClient = this.client.getContainerClient(env.AZURE_BLOB_CONTAINER_NAME);
    await containerClient.createIfNotExists();
    const blob = containerClient.getBlockBlobClient(blobName);
    const body = JSON.stringify(payload, null, 2);
    await blob.upload(body, Buffer.byteLength(body), {
      blobHTTPHeaders: { blobContentType: "application/json" }
    });
    return blob.url;
  }
}
