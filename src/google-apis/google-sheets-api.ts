import { google, sheets_v4 } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import { BailifDataType } from "../zod-json/dataJsonSchema";
import { GOOGLE_SHEETS_ACCOUNT } from "./google-drive-api";

const sheetName = "Dane";
const auth = new GoogleAuth({
  credentials: GOOGLE_SHEETS_ACCOUNT,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const authClient =
  (await auth.getClient()) as sheets_v4.Params$Resource$Spreadsheets$Values$Append["auth"];
const sheets = google.sheets({ version: "v4", auth: authClient });

async function getLastRow(spreadsheetId: string): Promise<number> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`,
    });

    const rows = response.data.values;
    if (rows) {
      return rows.length;
    } else {
      return 0;
    }
  } catch (error) {
    console.error("Error fetching last row:", error);
    throw error;
  }
}

async function setRowStyles(spreadsheetId: string, rowIndex: number) {
    const lastColumn = 18;
    const sheetId = 0;
  
    const requests: sheets_v4.Schema$Request[] = [
      {
        updateBorders: {
          range: {
            sheetId,
            startRowIndex: rowIndex - 1,
            endRowIndex: rowIndex,
            startColumnIndex: 0,
            endColumnIndex: lastColumn,
          },
          top: { style: "SOLID", width: 1 },
          bottom: { style: "SOLID", width: 1 },
          left: { style: "SOLID", width: 1 },
          right: { style: "SOLID", width: 1 },
        },
      },
    ];
  
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests,
      },
    });
  }
  
  

export async function uploadDataToSheet(
  spreadsheetId: string,
  sheetName: string,
  data: BailifDataType,
  fileLink: string
) {
  const lastRow = await getLastRow(spreadsheetId);
  const nextRow = lastRow + 1;
  const range = `${sheetName}!A${nextRow}`;

  const values = [
    [
      fileLink,
      data.caseDetails.companyIdentification,
      `${data.personalInfo.distrainee.name} ${data.personalInfo.distrainee.lastName}`,
      data.personalInfo.distrainee.peselNumber,
      data.personalInfo.distrainee.nipNumber,
      `${data.personalInfo.bailif.name} ${data.personalInfo.bailif.lastName}`,
      data.personalInfo.bailif.phoneNumber,
      data.caseDetails.kmNumber,
      data.caseDetails.bankAccountNumber,
      data.financials.sumOfAllCosts,
      data.financials.principal,
      data.financials.interest,
      data.financials.courtCosts,
      data.financials.clauseCosts,
      data.financials.costsOfPreviousEnforcement,
      data.financials.executionFee,
      data.financials.cashExpenses,
      data.financials.transferFee,
    ],
  ];

  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values: values,
      },
    });

    console.log("Data uploaded successfully:", response.data);

    await setRowStyles(spreadsheetId, nextRow);
  } catch (error) {
    console.error("Error uploading data:", error);
  }
}
