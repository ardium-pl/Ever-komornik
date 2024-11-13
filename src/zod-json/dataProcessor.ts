import "dotenv/config";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { ZodType, ZodTypeDef } from "zod";
import {
  getCostInformationPrompt,
  getGeneralInformationPrompt,
} from "../utils/credentials";
import {
  BailifData,
  BailifDataType,
  IndicatedAmountsSchema,
  IndicatedAmountsSchemaType
} from "./dataJsonSchema";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
export async function parseAllData(ocrText: string): Promise<BailifDataType & IndicatedAmountsSchemaType> {
  return {...(await _parseGeneralInformation(ocrText)),...(await _parseCostsInformation(ocrText))}
}

async function _parseGeneralInformation(
  ocrText: string
): Promise<BailifDataType> {
  return _getGptResponse(getGeneralInformationPrompt, ocrText, BailifData, "bailifdata");
}

async function _parseCostsInformation(
  ocrText: string
): Promise<IndicatedAmountsSchemaType> {
  return _getGptResponse(getCostInformationPrompt, ocrText, IndicatedAmountsSchema, "costsdata");
}

async function _getGptResponse<T extends ZodType<any, ZodTypeDef, any>>(
  systemMessage: string,
  ocrText: string,
  dataSchema: T,
  schemaName: string,
): Promise<T["_output"]> {
  const rawResponse = await client.beta.chat.completions.parse({
    model: 'gpt-4o',
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: ocrText },
    ],
    // temperature: 0.7,
    response_format: zodResponseFormat(dataSchema, schemaName),
  });

  const message = rawResponse.choices[0]?.message;
  if (message?.parsed) {
    return message.parsed as T["_output"];
  } else if (message?.refusal) {
    throw new Error(` 🤖 AI refused to process the text: ${message.refusal}`);
  } else {
    throw new Error("Failed to parse OCR text");
  }
}
