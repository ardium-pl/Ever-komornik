import "dotenv/config";
import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const GOOGLE_SHEETS_ACCOUNT = JSON.parse(
  process.env.GOOGLE_SHEETS_ACCOUNT as string
);

export const FOLDER_ID = process.env.FOLDER_ID;
export const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
export const PDF_DATA_FOLDER = path.join(__dirname, "ever-data");
export const JSON_DATA_FOLDER = path.join(__dirname, "json-data");
export const sheetName = "Dane" as const;

export const driveAuth = new google.auth.GoogleAuth({
  credentials: GOOGLE_SHEETS_ACCOUNT,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

export const sheetsAuth = new google.auth.GoogleAuth({
  credentials: GOOGLE_SHEETS_ACCOUNT,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
