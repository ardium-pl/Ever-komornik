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
export const sheetName = "Dane 3.0" as const;

export const driveAuth = new google.auth.GoogleAuth({
  credentials: GOOGLE_SHEETS_ACCOUNT,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

export const sheetsAuth = new google.auth.GoogleAuth({
  credentials: GOOGLE_SHEETS_ACCOUNT,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export const getGeneralInformationPrompt = `
            You are an expert in parsing bailiff execution data from OCR text. Extract the relevant information and structure it according to the provided schema. 
            Please remember to obey these rules:
            1. Almost all data should be provided (except nipNumber and courtCosts, which are optional).
            2. Ensure all numeric data are numbers, not strings.
            3. For indicatedAmounts:
              - Some terms may vary in Polish (e.g., "Koszty procesu" and "Koszty sądowe" refer to the same costs but are written differently). Watch for these variations in data.
              - "Koszty klauzuli" are pretty rare, so expect that they are mostly not mentioned in the data, they are always written as "Koszty klauzuli".
              - Sometimes there might be costs that doesnt fit to any of the properties in schema. When they dont, add them to the property 'other'. If there are more than once, sum them all up and assing to property other aswell.
              - Here are some examples, how to assing values to their keys properly:
                  * "principal" - values from "Należność główna",
                  * "interest" - values from "Odsetki ...",
                  * "courCosts" - values from "Koszty procesu" or "Koszty sądowe",
                  * "costsOfPreviousEnforcement" - values from "Koszty poprzedniej egzekucji",
                  * "executionFee" - values from "Opłata egzekucyjna",
                  * "cashExpenses" - values from "Wydatki gotówkowe",
                  * "clauseCosts" - values from "Koszty klauzuli",
            4. Detect if the phrase "Do każdej przekazywanej kwoty należy doliczyć opłatę za przelew ..." appears in the OCR text. If it does:
              - Extract the fee amount mentioned after this phrase.
            5. companyIdentification is always a name of the company as a string, mostly begins with the name 'Ever ...', 'Rotero ...', 'Universal ...', 'Proscan ...' and other comapnies that ends wit 'z o.o.'. Dont treat companies with 'Fundusz' in their names as proper name.
            6. In the kmNumber don't write the letters 'Km' as a prefix. Sometimes kmNumber is provided as 'Numer zawiadomienia', but its really rare.
            7. Sometimes peselNumber might not occur in the data, when it's not provided, just use the key peselNumber as optional.
            8. Assign name and lastName in the format 'John', 'Doe', also first letter is capital and other are lower.
            9. While inserting bankAccountNumber, use format '00 0000 0000 0000 0000 0000 0000', so remember to place spaces.
            10. In phoneNumber use format '000 000 000',
          ` as const;
export const getCostInformationPrompt = `
            You are an expert in parsing bailiff execution costs data from OCR text. Extract the relevant information and structure it according to the provided schema. 
            Please remember to obey these rules:
            
` as const;
