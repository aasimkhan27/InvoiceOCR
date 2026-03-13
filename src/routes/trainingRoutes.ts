import { Router } from "express";
import multer from "multer";
import { TrainingController } from "../controllers/TrainingController";

const upload = multer({ storage: multer.memoryStorage() });

export const buildTrainingRouter = (controller: TrainingController): Router => {
  const router = Router();

  router.get("/dataset", controller.dataset);
  router.post("/export", controller.export);
  router.post("/build-model", controller.buildModel);
  router.get("/models", controller.listModels);
  router.get("/models/:modelId", controller.getModel);
  router.post("/models/:modelId/analyze", upload.single("file"), controller.analyzeWithModel);

  return router;
};
