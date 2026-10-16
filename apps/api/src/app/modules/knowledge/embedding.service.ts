import { env } from "../../config/env";

export class EmbeddingService {
  /**
   * Generates a 1536-dimensional embedding vector for the given text.
   * Uses OpenAI text-embedding-3-small when an active API key is available,
   * or a deterministic normalized vector for offline/testing environments.
   */
  static async getEmbedding(text: string): Promise<number[]> {
    if (
      env.LLM_API_KEY &&
      env.LLM_API_KEY.startsWith("sk-") &&
      !env.LLM_API_KEY.includes("...")
    ) {
      try {
        const res = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.LLM_API_KEY}`,
          },
          body: JSON.stringify({
            model: env.EMBEDDING_MODEL || "text-embedding-3-small",
            input: text.replace(/\n+/g, " "),
          }),
          signal: AbortSignal.timeout(10_000),
        });

        if (res.ok) {
          const json = (await res.json()) as any;
          const vector = json.data?.[0]?.embedding;
          if (Array.isArray(vector) && vector.length === 1536) {
            return vector;
          }
        }
      } catch (err) {
        console.warn("Embedding API call failed, using mock embedding:", err);
      }
    }

    // Deterministic offline pseudo-embedding: 1536 dimensions
    return this.generateDeterministicVector(text);
  }

  private static generateDeterministicVector(text: string): number[] {
    const vector = new Array(1536).fill(0);
    const clean = text.toLowerCase();

    for (let i = 0; i < clean.length; i++) {
      const code = clean.charCodeAt(i);
      const index = (code * 31 + i) % 1536;
      vector[index] = (vector[index] || 0) + 0.05;
    }

    // Normalize to unit vector
    let norm = 0;
    for (let i = 0; i < 1536; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm) || 1;

    for (let i = 0; i < 1536; i++) {
      vector[i] = Number((vector[i] / norm).toFixed(6));
    }

    return vector;
  }
}
