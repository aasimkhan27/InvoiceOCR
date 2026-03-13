import { buildApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";

const app = buildApp();

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "Invoice OCR API listening");
});
