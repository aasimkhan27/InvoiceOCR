import {
  AzureKeyCredential,
  DocumentAnalysisClient,
  DocumentModelAdministrationClient
} from "@azure/ai-form-recognizer";
import { env } from "../config/env";
import { NormalizedInvoiceData } from "../types/invoice";

const nullField = <T>(value: T | null = null, confidence: number | null = null) => ({ value, confidence });

export class AzureDocumentIntelligenceService {
  private readonly analysisClient?: DocumentAnalysisClient;
  private readonly adminClient?: DocumentModelAdministrationClient;

  constructor() {
    if (env.AZURE_FORM_RECOGNIZER_ENDPOINT && env.AZURE_FORM_RECOGNIZER_KEY) {
      const credential = new AzureKeyCredential(env.AZURE_FORM_RECOGNIZER_KEY);
      this.analysisClient = new DocumentAnalysisClient(env.AZURE_FORM_RECOGNIZER_ENDPOINT, credential);
      this.adminClient = new DocumentModelAdministrationClient(env.AZURE_FORM_RECOGNIZER_ENDPOINT, credential);
    }
  }

  async analyzeInvoice(input: { fileBuffer?: Buffer; fileUrl?: string }): Promise<NormalizedInvoiceData> {
    if (!this.analysisClient) {
      throw new Error("Azure Document Intelligence is not configured");
    }

    const poller = input.fileUrl
      ? await this.analysisClient.beginAnalyzeDocumentFromUrl("prebuilt-invoice", input.fileUrl)
      : await this.analysisClient.beginAnalyzeDocument("prebuilt-invoice", input.fileBuffer as Buffer);

    const result = await poller.pollUntilDone();
    const doc = result.documents?.[0];
    const field = doc?.fields ?? {};

    const lineItems = (field.Items?.valueArray ?? []).map((item) => {
      const line = item.valueObject ?? {};
      return {
        description: line.Description?.value as string | undefined,
        quantity: line.Quantity?.value as number | undefined,
        unitPrice: line.UnitPrice?.value as number | undefined,
        amount: line.Amount?.value as number | undefined,
        confidence: item.confidence ?? null
      };
    });

    return {
      rawText: (result.pages ?? [])
        .flatMap((p) => p.lines ?? [])
        .map((l) => l.content)
        .join("\n"),
      vendorName: nullField(field.VendorName?.value as string | null, field.VendorName?.confidence ?? null),
      invoiceNumber: nullField(field.InvoiceId?.value as string | null, field.InvoiceId?.confidence ?? null),
      invoiceDate: nullField(field.InvoiceDate?.value ? new Date(field.InvoiceDate.value as Date).toISOString() : null, field.InvoiceDate?.confidence ?? null),
      dueDate: nullField(field.DueDate?.value ? new Date(field.DueDate.value as Date).toISOString() : null, field.DueDate?.confidence ?? null),
      subtotal: nullField((field.SubTotal?.value as number | null) ?? null, field.SubTotal?.confidence ?? null),
      tax: nullField((field.TotalTax?.value as number | null) ?? null, field.TotalTax?.confidence ?? null),
      total: nullField((field.InvoiceTotal?.value as number | null) ?? null, field.InvoiceTotal?.confidence ?? null),
      currency: nullField(field.InvoiceTotal?.valueCurrency?.currencyCode ?? null, field.InvoiceTotal?.confidence ?? null),
      poNumber: nullField(field.PurchaseOrder?.value as string | null, field.PurchaseOrder?.confidence ?? null),
      glAccount: nullField(null, null),
      lineItems
    };
  }

  async buildCustomModel(request: {
    modelId: string;
    containerUrl: string;
    description?: string;
    buildMode?: "template" | "neural";
  }): Promise<{ modelId: string; status: string; createdOn?: Date }> {
    if (!this.adminClient) {
      throw new Error("Azure Document Intelligence administration client is not configured");
    }

    const poller = await this.adminClient.beginBuildDocumentModel(
      request.buildMode ?? "neural",
      request.containerUrl,
      {
        description: request.description,
        modelId: request.modelId
      }
    );

    const model = await poller.pollUntilDone();
    return {
      modelId: model.modelId,
      status: model.docTypes ? "succeeded" : "unknown",
      createdOn: model.createdOn
    };
  }

  async listModels() {
    if (!this.adminClient) throw new Error("Azure Document Intelligence administration client is not configured");
    const models = [];
    for await (const model of this.adminClient.listDocumentModels()) {
      models.push(model);
    }
    return models;
  }

  async getModel(modelId: string) {
    if (!this.adminClient) throw new Error("Azure Document Intelligence administration client is not configured");
    return this.adminClient.getDocumentModel(modelId);
  }

  async analyzeWithModel(modelId: string, input: { fileBuffer?: Buffer; fileUrl?: string }) {
    if (!this.analysisClient) throw new Error("Azure Document Intelligence is not configured");
    const poller = input.fileUrl
      ? await this.analysisClient.beginAnalyzeDocumentFromUrl(modelId, input.fileUrl)
      : await this.analysisClient.beginAnalyzeDocument(modelId, input.fileBuffer as Buffer);
    return poller.pollUntilDone();
  }
}
