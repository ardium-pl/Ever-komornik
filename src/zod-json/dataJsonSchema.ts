import { z } from "zod";
import { calculateSumOfAllCosts } from "../utils/calculateSumOfAllCosts";

const DistraineeSchema = z.object({
  peselNumber: z.string().optional(),
  name: z.string(),
  lastName: z.string(),
  nipNumber: z.string().optional(),
});

const BailifSchema = z.object({
  name: z.string(),
  lastName: z.string(),
  phoneNumber: z.string().optional(),
  mail: z.string(),
});

export const IndicatedAmountsSchema = z
  .object({
    principal: z.number().optional(),
    interest: z.number().optional(),
    courtCosts: z.number().optional(),
    executionFee: z.number().optional(),
    cashExpenses: z.number().optional(),
    clauseCosts: z.number().optional(),
    transferFee: z.number().optional(),
    costsOfPreviousEnforcement: z.number().optional(),
    costsOfRepresentationInTheEncforcementsProcess: z.number().optional(),
    projectedRelativeFee: z.number().optional(),
    downPaymentMadeByTheOwner: z.number().optional(),
    legallyEstablishedBailiffCosts: z.number().optional(),
    enforcementCosts: z.number().optional(),
    deposit: z.number().optional(),
    balanceOfOutstandingAdvance: z.number().optional(),
    alimonyArrearsToCreditor: z.number().optional(),
    arrearsForTheLiquidatorOfTheMaintenanceFund: z.number().optional(),
    currentAlimony: z.number().optional(),
    other: z.number().optional()
  })
  .transform((amounts) => ({
    ...amounts,
    ...calculateSumOfAllCosts(amounts),
  }));

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
});

export type BailifDataType = z.infer<typeof BailifData>;
export type IndicatedAmountsSchemaType = z.infer<typeof IndicatedAmountsSchema>;
