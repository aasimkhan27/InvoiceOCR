import express from "express";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import { logger } from "./config/logger";
import { requestIdMiddleware } from "./middleware/requestId";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { InMemoryInvoiceRepository } from "./repositories/InMemoryInvoiceRepository";
import { AzureDocumentIntelligenceService } from "./services/AzureDocumentIntelligenceService";
import { InvoiceValidationService } from "./services/InvoiceValidationService";
import { BlobStorageService } from "./services/BlobStorageService";
import { TrainingService } from "./services/TrainingService";
import { InvoiceController } from "./controllers/InvoiceController";
import { TrainingController } from "./controllers/TrainingController";
import { buildInvoiceRouter } from "./routes/invoiceRoutes";
import { buildTrainingRouter } from "./routes/trainingRoutes";
import { swaggerSpec } from "./docs/swagger";

export const buildApp = (deps?: {
  documentService?: AzureDocumentIntelligenceService;
  invoiceRepository?: InMemoryInvoiceRepository;
}) => {
  const app = express();
  app.use(express.json({ limit: "5mb" }));
  app.use(requestIdMiddleware);
  app.use(pinoHttp({ logger }));

  const invoiceRepository = deps?.invoiceRepository ?? new InMemoryInvoiceRepository();
  const documentService = deps?.documentService ?? new AzureDocumentIntelligenceService();
  const validationService = new InvoiceValidationService(invoiceRepository);
  const blobStorageService = new BlobStorageService();
  const trainingService = new TrainingService(invoiceRepository, blobStorageService, documentService);

  const invoiceController = new InvoiceController(documentService, validationService, invoiceRepository);
  const trainingController = new TrainingController(trainingService, documentService);

  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/ready", (_req, res) => res.json({ status: "ready" }));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use("/api/invoices", buildInvoiceRouter(invoiceController));
  app.use("/api/training", buildTrainingRouter(trainingController));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
