import fs from "fs";
import { google } from "googleapis";
import path from "path";
import {driveAuth} from "../utils/credentials";
import { logger } from "./logger";

export async function downloadFile(fileId: string, saveFolder: string, fileName: string) {
  const drive = google.drive({ version: "v3", auth: driveAuth });

  try {
    const res = await drive.files.get(
      {
        fileId: fileId,
        alt: "media",
        supportsAllDrives: true,
      },
      { responseType: "stream" }
    );

    const pdfFilePath = path.join(saveFolder, fileName);

    if (!fs.existsSync(saveFolder)) {
      fs.mkdirSync(saveFolder, { recursive: true });
    }

    const dest = fs.createWriteStream(pdfFilePath);

    await new Promise<void>((resolve, reject) => {
      res.data
        .on("end", () => {
          logger.info("Done downloading file.");
          resolve();
        })
        .on("error", (err) => {
          logger.error("Error downloading file.");
          reject(err);
        })
        .pipe(dest);
    });

    return pdfFilePath;
  } catch (err) {
    logger.error(`Error downloading file ${fileId}:`, err);
    throw err;
  }
}
