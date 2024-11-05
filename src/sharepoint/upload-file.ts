import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import "dotenv/config";
import { logger } from "../utils/logger.ts";
import { BailifDataType } from "../zod-json/dataJsonSchema.ts";
import fs from "fs/promises";

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const tenantId = process.env.TENANT_ID;
const siteId = process.env.SHAREPOINT_SITE_ID;
const listId = process.env.SHAREPOINT_LIST_ID;

async function _getGraphClient() {
  logger.info("Initializing ClientSecretCredential...");

  if (!clientId || !clientSecret || !tenantId) {
    logger.error(`Missing environment variables: 
            ClientId: ${clientId},
            ClientSecret: ${clientSecret ? "provided" : "missing"},
            TenantId: ${tenantId}`);
    return null;
  }

  try {
    const credential = new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret
    );
    logger.info("Creating Microsoft Graph client with middleware...");
    return Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          logger.info("Requesting access token via ClientSecretCredential...");
          const token = await credential.getToken(
            "https://graph.microsoft.com/.default"
          );
          if (token?.token) {
            logger.info("Access token retrieved successfully.");
            return token.token;
          } else {
            logger.error("Failed to retrieve access token.");
            return "";
          }
        },
      },
    });
  } catch (error: any) {
    logger.error(`Error initializing Graph client: ${error.message}`);
    return null;
  }
}

export async function uploadDataToSharePointList(
  data: BailifDataType,
  fileName: string,
  pdfFilePath: string
) {
  logger.info("Preparing to upload data to SharePoint list...");

  const listItem = {
      fields: {
          Title: fileName,
          Nazwafirmy: data.caseDetails.companyIdentification,
          
        },
    };
    
    try {
    const client = await _getGraphClient();
    if (!client) {
        logger.error("Graph client initialization failed.");
        return;
    }
    
    logger.info(
        `Uploading data to SharePoint list: ${listId} on site: ${siteId}`
    );
    const createdItem = await client
    .api(`/sites/${siteId}/lists/${listId}/items`)
    .post({ fields: listItem.fields });
    const itemId = createdItem.id;
    logger.info("✅ Data uploaded as a list item to SharePoint successfully.");
    
    // Alternative: Upload the PDF as a file in a library folder
    const uploadPath = `/sites/${siteId}/drive/root:/PDF/${fileName}:/content`;
    
    const fileContent = await fs.readFile(pdfFilePath);
    await client.api(uploadPath).put(fileContent);
    logger.info(
        "📎 PDF file uploaded as a file to SharePoint library successfully."
    );
} catch (error: any) {
    logger.error(
      `Error uploading data or file to SharePoint: ${error.message}`
    );
    logger.debug(`Stack trace: ${error.stack}`);
  }
}
