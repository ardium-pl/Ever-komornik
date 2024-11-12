export function calculateSumOfAllCosts(amounts: Record<string, number | undefined>) {

    const baseSum = Object.entries(amounts)
      .filter(([key, value]) => key !== "transferFee" && value !== undefined)
      .reduce((acc, [, value]) => acc + (value as number), 0);
  
    return { sumOfAllCosts: parseFloat(baseSum.toFixed(2)) };
  }
  