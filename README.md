# InvoiceOCR API

Production-ready Node.js + TypeScript REST API for invoice OCR, validation, and feedback-driven training workflows using Azure AI Document Intelligence.

## Features
- OCR + field extraction using Azure prebuilt invoice model
- Validation engine (mandatory fields, dates, math checks, confidence, duplicate checks)
- Accountant feedback capture (original vs corrected values)
- Training dataset export to Azure Blob Storage
- Custom model build/list/detail/analyze flows via model administration APIs
- Clean architecture (controllers, routes, services, repositories, middleware, validators, config, types)
- OpenAPI docs at `/docs`
- Unit + integration tests with Jest + Supertest

## Tech Stack
Node.js 20+, TypeScript, Express, Zod, Multer, `@azure/ai-form-recognizer`, `@azure/storage-blob`, dotenv, Pino, Jest, Supertest, Swagger.

## Folder Structure
```txt
src/
  app.ts
  server.ts
  config/
  controllers/
  docs/
  middleware/
  repositories/
  routes/
  services/
  types/
  utils/
  validators/
tests/
  unit/
  integration/
```

## Setup
1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run in development:
   ```bash
   npm run dev
   ```
4. Build + run production:
   ```bash
   npm run build && npm start
   ```

## API Endpoints
- `POST /api/invoices/analyze`
- `POST /api/invoices/validate`
- `POST /api/invoices/analyze-and-validate`
- `GET /api/invoices/:id`
- `POST /api/invoices/:id/feedback`
- `GET /api/training/dataset`
- `POST /api/training/export`
- `POST /api/training/build-model`
- `GET /api/training/models`
- `GET /api/training/models/:modelId`
- `POST /api/training/models/:modelId/analyze`
- `GET /health`
- `GET /ready`
- `GET /docs`

## Sample cURL
```bash
curl -X POST http://localhost:3000/api/invoices/analyze \
  -F "file=@./sample-invoice.pdf"

curl -X POST http://localhost:3000/api/invoices/validate \
  -H "Content-Type: application/json" \
  -d '{"invoiceId":"<id>"}'

curl -X POST http://localhost:3000/api/invoices/<id>/feedback \
  -H "Content-Type: application/json" \
  -d '{"correctedBy":"accountant@corp.com","correctedData":{"invoiceNumber":{"value":"INV-2024-001","confidence":1}},"notes":"Fixed typo"}'

curl -X POST http://localhost:3000/api/training/build-model \
  -H "Content-Type: application/json" \
  -d '{"modelId":"invoices-v1","containerUrl":"https://storage.blob.core.windows.net/invoice-training?<SAS>","buildMode":"neural"}'
```

## Notes on Azure Back-Training
The API does **not** retrain the prebuilt invoice model. Instead it:
1. Captures accountant corrections.
2. Stores reviewed ground-truth records.
3. Exports training dataset metadata to Blob Storage.
4. Triggers custom model build via Azure Document Intelligence model administration APIs.

## Docker
```bash
docker build -t invoice-ocr-api .
docker run --env-file .env -p 3000:3000 invoice-ocr-api
```
