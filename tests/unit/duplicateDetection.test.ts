import { InMemoryInvoiceRepository } from "../../src/repositories/InMemoryInvoiceRepository";

describe("duplicate detection", () => {
  it("detects exact and fuzzy duplicates", async () => {
    const repo = new InMemoryInvoiceRepository();
    await repo.save({
      id: "1",
      ocrData: {
        rawText: "",
        vendorName: { value: "Acme", confidence: 1 },
        invoiceNumber: { value: "INV-01", confidence: 1 },
        invoiceDate: { value: "2024-01-01", confidence: 1 },
        dueDate: { value: "2024-01-20", confidence: 1 },
        subtotal: { value: 90, confidence: 1 },
        tax: { value: 10, confidence: 1 },
        total: { value: 100, confidence: 1 },
        currency: { value: "USD", confidence: 1 },
        poNumber: { value: null, confidence: null },
        glAccount: { value: null, confidence: null },
        lineItems: []
      },
      reviewed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const result = await repo.findDuplicates("Acme", "INV01", 100);
    expect(result.exact).toHaveLength(1);
    expect(result.fuzzy).toHaveLength(1);
  });
});
