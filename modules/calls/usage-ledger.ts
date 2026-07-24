export function calculateBillableSeconds(durationSeconds: number, incrementSeconds = 60, minimumBillableSeconds = 60) {
  const safeDuration = Math.max(0, Math.floor(durationSeconds));
  const safeIncrement = Math.max(1, Math.floor(incrementSeconds));
  const safeMinimum = Math.max(0, Math.floor(minimumBillableSeconds));
  const rounded = Math.ceil(safeDuration / safeIncrement) * safeIncrement;
  return Math.max(safeMinimum, rounded);
}

export function estimateUsageCost(input: {
  durationSeconds: number;
  incrementSeconds?: number;
  minimumBillableSeconds?: number;
  costPerMinute: number;
  connectionFee?: number;
}) {
  const billableSeconds = calculateBillableSeconds(
    input.durationSeconds,
    input.incrementSeconds,
    input.minimumBillableSeconds
  );
  const usageCost = (billableSeconds / 60) * input.costPerMinute;
  const total = usageCost + (input.connectionFee || 0);

  return {
    billableSeconds,
    usageCost,
    totalCost: total,
  };
}
