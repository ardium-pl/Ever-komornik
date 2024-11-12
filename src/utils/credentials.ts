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
export const sheetName = "Dane 4.0" as const;

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
            1. Almost all data should be provided.
            2. Ensure all numeric data are numbers, not strings.
            3. companyIdentification is always a name of the company as a string, mostly begins with the name 'Ever ...', 'Rotero ...', 'Universal ...', 'Proscan ...' and other comapnies that ends wit 'z o.o.'. Dont treat companies with 'Fundusz' in their names as proper name.
            4. In the kmNumber don't write the letters 'Km' as a prefix. Sometimes kmNumber is provided as 'Numer zawiadomienia', but its really rare.
            5. Sometimes peselNumber might not occur in the data, when it's not provided, just use the key peselNumber as optional.
            6. Assign name and lastName in the format 'John', 'Doe', also first letter is capital and other are lower.
            7. While inserting bankAccountNumber, use format '00 0000 0000 0000 0000 0000 0000', so remember to place spaces.
            8. In phoneNumber use format '000 000 000',
          ` as const;

export const getCostInformationPrompt = `
            You are an expert in parsing bailiff enforcement costs data from OCR text. Extract the relevant information and structure it according to the provided schema. 
            Please remember to obey these rules:
            1. Extract all relevant costs data available
            2. Ensure all numeric data are numbers, not strings.
            3. For indicatedAmounts:
              - Some terms may vary in Polish (e.g., "Koszty procesu" and "Koszty sądowe" refer to the same costs but are written differently). Watch for these variations in data.
              - "Koszty klauzuli" are pretty rare, so expect that they are mostly not mentioned in the data, they are always written as "Koszty klauzuli".
              - (USE ONLY IN CRITICAL CASES!) Sometimes there might be costs that doesnt fit to any of the properties in schema. When they dont, add them to the property 'other'. If there are more than once, sum them all up and assing to property other aswell.
              - Here are some examples, how to assing values to their keys properly:
                  | **Schema Key**                                   | **Polish Term(s)**                                         |
                  |--------------------------------------------------|------------------------------------------------------------|
                  | **principal**                                    | "Należność główna"                                         |
                  | **interest**                                     | "Odsetki ..."                                              |
                  | **courtCosts**                                   | "Koszty procesu", "Koszty sądowe"                          |
                  | **costsOfPreviousEnforcement**                   | "Koszty poprzedniej egzekucji"                             |
                  | **executionFee**                                 | "Opłata egzekucyjna"                                       |
                  | **cashExpenses**                                 | "Wydatki gotówkowe"                                        |
                  | **clauseCosts**                                  | "Koszty klauzuli" (rare, always written as such)           |
                  | **costsOfRepresentationInTheEnforcementProcess** | "Koszty zastępowania w procesie egzekucyjnym"              |
                  | **projectedRelativeFee**                         | "Prognozowana opłata stosunkowa"                           |
                  | **downPaymentMadeByTheOwner**                    | "Zaliczka wpłacona przez właściciela"                      |
                  | **legallyEstablishedBailiffCosts**               | "Prawomocnie ustalone koszty komornicze"                   |
                  | **deposit**                                      | "Depozyt"                                                  |
                  | **balanceOfOutstandingAdvance**                  | "Saldo nierozliczonej zaliczki"                            |
                  | **enforcementCosts**                             | "Kwota kosztów egzekucyjnych"                              |
                  | **other**                                        | Sum of any other costs not matching above categories (use sparingly)|
            4. Detect if the phrase "Do każdej przekazywanej kwoty należy doliczyć opłatę za przelew ..." appears in the OCR text. If it does:
              - Extract the fee amount mentioned after this phrase.

            **Note**:
            - Be precise in matching terms, considering possible variations.
            - If a term is not present in the OCR text, you may omit that key or set it to null, depending on schema requirements.

            
` as const;
