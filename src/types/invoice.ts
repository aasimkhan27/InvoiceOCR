export type ValidationStatus = "PASS" | "REVIEW" | "FAIL";

export interface InvoiceLineItem {
  description?: string;
  quantity?: number;
  unitPrice?: number;
  amount?: number;
  confidence?: number;
}

export interface InvoiceField<T> {
  value: T | null;
  confidence: number | null;
}

export interface NormalizedInvoiceData {
  rawText: string;
  vendorName: InvoiceField<string>;
  invoiceNumber: InvoiceField<string>;
  invoiceDate: InvoiceField<string>;
  dueDate: InvoiceField<string>;
  subtotal: InvoiceField<number>;
  tax: InvoiceField<number>;
  total: InvoiceField<number>;
  currency: InvoiceField<string>;
  poNumber: InvoiceField<string>;
  glAccount: InvoiceField<string>;
  lineItems: InvoiceLineItem[];
}

export interface ValidationResult {
  status: ValidationStatus;
  errors: string[];
  warnings: string[];
  duplicateCheck: {
    exactDuplicate: boolean;
    fuzzyDuplicateCandidates: string[];
  };
  confidenceSummary: {
    lowConfidenceFields: string[];
    averageConfidence: number;
    threshold: number;
  };
  approvalRouting: "AUTO_APPROVE" | "REQUIRE_APPROVAL";
}

export interface InvoiceFeedback {
  correctedBy: string;
  correctedAt: string;
  changedFields: string[];
  notes?: string;
  correctedData: Partial<NormalizedInvoiceData>;
}

export interface InvoiceRecord {
  id: string;
  sourceFileName?: string;
  sourceFileUrl?: string;
  sourceBlobName?: string;
  ocrData: NormalizedInvoiceData;
  validation?: ValidationResult;
  feedback?: InvoiceFeedback;
  reviewed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingModelBuildRequest {
  modelId: string;
  containerUrl: string;
  description?: string;
  buildMode?: "template" | "neural";
}
