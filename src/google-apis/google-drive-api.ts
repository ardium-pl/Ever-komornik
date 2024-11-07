import { google } from 'googleapis';
import * as fs from 'fs';
import path from 'path';
import "dotenv/config";
import { logger } from '../utils/logger';

export const GOOGLE_SHEETS_ACCOUNT = JSON.parse(process.env.GOOGLE_SHEETS_ACCOUNT as string);

const FOLDER_ID = process.env.FOLDER_ID;
const auth = new google.auth.GoogleAuth({
  credentials: GOOGLE_SHEETS_ACCOUNT,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
}); 


// Function to upload a file to Google Drive
export async function uploadPdfFileToDrive(
  filePath: string,
  fileName: string,
  mimeType: string
): Promise<string | null> {
  try {
    const drive = google.drive({ version: 'v3', auth });

    const fileMetadata = {
      name: fileName,
      ...(FOLDER_ID && { parents: [FOLDER_ID] })
    };

    const media = {
      mimeType,
      body: fs.createReadStream(path.resolve(filePath)),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id',
    });

    if (response.data.id) {
      const fileLink = `https://drive.google.com/file/d/${response.data.id}/view`;
      logger.info(`File uploaded successfully! File ID: ${response.data.id}`);
      logger.info(`Direct link to the file: ${fileLink}`);
      return fileLink
    } else {
      logger.warn("File uploaded but no file ID returned.");
      return null
    }
  } catch (error) {
    logger.error('Error uploading file:', error);
    return null
  }
}
