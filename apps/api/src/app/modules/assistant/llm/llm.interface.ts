import type { ZodSchema } from "zod";

export interface LlmClient {
  generateCompletion(prompt: string, systemPrompt?: string): Promise<string>;
  generateStructured<T>(prompt: string, schema: ZodSchema<T>, systemPrompt?: string): Promise<T>;
}
