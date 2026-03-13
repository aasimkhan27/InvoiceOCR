import { NormalizedInvoiceData } from "../types/invoice";

export const normalizeInvoiceNumber = (value: string): string =>
  value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

export const safeNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const mergeCorrectedData = (
  original: NormalizedInvoiceData,
  corrected: Partial<NormalizedInvoiceData>
): NormalizedInvoiceData => ({
  ...original,
  ...corrected,
  lineItems: corrected.lineItems ?? original.lineItems
});
