import prisma from "../../../lib/prisma";
import { AppError } from "../../errors/AppError";
import { chunkDocument } from "./knowledge.chunker";
import { EmbeddingService } from "./embedding.service";
import type {
  CreateKnowledgeDocInput,
  ListKnowledgeQuery,
  UpdateKnowledgeDocInput,
} from "./knowledge.validation";

export class KnowledgeService {
  static async createDoc(data: CreateKnowledgeDocInput, clinicId: string) {
    const doc = await prisma.$transaction(async (tx) => {
      const created = await tx.knowledgeDoc.create({
        data: {
          clinicId,
          title: data.title,
          body: data.body,
          category: data.category.toLowerCase(),
        },
      });

      const chunks = chunkDocument(data.title, data.body);
      if (chunks.length > 0) {
        for (const content of chunks) {
          const chunk = await tx.knowledgeChunk.create({
            data: {
              docId: created.id,
              content,
            },
          });
          try {
            const vector = await EmbeddingService.getEmbedding(content);
            const vectorString = `[${vector.join(",")}]`;
            await tx.$executeRaw`
              UPDATE "KnowledgeChunk"
              SET embedding = ${vectorString}::vector
              WHERE id = ${chunk.id}
            `;
          } catch {
            // Gracefully ignore if pgvector is not available in current db engine
          }
        }
      }

      return tx.knowledgeDoc.findUnique({
        where: { id: created.id },
        include: { chunks: true },
      });
    });

    return doc!;
  }

  static async getDocs(
    clinicId: string,
    query: ListKnowledgeQuery = { page: 1, limit: 20 },
  ) {
    const { category, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { clinicId };

    if (category) {
      where.category = { equals: category.toLowerCase(), mode: "insensitive" };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, docs] = await Promise.all([
      prisma.knowledgeDoc.count({ where }),
      prisma.knowledgeDoc.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          _count: {
            select: { chunks: true },
          },
        },
      }),
    ]);

    return {
      docs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getDocById(id: string, clinicId: string) {
    const doc = await prisma.knowledgeDoc.findUnique({
      where: { id },
      include: { chunks: true },
    });

    if (!doc || doc.clinicId !== clinicId) {
      throw new AppError(404, "Knowledge document not found");
    }

    return doc;
  }

  static async updateDoc(
    id: string,
    data: UpdateKnowledgeDocInput,
    clinicId: string,
  ) {
    const existing = await this.getDocById(id, clinicId);

    const updated = await prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.body !== undefined) updateData.body = data.body;
      if (data.category !== undefined) updateData.category = data.category.toLowerCase();

      const doc = await tx.knowledgeDoc.update({
        where: { id },
        data: updateData,
      });

      // If body or title was modified, regenerate chunks with embeddings
      if (data.body !== undefined || data.title !== undefined) {
        await tx.knowledgeChunk.deleteMany({
          where: { docId: id },
        });

        const newTitle = data.title || existing.title;
        const newBody = data.body || existing.body;
        const chunks = chunkDocument(newTitle, newBody);

        if (chunks.length > 0) {
          for (const content of chunks) {
            const chunk = await tx.knowledgeChunk.create({
              data: {
                docId: id,
                content,
              },
            });
            try {
              const vector = await EmbeddingService.getEmbedding(content);
              const vectorString = `[${vector.join(",")}]`;
              await tx.$executeRaw`
                UPDATE "KnowledgeChunk"
                SET embedding = ${vectorString}::vector
                WHERE id = ${chunk.id}
              `;
            } catch {
              // Gracefully ignore if pgvector is not available
            }
          }
        }
      }

      return tx.knowledgeDoc.findUnique({
        where: { id },
        include: { chunks: true },
      });
    });

    return updated!;
  }

  static async deleteDoc(id: string, clinicId: string) {
    await this.getDocById(id, clinicId);
    await prisma.knowledgeDoc.delete({
      where: { id },
    });
  }

  /**
   * Scoped RAG retrieval: searches clinic knowledge base with pgvector cosine
   * similarity when embeddings exist, falling back to ILIKE keyword search.
   * Cites source title and category. Returns 'I do not have that information' if unfound.
   */
  static async search(queryText: string, clinicId: string, limit = 3) {
    const cleanQuery = queryText.trim();
    if (!cleanQuery) {
      return {
        found: false,
        message: "I do not have that information",
        results: [],
      };
    }

    // 1. Semantic pgvector search when available
    try {
      const queryVector = await EmbeddingService.getEmbedding(cleanQuery);
      const vectorString = `[${queryVector.join(",")}]`;

      const vectorResults = await prisma.$queryRaw<
        Array<{
          id: string;
          content: string;
          sourceTitle: string;
          category: string;
          distance: number;
        }>
      >`
        SELECT c.id, c.content, d.title as "sourceTitle", d.category,
               (c.embedding <=> ${vectorString}::vector) as distance
        FROM "KnowledgeChunk" c
        JOIN "KnowledgeDoc" d ON c."docId" = d.id
        WHERE d."clinicId" = ${clinicId} AND c.embedding IS NOT NULL
        ORDER BY distance ASC
        LIMIT ${limit}
      `;

      const matches = vectorResults.filter((r) => r.distance < 0.65);
      if (matches.length > 0) {
        return {
          found: true,
          message: `Found ${matches.length} relevant clinic resources`,
          results: matches.map((m) => ({
            sourceTitle: m.sourceTitle,
            category: m.category,
            content: m.content,
          })),
        };
      }
    } catch {
      // Fallback to keyword search below
    }

    // 2. Keyword fallback search over clinic chunks
    const chunks = await prisma.knowledgeChunk.findMany({
      where: {
        doc: { clinicId },
        OR: [
          { content: { contains: cleanQuery, mode: "insensitive" } },
          { doc: { title: { contains: cleanQuery, mode: "insensitive" } } },
          { doc: { category: { contains: cleanQuery, mode: "insensitive" } } },
        ],
      },
      take: limit,
      include: {
        doc: {
          select: { title: true, category: true },
        },
      },
    });

    if (chunks.length === 0) {
      return {
        found: false,
        message: "I do not have that information",
        results: [],
      };
    }

    return {
      found: true,
      message: `Found ${chunks.length} relevant clinic resources`,
      results: chunks.map((c) => ({
        sourceTitle: c.doc.title,
        category: c.doc.category,
        content: c.content,
      })),
    };
  }
}
