import "dotenv/config";
import OpenAI from "openai";
import axios from "axios";
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
  IndicatedAmountsSchemaType,
} from "./dataJsonSchema";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function parseAllData(
  ocrText: string
): Promise<BailifDataType & IndicatedAmountsSchemaType> {
  return {
    ...(await _parseGeneralInformation(ocrText)),
    ...(await _parseCostsInformation(ocrText)),
  };
}

async function _parseGeneralInformation(
  ocrText: string
): Promise<BailifDataType> {
  return _getAzureGptResponse(
    getGeneralInformationPrompt,
    ocrText,
    BailifData,
    "general_information"
  );
}

async function _parseCostsInformation(
  ocrText: string
): Promise<IndicatedAmountsSchemaType> {
  return _getAzureGptResponse(
    getCostInformationPrompt,
    ocrText,
    IndicatedAmountsSchema,
    "costs_information"
  );
}

async function _getGptResponse<T extends ZodType<any, ZodTypeDef, any>>(
  systemMessage: string,
  ocrText: string,
  dataSchema: T,
  schemaName: string
): Promise<T["_output"]> {
  const rawResponse = await client.beta.chat.completions.parse({
    model: "gpt-4o",
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

async function _getO1PreviewResponse(
  ocrText: string,
  userPrompt: string,
  schema: object
): Promise<object> {
  try {
    // Add the schema as part of the prompt
    const schemaDescription = JSON.stringify(schema, null, 2);
    const fullPrompt = `${userPrompt}\n\nHere is the expected schema for the response:\n${schemaDescription}\n\nText to process:\n${ocrText}`;

    // Make the request
    const rawResponse = await client.chat.completions.create({
      model: "o1-preview",
      messages: [{ role: "user", content: fullPrompt }],
    });

    const message = rawResponse.choices[0]?.message?.content;

    if (!message) {
      throw new Error("Received an empty response from the AI.");
    }

    // Attempt to parse as JSON
    try {
      return JSON.parse(message);
    } catch (parseError) {
      console.warn("Failed to parse response as JSON. Returning raw text.");
      return { rawText: message }; // Return raw text for debugging or fallback
    }
  } catch (error: any) {
    console.error("Error using o1-preview API:", error);
    throw new Error(
      `An error occurred while fetching the response: ${error.message}`
    );
  }
}

async function _getAzureGptResponse<T extends ZodType<any, ZodTypeDef, any>>(
  systemMessage: string,
  ocrText: string,
  dataSchema: T,
  schemaName: string
): Promise<T["_output"]> {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = `https://ardiumopenai.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-08-01-preview`;

  const payload = {
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: ocrText },
    ],
    response_format: zodResponseFormat(dataSchema, schemaName),
  };

  try {
    // Make the API request
    const response = await axios.post(endpoint, payload, {
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
    });

    const rawResponse = response.data;
    const message = rawResponse.choices[0]?.message;

    if (!message) {
      throw new Error("Empty response from Azure OpenAI");
    }

    try {

      if (message?.content) {
        return JSON.parse(message.content) as T["_output"];
      } else if (message?.refusal) {
        throw new Error(` 🤖 AI refused to process the text: ${message.refusal}`);
      } else {
        throw new Error("Failed to parse OCR text");
      }
    } catch (parseError) {
      console.error("Parsing Error:", parseError);
      throw new Error("Failed to parse JSON from the API response");
    }
  } catch (error: any) {
    console.error("Azure OpenAI API Error:", error.message);
    throw new Error(`Azure OpenAI API Error: ${error.message}`);
  }
}
