import { z } from "zod";
import { calculateSumOfAllCosts } from "../utils/calculateSumOfAllCosts";

const DistraineeSchema = z.object({
  peselNumber: z.number(),
  name: z.string(),
  lastName: z.string(),
  nipNumber: z.number().optional(),
});

const BailifSchema = z.object({
  name: z.string(),
  lastName: z.string(),
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
    clauseCosts: z.number().optional(),
    transferFee: z.number().optional(),
  })
  .transform(calculateSumOfAllCosts);

export const BailifData = z.object({
  personalInfo: z.object({
    distrainee: DistraineeSchema,
    bailif: BailifSchema,
  }),
  caseDetails: z.object({
    kmNumber: z.string(),
    bankAccountNumber: z.string(),
    companyIdentification: z.string(),
  }),
  financials: IndicatedAmountsSchema,
});

export type BailifDataType = z.infer<typeof BailifData> & {
  financials: { sumOfAllCosts: number };
};
