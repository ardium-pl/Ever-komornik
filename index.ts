import express from "express";
import cron from "node-cron";
import { pdfOcr } from "./src/ocr/ocr.ts";
import { logger } from "./src/utils/logger.ts";
import { parseOcrText } from "./src/zod-json/dataProcessor";
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const app = express();
const PDF_DATA_FOLDER = path.join(__dirname, 'ever-data');

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

async function processFile(fileName: string) {
  try {
    logger.info(` 🧾 Reading PDF: ${fileName}`);
    const pdfFilePath = path.join(PDF_DATA_FOLDER, fileName);
    logger.info(`🧾 PDF path: ${pdfFilePath}`);

    const ocrDataText = await pdfOcr(pdfFilePath);
    logger.info(`📄 OCR Data Text: ${ocrDataText}`);

    const parsedData = await parseOcrText(ocrDataText);
    logger.info("JSON Schema: ", parsedData);
  } catch (err) {
    logger.error(`Error processing file ${fileName}: ${err.message}`);
  }
}

async function main() {
  try {
    const files = await fs.readdir(PDF_DATA_FOLDER);

    if (files.length === 0) {
      logger.info("No files found to process.");
      return;
    }

    await Promise.all(files.map((file) => processFile(file)));
    logger.info("All files processed successfully.");
  } catch (err) {
    logger.error(`An error occurred during file processing: ${err.message}`);
  }
}

await main();
