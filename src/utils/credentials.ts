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
export const sheetName = "Dane 4.2" as const;

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
            7. While inserting bankAccountNumber, use format '00 0000 0000 0000 0000 0000 0000', so remember to place spaces, but when its not provided, just use undefined.
            8. In phoneNumber use format '000 000 000', but when its not provided, just use undefined. Don't parse 0 at the begining of the phone number, even it it's provided.
          ` as const;


export const getCostInformationPrompt = `
          You are an expert in parsing bailiff enforcement costs data from OCR text. Extract the relevant information and structure it according to the provided schema. 
          Please remember to obey these rules:
          1. Ensure all numeric data are numbers, not strings.
          2. Use only amounts that include 'zł' directly after the number. Exclude values that lack 'zł'.
             - Examples:
               - Correct: '123.10 zł' (✓)  
               - Incorrect: '123.10' (✘) – **do not use values like this**
          3. For indicatedAmounts:
            - Some terms may vary in Polish (e.g., "Koszty procesu" and "Koszty sądowe" refer to the same costs but are written differently). Watch for these variations in data.
            - "Koszty klauzuli" are pretty rare, so expect that they are mostly not mentioned in the data, and they are always written as "Koszty klauzuli."
            - (USE ONLY IN CRITICAL CASES!) Sometimes there might be costs that don't fit any of the properties in the schema. When this happens, add them to the "other" property. If there are multiple, sum them up and assign the total to "other" as well.
            - Use the following guidelines to match terms with schema keys:

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
                | **legallyEstablishedBailiffCosts**               | "Prawomocnie ustalone koszty komornicze"                   |
                | **currentAndArrearsAlimony**                     | "Alimenty bieżące" or "Alimenty zaległe"                   |
                | **arrearsForTheLiquidatorOfTheMaintenanceFund**  | "Zaległość dla likwidatora Funduszu alimentacyjnego"       |
                | **balanceOfOutstandingAdvance**                  | "Saldo nierozliczonej zaliczki"                            |
                | **enforcementCosts**                             | "Kwota kosztów egzekucyjnych"                              |
                | **other**                                        | Sum of any other costs not matching above categories (use sparingly)|

          4. Detect if the phrase "Do każdej przekazywanej kwoty należy doliczyć opłatę za przelew ..." appears in the OCR text. If it does:
            - Extract the fee amount mentioned after this phrase, ensuring it includes "zł".

          5. Don’t assign any values after the statement with the word 'Razem ... ' or 'Ogółem do zapłaty ...'. Example: ‘Razem 123.10 zł’ – ignore any values that appear after "Razem."

          6. Use each value only once in the assignment.

          **Note**:
          - Match terms precisely, considering possible variations.
          - If a term is not present in the OCR text, omit that key or set it to null, depending on schema requirements.
` as const;
