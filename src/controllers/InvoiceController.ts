import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { AzureDocumentIntelligenceService } from "../services/AzureDocumentIntelligenceService";
import { InvoiceValidationService } from "../services/InvoiceValidationService";
import { InvoiceRepository } from "../types/repositories";
import { feedbackSchema, validateSchema } from "../validators/invoiceSchemas";
import { mergeCorrectedData } from "../utils/invoice";

export class InvoiceController {
  constructor(
    private readonly documentService: AzureDocumentIntelligenceService,
    private readonly validationService: InvoiceValidationService,
    private readonly invoiceRepository: InvoiceRepository
  ) {}

  analyze = async (req: Request, res: Response) => {
    const file = req.file;
    const fileUrl = req.body?.fileUrl;

    if (!file && !fileUrl) {
      return res.status(400).json({ message: "file upload or fileUrl is required" });
    }

    const ocrData = await this.documentService.analyzeInvoice({
      fileBuffer: file?.buffer,
      fileUrl
    });

    const now = new Date().toISOString();
    const record = await this.invoiceRepository.save({
      id: uuidv4(),
      sourceFileName: file?.originalname,
      sourceFileUrl: fileUrl,
      ocrData,
      reviewed: false,
      createdAt: now,
      updatedAt: now
    });

    return res.status(201).json(record);
  };

  validate = async (req: Request, res: Response) => {
    const parsed = validateSchema.parse(req.body);

    const invoiceData = parsed.invoiceId
      ? (await this.invoiceRepository.getById(parsed.invoiceId))?.ocrData
      : parsed.ocrData;

    if (!invoiceData) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const validation = await this.validationService.validate(invoiceData);

    if (parsed.invoiceId) {
      await this.invoiceRepository.updateValidation(parsed.invoiceId, validation);
    }

    return res.json(validation);
  };

  analyzeAndValidate = async (req: Request, res: Response) => {
    const file = req.file;
    const fileUrl = req.body?.fileUrl;

    if (!file && !fileUrl) {
      return res.status(400).json({ message: "file upload or fileUrl is required" });
    }

    const ocrData = await this.documentService.analyzeInvoice({
      fileBuffer: file?.buffer,
      fileUrl
    });

    const validation = await this.validationService.validate(ocrData);
    const now = new Date().toISOString();

    const record = await this.invoiceRepository.save({
      id: uuidv4(),
      sourceFileName: file?.originalname,
      sourceFileUrl: fileUrl,
      ocrData,
      validation,
      reviewed: false,
      createdAt: now,
      updatedAt: now
    });

    return res.status(201).json(record);
  };

  getById = async (req: Request, res: Response) => {
    const invoice = await this.invoiceRepository.getById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    return res.json(invoice);
  };

  feedback = async (req: Request, res: Response) => {
    const parsed = feedbackSchema.parse(req.body);
    const invoice = await this.invoiceRepository.getById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const mergedData = mergeCorrectedData(invoice.ocrData, parsed.correctedData as never);
    const changedFields = Object.keys(parsed.correctedData);
    const validation = await this.validationService.validate(mergedData);

    const updated = await this.invoiceRepository.applyFeedback(
      invoice.id,
      {
        correctedBy: parsed.correctedBy,
        correctedAt: new Date().toISOString(),
        changedFields,
        notes: parsed.notes,
        correctedData: parsed.correctedData as never
      },
      mergedData,
      validation
    );

    return res.json(updated);
  };
}
