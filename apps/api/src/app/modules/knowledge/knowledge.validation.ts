import { z } from "zod";

export const createKnowledgeDocSchema = {
  body: z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    body: z.string().min(10, "Body must be at least 10 characters"),
    category: z.string().min(2, "Category is required"),
  }),
};

export const updateKnowledgeDocSchema = {
  params: z.object({
    id: z.string().min(1, "Document ID is required"),
  }),
  body: z.object({
    title: z.string().min(3).optional(),
    body: z.string().min(10).optional(),
    category: z.string().min(2).optional(),
  }),
};

export const knowledgeIdParamSchema = {
  params: z.object({
    id: z.string().min(1, "Document ID is required"),
  }),
};

export const searchKnowledgeSchema = {
  body: z.object({
    query: z.string().min(1, "Search query is required"),
    limit: z.coerce.number().int().positive().max(10).default(3),
  }),
};

export const listKnowledgeQuerySchema = {
  query: z.object({
    category: z.string().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
  }),
};

export type CreateKnowledgeDocInput = z.infer<typeof createKnowledgeDocSchema.body>;
export type UpdateKnowledgeDocInput = z.infer<typeof updateKnowledgeDocSchema.body>;
export type SearchKnowledgeInput = z.infer<typeof searchKnowledgeSchema.body>;
export type ListKnowledgeQuery = z.infer<typeof listKnowledgeQuerySchema.query>;
