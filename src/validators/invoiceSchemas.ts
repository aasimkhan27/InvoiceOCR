import { z } from "zod";

export const analyzeSchema = z
  .object({
    fileUrl: z.string().url().optional()
  })
  .refine((value) => !!value.fileUrl, {
    message: "fileUrl is required when no file upload is provided"
  });

export const validateSchema = z.object({
  invoiceId: z.string().optional(),
  ocrData: z.any().optional()
}).refine((body) => body.invoiceId || body.ocrData, {
  message: "invoiceId or ocrData is required"
});

export const feedbackSchema = z.object({
  correctedBy: z.string().min(1),
  notes: z.string().optional(),
  correctedData: z.record(z.any())
});

export const buildModelSchema = z.object({
  modelId: z.string().min(1),
  containerUrl: z.string().url(),
  description: z.string().optional(),
  buildMode: z.enum(["template", "neural"]).optional()
});
