import { z } from "zod";

const DistraineeSchema = z.object({
  peselNumber: z.number(),
  name: z.string(),
  lastName: z.string(),
  nipNumber: z.number().optional(),
});

const BailifSchema = z.object({
  name: z.string(),
  lastName: z.string(),
  kmNumber: z.string(),
  phoneNumber: z.number(),
  mail: z.string(),
});

const IndicatedAmountsSchema = z
  .object({
    principal: z.number().optional(),
    interest: z.number().optional(),
    courtCosts: z.number().optional(),
    costsOfPreviousEnforcement: z.number().optional(),
    executionFee: z.number().optional(),
    cashExpenses: z.number().optional(),
  })
  .transform((amounts) => {
    // Calculate the sum of all indicated amounts, considering optional fields
    const sumOfAllCosts = Object.values(amounts)
      .filter((value) => value !== undefined)
      .reduce((acc, value) => acc + (value as number), 0);

    return { ...amounts, sumOfAllCosts };
  });

export const BailifData = z.object({
  personalInfo: z.object({
    distrainee: DistraineeSchema,
    bailif: BailifSchema,
  }),
  caseDetails: z.object({
    caseNumber: z.string(),
    bankAccountNumber: z.string(),
    companyIdentification: z.string(),
  }),
  financials: IndicatedAmountsSchema,
});

// Define the type with the sum included in IndicatedAmountsSchema
export type BailifDataType = z.infer<typeof BailifData> & {
  financials: { sumOfAllCosts: number };
};
