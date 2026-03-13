import { normalizeInvoiceNumber } from "../../src/utils/invoice";

describe("normalizeInvoiceNumber", () => {
  it("removes symbols and uppercases", () => {
    expect(normalizeInvoiceNumber(" inv-001/2024 ")).toBe("INV0012024");
  });
});
