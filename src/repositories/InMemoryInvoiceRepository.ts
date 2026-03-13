import { InvoiceRepository } from "../types/repositories";
import { InvoiceFeedback, InvoiceRecord, NormalizedInvoiceData } from "../types/invoice";
import { normalizeInvoiceNumber } from "../utils/invoice";

export class InMemoryInvoiceRepository implements InvoiceRepository {
  private readonly store = new Map<string, InvoiceRecord>();

  async save(record: InvoiceRecord): Promise<InvoiceRecord> {
    this.store.set(record.id, record);
    return record;
  }

  async getById(id: string): Promise<InvoiceRecord | null> {
    return this.store.get(id) ?? null;
  }

  async list(): Promise<InvoiceRecord[]> {
    return [...this.store.values()];
  }

  async updateValidation(id: string, validation: InvoiceRecord["validation"]): Promise<InvoiceRecord | null> {
    const existing = this.store.get(id);
    if (!existing) return null;

    const updated: InvoiceRecord = {
      ...existing,
      validation,
      updatedAt: new Date().toISOString()
    };
    this.store.set(id, updated);
    return updated;
  }

  async applyFeedback(
    id: string,
    feedback: InvoiceFeedback,
    mergedData: NormalizedInvoiceData,
    validation: InvoiceRecord["validation"]
  ): Promise<InvoiceRecord | null> {
    const existing = this.store.get(id);
    if (!existing) return null;

    const updated: InvoiceRecord = {
      ...existing,
      feedback,
      ocrData: mergedData,
      reviewed: true,
      validation,
      updatedAt: new Date().toISOString()
    };
    this.store.set(id, updated);
    return updated;
  }

  async findDuplicates(vendorName: string, normalizedInvoiceNumber: string, total: number): Promise<{ exact: InvoiceRecord[]; fuzzy: InvoiceRecord[] }> {
    const all = [...this.store.values()];
    const exact = all.filter((record) => {
      const normalized = normalizeInvoiceNumber(record.ocrData.invoiceNumber.value ?? "");
      return (
        (record.ocrData.vendorName.value ?? "").toLowerCase() === vendorName.toLowerCase() &&
        normalized === normalizedInvoiceNumber &&
        (record.ocrData.total.value ?? 0) === total
      );
    });

    const fuzzy = all.filter((record) => {
      const normalized = normalizeInvoiceNumber(record.ocrData.invoiceNumber.value ?? "");
      return normalized === normalizedInvoiceNumber;
    });

    return { exact, fuzzy };
  }

  async listReviewed(): Promise<InvoiceRecord[]> {
    return [...this.store.values()].filter((record) => record.reviewed && !!record.feedback);
  }
}
