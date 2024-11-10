import express from "express";
import fs from "fs-extra";
import path from "path";
import { uploadDataToSheet } from "./src/google-apis/google-sheets-api";
import { listAllFiles } from "./src/google-apis/google-drive-api.ts";
import { pdfOcr } from "./src/ocr/ocr.ts";
import { FOLDER_ID, PDF_DATA_FOLDER, JSON_DATA_FOLDER, SPREADSHEET_ID } from "./src/utils/credentials";
import { downloadFile } from "./src/utils/downloadFile";
import { logger } from "./src/utils/logger.ts";
import "dotenv/config";
import { parseOcrText } from "./src/zod-json/dataProcessor";
import { sheetName } from "./src/utils/credentials";

const PORT = process.env.PORT || 3000;
const app = express();

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

async function processFile(fileName: string, fileId: string) {
  try {
    fs.ensureDir(PDF_DATA_FOLDER);
    logger.info(` 🧾 Reading PDF: ${fileName}`);
    const pdfFilePath = await downloadFile(fileId, PDF_DATA_FOLDER, fileName);
    logger.info(`🧾 PDF path: ${pdfFilePath}`);

    const ocrDataText = await pdfOcr(pdfFilePath);
    logger.info(`📄 OCR Data Text: ${ocrDataText}`);

    const parsedData = await parseOcrText(ocrDataText);
    logger.info("JSON Schema: ", parsedData);

    const fileLink = `https://drive.google.com/file/d/${fileId}/view`;
    if (fileLink && SPREADSHEET_ID) {
      await uploadDataToSheet(SPREADSHEET_ID, sheetName, parsedData, fileLink);
    } else {
      logger.error("File link or spreadsheetId was not created properly");
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
      for(const file of files){
        await processFile(file.name!, file.id!);
      }
    //   await Promise.all(files.map((file) => processFile(file.name!, file.id!)));
      logger.info("All files processed successfully.");
    }
  } catch (err) {
    logger.error(`An error occurred during file processing: ${err.message}`);
  }
}

await main();
