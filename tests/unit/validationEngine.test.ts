import { InMemoryInvoiceRepository } from "../../src/repositories/InMemoryInvoiceRepository";
import { InvoiceValidationService } from "../../src/services/InvoiceValidationService";

describe("validation engine", () => {
  it("returns FAIL when mandatory fields are missing", async () => {
    const service = new InvoiceValidationService(new InMemoryInvoiceRepository());
    const result = await service.validate({
      rawText: "",
      vendorName: { value: null, confidence: 0.5 },
      invoiceNumber: { value: null, confidence: 0.5 },
      invoiceDate: { value: null, confidence: 0.5 },
      dueDate: { value: null, confidence: 0.5 },
      subtotal: { value: null, confidence: 0.5 },
      tax: { value: null, confidence: 0.5 },
      total: { value: null, confidence: 0.5 },
      currency: { value: null, confidence: 0.5 },
      poNumber: { value: null, confidence: 0.5 },
      glAccount: { value: null, confidence: 0.5 },
      lineItems: []
    });

    expect(result.status).toBe("FAIL");
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
