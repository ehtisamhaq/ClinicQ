import { describe, it, expect } from "bun:test";
import { chunkDocument } from "../knowledge.chunker";
import { EmbeddingService } from "../embedding.service";
import {
  createKnowledgeDocSchema,
  searchKnowledgeSchema,
} from "../knowledge.validation";

describe("Knowledge Module Tests", () => {
  describe("Document Chunker", () => {
    it("should return single chunk with title for short document", () => {
      const title = "Clinic Timings";
      const body = "We are open Sunday through Thursday from 8 AM to 8 PM.";
      const chunks = chunkDocument(title, body, 100, 20);

      expect(chunks.length).toBe(1);
      expect(chunks[0]!.includes(title)).toBe(true);
      expect(chunks[0]!.includes(body)).toBe(true);
    });

    it("should split long multi-paragraph documents into multiple chunks with overlap", () => {
      const title = "Services Guide";
      const paragraphs = [
        "Cardiology department provides ECG, Echocardiogram, and 24-hour Holter monitoring for all patients with cardiac concerns.",
        "Pediatrics department focuses on neonatal wellness, routine government immunizations, and developmental growth milestone assessments.",
        "General Medicine treats seasonal flu, viral fevers, diabetes, hypertension, and routine medical checkups.",
      ];
      const body = paragraphs.join("\n\n");

      // Set low max words to force splitting
      const chunks = chunkDocument(title, body, 15, 5);

      expect(chunks.length).toBeGreaterThanOrEqual(2);
      for (const chunk of chunks) {
        expect(chunk.startsWith(title)).toBe(true);
      }
    });

    it("should handle empty or whitespace body gracefully", () => {
      const chunks = chunkDocument("Empty Doc", "   ");
      expect(chunks.length).toBe(0);
    });
  });

  describe("Embedding Service", () => {
    it("should generate a 1536-dimensional vector", async () => {
      const vector = await EmbeddingService.getEmbedding("Cardiology services and consultation fee");
      expect(Array.isArray(vector)).toBe(true);
      expect(vector.length).toBe(1536);
    });

    it("should generate normalized unit vectors (magnitude approx 1.0)", async () => {
      const vector = await EmbeddingService.getEmbedding("Pediatric vaccination schedule");
      let sumSquares = 0;
      for (const val of vector) {
        sumSquares += val * val;
      }
      const magnitude = Math.sqrt(sumSquares);
      expect(Math.abs(magnitude - 1.0)).toBeLessThan(0.01);
    });
  });

  describe("Knowledge Validation Schemas", () => {
    it("should validate correct knowledge doc payload", () => {
      const valid = {
        title: "Refund Policy",
        body: "Patients can request a full refund if appointment is cancelled 2 hours prior.",
        category: "policies",
      };
      expect(createKnowledgeDocSchema.body.safeParse(valid).success).toBe(true);
    });

    it("should reject short title or short body", () => {
      const invalid = {
        title: "Hi",
        body: "Short",
        category: "policies",
      };
      expect(createKnowledgeDocSchema.body.safeParse(invalid).success).toBe(false);
    });

    it("should validate search schema", () => {
      expect(searchKnowledgeSchema.body.safeParse({ query: "Cardiology" }).success).toBe(true);
      expect(searchKnowledgeSchema.body.safeParse({ query: "" }).success).toBe(false);
    });
  });
});
