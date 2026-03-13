import { InvoiceFeedback, InvoiceRecord, NormalizedInvoiceData } from "./invoice";

export interface InvoiceRepository {
  save(record: InvoiceRecord): Promise<InvoiceRecord>;
  getById(id: string): Promise<InvoiceRecord | null>;
  list(): Promise<InvoiceRecord[]>;
  updateValidation(id: string, validation: InvoiceRecord["validation"]): Promise<InvoiceRecord | null>;
  applyFeedback(id: string, feedback: InvoiceFeedback, mergedData: NormalizedInvoiceData, validation: InvoiceRecord["validation"]): Promise<InvoiceRecord | null>;
  findDuplicates(vendorName: string, normalizedInvoiceNumber: string, total: number): Promise<{ exact: InvoiceRecord[]; fuzzy: InvoiceRecord[] }>;
  listReviewed(): Promise<InvoiceRecord[]>;
}
