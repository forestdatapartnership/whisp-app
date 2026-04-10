const MAX_BATCH_SIZE = 100;
const TARGET_BATCHES = 10;

export const getBatchSize = (total: number) =>
  Math.min(MAX_BATCH_SIZE, Math.max(1, Math.ceil(total / TARGET_BATCHES)));
