import { google, sheets_v4 } from "googleapis";
import { sheetsAuth, sheetName } from "../utils/credentials";
import {
  BailifDataType,
  IndicatedAmountsSchemaType,
} from "../zod-json/dataJsonSchema";
import { logger } from "../utils/logger";
import { hasExactLetters } from "../utils/replacePolishCharacters";

const authClient =
  (await sheetsAuth.getClient()) as sheets_v4.Params$Resource$Spreadsheets$Values$Append["auth"];
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
    logger.error("Error fetching last row:", error);
    throw error;
  }
}

async function setRowStyles(spreadsheetId: string, rowIndex: number) {
  const lastColumn = 18;
  const sheetId = 1;

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
  data: BailifDataType & IndicatedAmountsSchemaType,
  fileLink: string
) {
  const lastRow = await getLastRow(spreadsheetId);
  const nextRow = lastRow + 1;
  const range = `${sheetName}!A${nextRow}`;

  const bankAccountNumber = hasExactLetters(
    data.caseDetails.bankAccountNumber,
    26
  )
    ? data.caseDetails.bankAccountNumber
    : `Odczytany numer jest niepoprawny(${data.caseDetails.bankAccountNumber}), sprawdź ręcznie`;

  const peselNumber = data.personalInfo.distrainee.peselNumber
    ? hasExactLetters(data.personalInfo.distrainee.peselNumber, 11)
      ? data.personalInfo.distrainee.peselNumber
      : `Odczytany numer jest niepoprawny(${data.personalInfo.distrainee.peselNumber}), sprawdź ręcznie`
    : undefined;

  const nipNumber = data.personalInfo.distrainee.nipNumber
    ? hasExactLetters(data.personalInfo.distrainee.nipNumber, 10)
      ? data.personalInfo.distrainee.nipNumber
      : `Odczytany numer jest niepoprawny(${data.personalInfo.distrainee.nipNumber}), sprawdź ręcznie`
    : undefined;

  const values = [
    [
      fileLink,
      data.caseDetails.companyIdentification,
      `${data.personalInfo.distrainee.name} ${data.personalInfo.distrainee.lastName}`,
      peselNumber,
      nipNumber,
      `${data.personalInfo.bailif.name} ${data.personalInfo.bailif.lastName}`,
      data.personalInfo.bailif.phoneNumber,
      data.caseDetails.kmNumber,
      bankAccountNumber,
      data.sumOfAllCosts,
      data.principal,
      data.interest,
      data.courtCosts,
      data.clauseCosts,
      data.costsOfPreviousEnforcement,
      data.executionFee,
      data.cashExpenses,
      data.transferFee,
      data.costsOfRepresentationInTheEncforcementsProcess,
      data.projectedRelativeFee,
      data.downPaymentMadeByTheOwner,
      data.legallyEstablishedBailiffCosts,
      data.deposit,
      data.currentAlimony,
      data.alimonyArrearsToCreditor,
      data.arrearsForTheLiquidatorOfTheMaintenanceFund,
      data.balanceOfOutstandingAdvance,
      data.enforcementCosts,
      data.other,
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

    logger.info("Data uploaded successfully:", response.data);

    // await setRowStyles(spreadsheetId, nextRow);
  } catch (error) {
    logger.error("Error uploading data:", error);
  }
}
