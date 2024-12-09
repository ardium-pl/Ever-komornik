import { drive_v3, google } from "googleapis";
import { GaxiosResponse } from "googleapis-common";
import { driveAuth, FOLDER_ID } from "../utils/credentials";
import { logger } from "../utils/logger";

export async function listAllFiles(folderId: string): Promise<drive_v3.Schema$File[]> {
  const drive = google.drive({ version: "v3", auth: driveAuth });

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
      logger.error("Error listing files:", err);
      throw err;
    }
  }

  return await listFilesInFolder(folderId);
}

console.log(await listAllFiles(FOLDER_ID!));
