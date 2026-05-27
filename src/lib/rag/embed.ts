import { embedBatch, type EmbedTask } from "@/lib/gemini";

const BATCH_SIZE = 64;

/**
 * Embed an arbitrary number of texts by chunking into Gemini-friendly
 * batches. Preserves input order.
 */
export async function embedTexts(
  texts: string[],
  taskType: EmbedTask,
): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const embeddings = await embedBatch(batch, taskType);
    out.push(...embeddings);
  }
  return out;
}
