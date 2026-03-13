import { Request, Response } from "express";
import { AzureDocumentIntelligenceService } from "../services/AzureDocumentIntelligenceService";
import { TrainingService } from "../services/TrainingService";
import { buildModelSchema } from "../validators/invoiceSchemas";

export class TrainingController {
  constructor(
    private readonly trainingService: TrainingService,
    private readonly documentService: AzureDocumentIntelligenceService
  ) {}

  dataset = async (_req: Request, res: Response) => {
    const data = await this.trainingService.getTrainingDataset();
    return res.json(data);
  };

  export = async (_req: Request, res: Response) => {
    const result = await this.trainingService.exportTrainingDataset();
    return res.json(result);
  };

  buildModel = async (req: Request, res: Response) => {
    const payload = buildModelSchema.parse(req.body);
    const result = await this.trainingService.buildModel(payload);
    return res.status(202).json(result);
  };

  listModels = async (_req: Request, res: Response) => {
    const result = await this.trainingService.listModels();
    return res.json(result);
  };

  getModel = async (req: Request, res: Response) => {
    const result = await this.trainingService.getModel(req.params.modelId);
    return res.json(result);
  };

  analyzeWithModel = async (req: Request, res: Response) => {
    const file = req.file;
    const fileUrl = req.body?.fileUrl;
    if (!file && !fileUrl) {
      return res.status(400).json({ message: "file upload or fileUrl is required" });
    }
    const result = await this.documentService.analyzeWithModel(req.params.modelId, {
      fileBuffer: file?.buffer,
      fileUrl
    });
    return res.json(result);
  };
}
