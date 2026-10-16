import type { ZodSchema } from "zod";
import type { LlmClient } from "./llm.interface";
import { MockLlmClient } from "./mock.client";
import { env } from "../../../config/env";

export class OpenAiClient implements LlmClient {
  private apiKey: string;
  private model: string;
  private fallback: MockLlmClient;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || env.LLM_API_KEY || "";
    this.model = model || env.LLM_MODEL || "gpt-4o-mini";
    this.fallback = new MockLlmClient();
  }

  async generateCompletion(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.apiKey || this.apiKey.includes("...") || !this.apiKey.startsWith("sk-")) {
      return this.fallback.generateCompletion(prompt, systemPrompt);
    }

    try {
      const messages = [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        { role: "user", content: prompt },
      ];

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.2,
          max_tokens: 500,
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) {
        console.warn(`OpenAI completion failed with status ${res.status}. Falling back.`);
        return this.fallback.generateCompletion(prompt, systemPrompt);
      }

      const json = (await res.json()) as any;
      return json.choices?.[0]?.message?.content || "";
    } catch (err) {
      console.warn("OpenAI completion request error:", err);
      return this.fallback.generateCompletion(prompt, systemPrompt);
    }
  }

  async generateStructured<T>(
    prompt: string,
    schema: ZodSchema<T>,
    systemPrompt?: string,
  ): Promise<T> {
    if (!this.apiKey || this.apiKey.includes("...") || !this.apiKey.startsWith("sk-")) {
      return this.fallback.generateStructured(prompt, schema, systemPrompt);
    }

    try {
      const enhancedSystem = `${systemPrompt || ""}\nYou MUST respond ONLY with valid JSON conforming to the requested schema. Do not include markdown codeblocks.`;

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: enhancedSystem },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
          max_tokens: 800,
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) {
        console.warn(`OpenAI structured failed with ${res.status}. Using fallback.`);
        return this.fallback.generateStructured(prompt, schema, systemPrompt);
      }

      const json = (await res.json()) as any;
      const rawText = json.choices?.[0]?.message?.content || "{}";
      const parsedJson = JSON.parse(rawText);

      const validated = schema.safeParse(parsedJson);
      if (validated.success) {
        return validated.data;
      }

      // One repair retry if validation failed
      console.warn("JSON did not match schema. Attempting one repair attempt...");
      const repairRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: enhancedSystem },
            { role: "user", content: prompt },
            { role: "assistant", content: rawText },
            {
              role: "user",
              content: `Your previous JSON failed schema validation with issues: ${JSON.stringify(validated.error.issues)}. Please fix and output valid JSON only.`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (repairRes.ok) {
        const repairJson = (await repairRes.json()) as any;
        const repairedText = repairJson.choices?.[0]?.message?.content || "{}";
        const repairedParsed = schema.safeParse(JSON.parse(repairedText));
        if (repairedParsed.success) {
          return repairedParsed.data;
        }
      }

      // Graceful fallback to Mock client
      return this.fallback.generateStructured(prompt, schema, systemPrompt);
    } catch (err) {
      console.warn("OpenAI structured request failed:", err);
      return this.fallback.generateStructured(prompt, schema, systemPrompt);
    }
  }
}
