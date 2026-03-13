import { env } from "../config/env";
import { NormalizedInvoiceData, ValidationResult } from "../types/invoice";
import { InvoiceRepository } from "../types/repositories";
import { normalizeInvoiceNumber } from "../utils/invoice";

export class InvoiceValidationService {
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async validate(invoiceData: NormalizedInvoiceData): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const mandatoryFields = ["vendorName", "invoiceNumber", "invoiceDate", "total"] as const;
    for (const fieldName of mandatoryFields) {
      if (!invoiceData[fieldName].value) {
        errors.push(`${fieldName} is mandatory`);
      }
    }

    const invoiceDate = invoiceData.invoiceDate.value ? new Date(invoiceData.invoiceDate.value) : null;
    const dueDate = invoiceData.dueDate.value ? new Date(invoiceData.dueDate.value) : null;
    if (invoiceDate && Number.isNaN(invoiceDate.valueOf())) errors.push("invoiceDate is invalid");
    if (dueDate && Number.isNaN(dueDate.valueOf())) errors.push("dueDate is invalid");
    if (invoiceDate && dueDate && dueDate < invoiceDate) errors.push("dueDate must be greater than or equal to invoiceDate");

    if (invoiceData.subtotal.value !== null && typeof invoiceData.subtotal.value !== "number") errors.push("subtotal must be numeric");
    if (invoiceData.tax.value !== null && typeof invoiceData.tax.value !== "number") errors.push("tax must be numeric");
    if (invoiceData.total.value !== null && typeof invoiceData.total.value !== "number") errors.push("total must be numeric");

    if (invoiceData.subtotal.value !== null && invoiceData.tax.value !== null && invoiceData.total.value !== null) {
      const sum = invoiceData.subtotal.value + invoiceData.tax.value;
      const delta = Math.abs(sum - invoiceData.total.value);
      if (delta > env.AMOUNT_TOLERANCE) {
        errors.push(`subtotal + tax does not match total within tolerance ${env.AMOUNT_TOLERANCE}`);
      }
    }

    const vendor = invoiceData.vendorName.value ?? "";
    const normalizedNumber = normalizeInvoiceNumber(invoiceData.invoiceNumber.value ?? "");
    const total = invoiceData.total.value ?? 0;
    const duplicates = await this.invoiceRepository.findDuplicates(vendor, normalizedNumber, total);

    if (duplicates.exact.length > 0) {
      warnings.push("Exact duplicate found");
    } else if (duplicates.fuzzy.length > 0) {
      warnings.push("Potential fuzzy duplicate found");
    }

    const confidenceEntries = Object.entries(invoiceData)
      .filter(([key, value]) => key !== "rawText" && key !== "lineItems" && typeof value === "object" && value && "confidence" in value)
      .map(([key, value]) => ({ key, confidence: (value as { confidence: number | null }).confidence ?? 0 }));

    const lowConfidenceFields = confidenceEntries.filter((entry) => entry.confidence < env.OCR_CONFIDENCE_THRESHOLD).map((entry) => entry.key);
    if (lowConfidenceFields.length > 0) {
      warnings.push("Low OCR confidence on critical fields");
    }

    const averageConfidence =
      confidenceEntries.reduce((acc, entry) => acc + entry.confidence, 0) / (confidenceEntries.length || 1);

    const gl = invoiceData.glAccount.value;
    const approvalRouting = gl && env.AUTO_APPROVE_GL_ACCOUNTS_LIST.includes(gl) ? "AUTO_APPROVE" : "REQUIRE_APPROVAL";

    const status = errors.length > 0 ? "FAIL" : warnings.length > 0 ? "REVIEW" : "PASS";

    return {
      status,
      errors,
      warnings,
      duplicateCheck: {
        exactDuplicate: duplicates.exact.length > 0,
        fuzzyDuplicateCandidates: duplicates.fuzzy.map((f) => f.id)
      },
      confidenceSummary: {
        lowConfidenceFields,
        averageConfidence,
        threshold: env.OCR_CONFIDENCE_THRESHOLD
      },
      approvalRouting
    };
  }
}
