import type { LlmClient } from "./llm.interface";
import { OpenAiClient } from "./openai.client";
import { MockLlmClient } from "./mock.client";
import { env } from "../../../config/env";

export class LlmFactory {
  private static instance: LlmClient | null = null;

  static getClient(): LlmClient {
    if (this.instance) {
      return this.instance;
    }
    if (process.env.NODE_ENV === "test") {
      return new MockLlmClient();
    }
    const apiKey = env.LLM_API_KEY || "";
    const isConfigured = Boolean(apiKey && !apiKey.includes("...") && apiKey.length > 10);
    if (isConfigured) {
      this.instance = new OpenAiClient();
    } else {
      this.instance = new MockLlmClient();
    }
    return this.instance;
  }

  static setClient(client: LlmClient): void {
    this.instance = client;
  }

  static reset(): void {
    this.instance = null;
  }
}
