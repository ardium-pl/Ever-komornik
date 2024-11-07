import { google, drive_v3 } from "googleapis";
import { GaxiosResponse } from "googleapis-common";
import "dotenv/config";
import { GOOGLE_SHEETS_ACCOUNT } from "./google-drive-api";
import { FOLDER_ID } from "./google-drive-api";

const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID;

if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_PROJECT_ID) {
  throw new Error("Missing required environment variables");
}

const auth = new google.auth.GoogleAuth({
    credentials: GOOGLE_SHEETS_ACCOUNT,
    scopes: ['https://www.googleapis.com/auth/drive'],
  }); 

export async function listAllFiles(folderId: string): Promise<drive_v3.Schema$File[]> {
  const drive = google.drive({ version: "v3", auth });

  async function listFilesInFolder(folderId: string): Promise<drive_v3.Schema$File[]> {
    let allFiles: drive_v3.Schema$File[] = [];
    let pageToken: string | undefined = undefined;

    try {
      do {
        const res: GaxiosResponse<drive_v3.Schema$FileList> = await drive.files.list({
          q: `'${folderId}' in parents`,
          pageSize: 100,
          fields: "nextPageToken, files(id, name, mimeType)",
          pageToken,
        });

        const files = res.data.files || [];

        // Separate folders and files
        const folderFiles = files.filter(
          (file): file is drive_v3.Schema$File =>
            file.mimeType !== "application/vnd.google-apps.folder" && file.mimeType !== undefined
        );
        const subfolders = files.filter(
          (file): file is drive_v3.Schema$File => file.mimeType === "application/vnd.google-apps.folder"
        );

        allFiles = allFiles.concat(folderFiles);

        // Recursively get files from subfolders
        for (const subfolder of subfolders) {
          if (subfolder.id) {
            const subfolderFiles = await listFilesInFolder(subfolder.id);
            allFiles = allFiles.concat(subfolderFiles);
          }
        }

        pageToken = res.data.nextPageToken || undefined;
      } while (pageToken);

      return allFiles;
    } catch (err) {
      console.error("Error listing files:", err);
      throw err;
    }
  }

  return await listFilesInFolder(folderId);
}
if(FOLDER_ID)
console.log(await listAllFiles(FOLDER_ID));
