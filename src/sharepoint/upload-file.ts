import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import "dotenv/config";
import { logger } from "../utils/logger.ts";
import { BailifDataType, IndicatedAmountsSchemaType } from "../zod-json/dataJsonSchema.ts";
import fs from "fs/promises";
import { FieldNames, mapFields } from "./fields.ts";

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

function _createDescription(data: BailifDataType): string {
  return [
    `Należność gotówkowa: ${data.financials.principal}`,
    `Odsetki: ${data.financials.interest}`,
    `Koszty procesu: ${data.financials.courtCosts}`,
    `Koszty klauzuli: ${data.financials.clauseCosts}`,
    `Koszty zastępstwa w egzekucji: ${data.financials.costsOfPreviousEnforcement}`,
    `Opłata egzekucyjna: ${data.financials.executionFee}`,
    `Wydatki gotówkowe: ${data.financials.cashExpenses}`,
    `Opłata za przelew przy każdej kwocie: ${data.financials.transferFee}`
  ].join("\n");
}

// Call this function to check internal names of columns in SharePoint list.
async function _logSharePointColumnNames() {
  logger.info("Fetching SharePoint list column names...");

  const client = await _getGraphClient();
  if (!client) {
    logger.error("Graph client initialization failed.");
    return;
  }

  try {
    const response = await client
      .api(`/sites/${siteId}/lists/${listId}/columns`)
      .get();

    const columns = response.value;
    if (columns && columns.length > 0) {
      logger.info("List of SharePoint columns:");
      columns.forEach((column: any) => {
        logger.info(
          `Column Display Name: ${column.displayName}, Internal Name: ${column.name}`
        );
      });
    } else {
      logger.info("No columns found in the SharePoint list.");
    }
  } catch (error: any) {
    logger.error(`Error fetching columns from SharePoint: ${error.message}`);
    logger.debug(`Stack trace: ${error.stack}`);
  }
}

export async function uploadDataToSharePointList(
  data: BailifDataType,
  fileName: string,
  pdfFilePath: string
) {
  logger.info("Preparing to upload data to SharePoint list...");

  const fieldsData: FieldNames = {
    Title: fileName,
    Nazwafirmy: data.caseDetails.companyIdentification,
    ImieINazwiskoDluznika:
      data.personalInfo.distrainee.name +
      " " +
      data.personalInfo.distrainee.lastName,
    Pesel: data.personalInfo.distrainee.peselNumber,
    Nip: data.personalInfo.distrainee.nipNumber,
    ImieINazwiskoKomornika:
      data.personalInfo.bailif.name + " " + data.personalInfo.bailif.lastName,
    NumerTelefonu: data.personalInfo.bailif.phoneNumber,
    NumerKm: data.caseDetails.kmNumber,
    RachunekBankowy: data.caseDetails.bankAccountNumber,
    SumaKosztow: data.financials.sumOfAllCosts,
  };

  const listItem = {
    fields: {
      ...mapFields(fieldsData),
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
    await client
      .api(`/sites/${siteId}/lists/${listId}/items`)
      .post({ fields: listItem.fields,
        descritpion: listItem.fields
       });

    logger.info("✅ Data uploaded as a list item to SharePoint successfully.");

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
