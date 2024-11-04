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
    clauseCosts: z.number().optional(),
    transferFee: z.number().optional(),
  })
  .transform((amounts) => {
    // Calculate the base sum of indicated amounts excluding transferFee itself
    const baseSum = Object.entries(amounts)
      .filter(([key, value]) => key !== "transferFee" && value !== undefined)
      .reduce((acc, [, value]) => acc + (value as number), 0);

    const transferFeeMultiplier = Object.entries(amounts)
      .filter(([key, value]) => key !== "transferFee" && value !== undefined && value !== 0)
      .length;

    const totalWithTransferFee = baseSum + (amounts.transferFee ?? 0) * transferFeeMultiplier;

    return { ...amounts, sumOfAllCosts: parseFloat(totalWithTransferFee.toFixed(2)) };
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

export type BailifDataType = z.infer<typeof BailifData> & {
  financials: { sumOfAllCosts: number };
};
