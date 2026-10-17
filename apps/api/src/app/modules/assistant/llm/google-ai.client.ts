import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Output, generateText } from "ai";
import type { ZodSchema } from "zod";
import type { LlmClient } from "./llm.interface";
import { MockLlmClient } from "./mock.client";
import { env } from "../../../config/env";

export class GoogleAiClient implements LlmClient {
  private google: ReturnType<typeof createGoogleGenerativeAI>;
  private modelName: string;
  private fallback: MockLlmClient;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey || env.LLM_API_KEY || "";
    this.google = createGoogleGenerativeAI({
      apiKey: key,
    });
    this.modelName = model || env.LLM_MODEL || "gemini-2.0-flash";
    this.fallback = new MockLlmClient();
  }

  async generateCompletion(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const res = await generateText({
        model: this.google(this.modelName),
        ...(systemPrompt ? { system: systemPrompt } : {}),
        prompt,
        temperature: 0.2,
      });
      return res.text;
    } catch (err) {
      console.warn("Google AI SDK completion failed, falling back to mock:", err);
      return this.fallback.generateCompletion(prompt, systemPrompt);
    }
  }

  async generateStructured<T>(
    prompt: string,
    schema: ZodSchema<T>,
    systemPrompt?: string,
  ): Promise<T> {
    try {
      if (!schema || typeof schema.safeParse !== "function") {
        const text = await this.generateCompletion(prompt, systemPrompt);
        return JSON.parse(text) as T;
      }

      const res = await generateText({
        model: this.google(this.modelName),
        ...(systemPrompt ? { system: systemPrompt } : {}),
        prompt,
        output: Output.object({ schema }),
        temperature: 0.1,
      });

      return res.output as T;
    } catch (err) {
      console.warn("Google AI SDK structured call failed, falling back to mock:", err);
      return this.fallback.generateStructured(prompt, schema, systemPrompt);
    }
  }
}
