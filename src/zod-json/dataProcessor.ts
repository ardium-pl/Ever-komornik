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
        content:
          `You are an expert in parsing bailif execution data from OCR text. Extract the relevant information and 
          structure it according to the provided schema. 
          Please remember to obey those rules:
          1. Almost all data should be provided(except the nipNumber and courtCosts, they are optional) so dont leave empty properties.
          2. Be sure that all numeric data are numbers, not strings.
          3. For indicatedAmounts:
            some of the names can be written differently in polish e.g. "Koszty procesu" and "Koszty sądowe" are the same costs, but written differently.
            This is the one example, but there might be also some other differences in other bailing execution, so whatch out for these data. 
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
