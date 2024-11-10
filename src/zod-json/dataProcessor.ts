import dotenv from "dotenv";
import OpenAI from "openai";
import { BailifData, BailifDataType } from "./dataJsonSchema";
import { zodResponseFormat } from "openai/helpers/zod";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function parseOcrText(ocrText: string): Promise<BailifDataType> {
  const completion = await client.beta.chat.completions.parse({
    model: "gpt-4o-2024-08-06",
    messages: [
      {
        role: "system",
        content: `
            You are an expert in parsing bailiff execution data from OCR text. Extract the relevant information and structure it according to the provided schema. 
            Please remember to obey these rules:
            1. Almost all data should be provided (except nipNumber and courtCosts, which are optional).
            2. Ensure all numeric data are numbers, not strings.
            3. For indicatedAmounts:
              - Some terms may vary in Polish (e.g., "Koszty procesu" and "Koszty sądowe" refer to the same costs but are written differently). Watch for these variations in data.
              - "Koszty klauzuli" are pretty rare, so expect that they are mostly not mentioned in the data, they are always written as "Koszty klauzuli".
              - Sometimes there might be costs that doesnt fit to any of the properties in schema. When they dont, add them to the property 'other'. If there are more than once, sum them all up and assing to property other aswell.
            4. Detect if the phrase "Do każdej przekazywanej kwoty należy doliczyć opłatę za przelew ..." appears in the OCR text. If it does:
              - Extract the fee amount mentioned after this phrase.
            5. companyIdentification is always a name of the company as a string, mostly begins with the name 'Ever ...', 'Rotero ...', 'Universal ...', 'Proscan ...' and other comapnies that ends wit 'z o.o.'. Dont treat companies with 'Fundusz' in their names as proper name.
            6. In the kmNumber don't write the letters 'Km' as a prefix. Sometimes kmNumber is provided as 'Numer zawiadomienia', but its really rare.
            7. Sometimes peselNumber might not occur in the data, when it's not provided, just use the key peselNumber as optional.
            8. Assign name and lastName in the format 'John', 'Doe', also first letter is capital and other are lower.
            9. While inserting bankAccountNumber, use format '00 0000 0000 0000 0000 0000 0000', so remember to place spaces.
          `,
      },
      { role: "user", content: ocrText },
    ],
    response_format: zodResponseFormat(BailifData, "bailifData"),
  });

  const message = completion.choices[0]?.message;
  if (message?.parsed) {
    return message.parsed;
  } else if (message?.refusal) {
    throw new Error(` 🤖 AI refused to process the text: ${message.refusal}`);
  } else {
    throw new Error("Failed to parse OCR text");
  }
}
