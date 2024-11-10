export function calculateSumOfAllCosts(amounts: Record<string, number | undefined>) {

    const baseSum = Object.entries(amounts)
      .filter(([key, value]) => key !== "transferFee" && value !== undefined)
      .reduce((acc, [, value]) => acc + (value as number), 0);
  
    const transferFeeMultiplier = Object.entries(amounts)
      .filter(([key, value]) => key !== "transferFee" && value !== undefined && value !== 0)
      .length;
  
    const totalWithTransferFee = baseSum + (amounts.transferFee ?? 0) * transferFeeMultiplier;
  
    return { sumOfAllCosts: parseFloat(totalWithTransferFee.toFixed(2)) };
  }
  