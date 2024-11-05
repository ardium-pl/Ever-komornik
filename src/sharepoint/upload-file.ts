import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import "dotenv/config";
import { logger } from "../utils/logger.ts";
import { BailifDataType } from "../zod-json/dataJsonSchema.ts";
import fs from 'fs/promises';

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const tenantId = process.env.TENANT_ID;
const siteId = process.env.SHAREPOINT_SITE_ID;
const listId = process.env.SHAREPOINT_LIST_ID;

function _getGraphClient() {
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
            logger.info(
              "Access token retrieved successfully. : " + token.token
            );
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
  fileName: string
) {
  logger.info("Preparing to upload data to SharePoint list...");

  const listItem = {
    fields: {
      Title: fileName,
      "Nazwafirmy": data.caseDetails.companyIdentification,
    },
  };

  try {
    const client = _getGraphClient();
    if (!client) {
      logger.error("Graph client initialization failed.");
      return;
    }

    logger.info(
      `Attempting to upload data to SharePoint list: ${listId} on site: ${siteId}`
    );
    logger.debug("List Item Payload: " + JSON.stringify(listItem));

    await client
      .api(`/sites/${siteId}/lists/${listId}/items`)
      .post({ fields: listItem.fields });

    logger.info("✅ Data uploaded as a list item to SharePoint successfully.");
  } catch (error: any) {
    logger.error(`Error uploading data to SharePoint list: ${error.message}`);
    logger.debug(`Stack trace: ${error.stack}`);
  }
}
