import type { ZodSchema } from "zod";
import type { LlmClient } from "./llm.interface";
import { MockLlmClient } from "./mock.client";
import { env } from "../../../config/env";

export class OpenAiClient implements LlmClient {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private fallback: MockLlmClient;

  constructor(apiKey?: string, model?: string, baseUrl?: string) {
    this.apiKey = apiKey || env.LLM_API_KEY || "";
    this.model = model || env.LLM_MODEL || "gpt-4o-mini";
    const isGoogle =
      this.apiKey.startsWith("AQ.") ||
      this.apiKey.startsWith("AIza") ||
      env.LLM_PROVIDER === "google" ||
      env.LLM_PROVIDER === "gemini";
    const rawBaseUrl =
      baseUrl ||
      env.LLM_BASE_URL ||
      (isGoogle ? "https://generativelanguage.googleapis.com/v1beta/openai" : "https://api.openai.com/v1");
    this.baseUrl = rawBaseUrl.replace(/\/+$/, "");
    this.fallback = new MockLlmClient();
  }

  private isValidApiKey(): boolean {
    return Boolean(this.apiKey && !this.apiKey.includes("...") && this.apiKey.length > 10);
  }

  async generateCompletion(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.isValidApiKey()) {
      return this.fallback.generateCompletion(prompt, systemPrompt);
    }

    try {
      const messages = [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        { role: "user", content: prompt },
      ];

      const res = await fetch(`${this.baseUrl}/chat/completions`, {
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
        console.warn(`LLM completion failed with status ${res.status}. Falling back.`);
        return this.fallback.generateCompletion(prompt, systemPrompt);
      }

      const json = (await res.json()) as any;
      return json.choices?.[0]?.message?.content || "";
    } catch (err) {
      console.warn("LLM completion request error:", err);
      return this.fallback.generateCompletion(prompt, systemPrompt);
    }
  }

  async generateStructured<T>(
    prompt: string,
    schema: ZodSchema<T>,
    systemPrompt?: string,
  ): Promise<T> {
    if (!this.isValidApiKey()) {
      return this.fallback.generateStructured(prompt, schema, systemPrompt);
    }

    try {
      const enhancedSystem = `${systemPrompt || ""}\nYou MUST respond ONLY with valid JSON conforming to the requested schema. Do not include markdown codeblocks.`;

      const res = await fetch(`${this.baseUrl}/chat/completions`, {
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
        console.warn(`LLM structured call failed with ${res.status}. Using fallback.`);
        return this.fallback.generateStructured(prompt, schema, systemPrompt);
      }

      const json = (await res.json()) as any;
      const rawText = json.choices?.[0]?.message?.content || "{}";
      const parsedJson = JSON.parse(rawText);

      if (!schema || typeof schema.safeParse !== "function") {
        return parsedJson as T;
      }

      const validated = schema.safeParse(parsedJson);
      if (validated.success) {
        return validated.data;
      }

      // One repair retry if validation failed
      console.warn("JSON did not match schema. Attempting one repair attempt...");
      const repairRes = await fetch(`${this.baseUrl}/chat/completions`, {
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
      console.warn("LLM structured request failed:", err);
      return this.fallback.generateStructured(prompt, schema, systemPrompt);
    }
  }
}
