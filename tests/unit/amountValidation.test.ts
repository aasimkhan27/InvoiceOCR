import { InMemoryInvoiceRepository } from "../../src/repositories/InMemoryInvoiceRepository";
import { InvoiceValidationService } from "../../src/services/InvoiceValidationService";

const baseInvoice = {
  rawText: "",
  vendorName: { value: "Acme", confidence: 0.99 },
  invoiceNumber: { value: "A-1", confidence: 0.99 },
  invoiceDate: { value: "2024-01-01", confidence: 0.99 },
  dueDate: { value: "2024-01-30", confidence: 0.99 },
  subtotal: { value: 100, confidence: 0.99 },
  tax: { value: 10, confidence: 0.99 },
  total: { value: 110, confidence: 0.99 },
  currency: { value: "USD", confidence: 0.99 },
  poNumber: { value: "PO1", confidence: 0.99 },
  glAccount: { value: "1000", confidence: 0.99 },
  lineItems: []
};

describe("amount validation", () => {
  it("passes when total matches subtotal + tax", async () => {
    const service = new InvoiceValidationService(new InMemoryInvoiceRepository());
    const result = await service.validate(baseInvoice);
    expect(result.errors).toHaveLength(0);
  });

  it("fails when total mismatch exceeds tolerance", async () => {
    const service = new InvoiceValidationService(new InMemoryInvoiceRepository());
    const result = await service.validate({ ...baseInvoice, total: { value: 200, confidence: 0.99 } });
    expect(result.errors.some((e) => e.includes("does not match"))).toBe(true);
  });
});
