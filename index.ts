import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { FOLDER_ID } from "./src/google-apis/google-drive-api.ts";
import { uploadDataToSheet } from "./src/google-apis/google-sheets-api";
import { listAllFiles } from "./src/google-apis/list-all-files";
import { pdfOcr } from "./src/ocr/ocr.ts";
import { logger } from "./src/utils/logger.ts";
import { parseOcrText } from "./src/zod-json/dataProcessor";
import { downloadFile } from "./src/utils/downloadFile";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID as string;
const app = express();
const PDF_DATA_FOLDER = path.join(__dirname, "ever-data");
const JSON_DATA_FOLDER = path.join(__dirname, "json-data");

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

async function processFile(fileName: string, fileId: string) {
  try {
    logger.info(` 🧾 Reading PDF: ${fileName}`);
    const pdfFilePath = await downloadFile(fileId, PDF_DATA_FOLDER, fileName);
    logger.info(`🧾 PDF path: ${pdfFilePath}`);

    const ocrDataText = await pdfOcr(pdfFilePath);
    logger.info(`📄 OCR Data Text: ${ocrDataText}`);

    const parsedData = await parseOcrText(ocrDataText);
    logger.info("JSON Schema: ", parsedData);

    const fileLink = `https://drive.google.com/file/d/${fileId}/view`;
    if (fileLink) {
      await uploadDataToSheet(SPREADSHEET_ID, "Dane", parsedData, fileLink);
    } else {
      logger.error("File link was not created properly");
    }

    await fs.mkdir(JSON_DATA_FOLDER, { recursive: true });
    const jsonFilePath = path.join(
      JSON_DATA_FOLDER,
      `${path.parse(fileName).name}.json`
    );
    await fs.writeFile(jsonFilePath, JSON.stringify(parsedData, null, 2));
    logger.info(`✅ JSON data saved to ${jsonFilePath}`);
  } catch (err) {
    logger.error(`Error processing file ${fileName}: ${err.message}`);
  }
}

async function main() {
  try {
    if (FOLDER_ID) {
      const files = await listAllFiles(FOLDER_ID);

      if (files.length === 0) {
        logger.info("No files found to process.");
        return;
      }
      await Promise.all(files.map((file) => processFile(file.name!, file.id!)));
      logger.info("All files processed successfully.");
    }
  } catch (err) {
    logger.error(`An error occurred during file processing: ${err.message}`);
  }
}

await main();
