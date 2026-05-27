import { put, del } from "@vercel/blob";
import { env } from "@/lib/env";

/**
 * Uploads a file blob to Vercel Blob and returns its public URL.
 *
 * `addRandomSuffix: true` guards against filename collisions while keeping
 * the original filename visible in the URL — useful for citations like
 * "open contract.pdf at page 5".
 */
export async function uploadFile(file: File, prefix = "docs"): Promise<string> {
  const key = `${prefix}/${file.name}`;
  const result = await put(key, file, {
    access: "public",
    addRandomSuffix: true,
    token: env.BLOB_READ_WRITE_TOKEN,
  });
  return result.url;
}

export async function deleteBlob(url: string): Promise<void> {
  await del(url, { token: env.BLOB_READ_WRITE_TOKEN });
}
