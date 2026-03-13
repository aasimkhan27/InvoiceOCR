import request from "supertest";
import { buildApp } from "../../src/app";
import { AzureDocumentIntelligenceService } from "../../src/services/AzureDocumentIntelligenceService";
import { InMemoryInvoiceRepository } from "../../src/repositories/InMemoryInvoiceRepository";

class MockDocumentService extends AzureDocumentIntelligenceService {
  async analyzeInvoice() {
    return {
      rawText: "invoice",
      vendorName: { value: "Acme", confidence: 0.99 },
      invoiceNumber: { value: "INV-100", confidence: 0.99 },
      invoiceDate: { value: "2024-01-01", confidence: 0.99 },
      dueDate: { value: "2024-01-15", confidence: 0.99 },
      subtotal: { value: 100, confidence: 0.99 },
      tax: { value: 10, confidence: 0.99 },
      total: { value: 110, confidence: 0.99 },
      currency: { value: "USD", confidence: 0.99 },
      poNumber: { value: "PO-1", confidence: 0.99 },
      glAccount: { value: "4000", confidence: 0.99 },
      lineItems: []
    };
  }
}

describe("invoice routes integration", () => {
  const repo = new InMemoryInvoiceRepository();
  const app = buildApp({ documentService: new MockDocumentService(), invoiceRepository: repo });

  it("POST /api/invoices/analyze", async () => {
    const response = await request(app)
      .post("/api/invoices/analyze")
      .attach("file", Buffer.from("dummy"), { filename: "invoice.pdf", contentType: "application/pdf" });

    expect(response.status).toBe(201);
    expect(response.body.ocrData.invoiceNumber.value).toBe("INV-100");
  });

  it("POST /api/invoices/validate", async () => {
    const analyze = await request(app)
      .post("/api/invoices/analyze")
      .attach("file", Buffer.from("dummy"), { filename: "invoice.pdf", contentType: "application/pdf" });

    const response = await request(app).post("/api/invoices/validate").send({ invoiceId: analyze.body.id });
    expect(response.status).toBe(200);
    expect(response.body.status).toBeDefined();
  });

  it("POST /api/invoices/:id/feedback", async () => {
    const analyze = await request(app)
      .post("/api/invoices/analyze")
      .attach("file", Buffer.from("dummy"), { filename: "invoice.pdf", contentType: "application/pdf" });

    const response = await request(app)
      .post(`/api/invoices/${analyze.body.id}/feedback`)
      .send({
        correctedBy: "accountant",
        correctedData: {
          invoiceNumber: { value: "INV-101", confidence: 1 }
        },
        notes: "corrected"
      });

    expect(response.status).toBe(200);
    expect(response.body.reviewed).toBe(true);
    expect(response.body.feedback.correctedBy).toBe("accountant");
  });
});
