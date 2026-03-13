import { BlobStorageService } from "./BlobStorageService";
import { AzureDocumentIntelligenceService } from "./AzureDocumentIntelligenceService";
import { InvoiceRepository } from "../types/repositories";
import { TrainingModelBuildRequest } from "../types/invoice";

export class TrainingService {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly blobStorageService: BlobStorageService,
    private readonly documentService: AzureDocumentIntelligenceService
  ) {}

  async getTrainingDataset() {
    return this.invoiceRepository.listReviewed();
  }

  async exportTrainingDataset() {
    const dataset = await this.invoiceRepository.listReviewed();
    const exportedFiles: string[] = [];

    for (const invoice of dataset) {
      const blobName = `labels/${invoice.id}.json`;
      const uri = await this.blobStorageService.uploadJson(blobName, {
        id: invoice.id,
        ocrData: invoice.ocrData,
        feedback: invoice.feedback,
        reviewed: invoice.reviewed
      });
      exportedFiles.push(uri);
    }

    const manifest = {
      generatedAt: new Date().toISOString(),
      records: dataset.length,
      exportedFiles
    };

    const manifestUrl = await this.blobStorageService.uploadJson("manifest.json", manifest);

    return {
      manifest: { ...manifest, manifestUrl },
      exportedFiles
    };
  }

  async buildModel(request: TrainingModelBuildRequest) {
    return this.documentService.buildCustomModel(request);
  }

  async listModels() {
    return this.documentService.listModels();
  }

  async getModel(modelId: string) {
    return this.documentService.getModel(modelId);
  }
}
