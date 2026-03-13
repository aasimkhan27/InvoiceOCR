import { Router } from "express";
import multer from "multer";
import { InvoiceController } from "../controllers/InvoiceController";

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const ok = ["application/pdf", "image/png", "image/jpeg"].includes(file.mimetype);
    cb(ok ? null : new Error("Unsupported file type"), ok);
  }
});

export const buildInvoiceRouter = (controller: InvoiceController): Router => {
  const router = Router();

  router.post("/analyze", upload.single("file"), controller.analyze);
  router.post("/validate", controller.validate);
  router.post("/analyze-and-validate", upload.single("file"), controller.analyzeAndValidate);
  router.get("/:id", controller.getById);
  router.post("/:id/feedback", controller.feedback);

  return router;
};
