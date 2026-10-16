import type { Request, Response } from "express";
import prisma from "../../../lib/prisma";
import { AppError } from "../../errors/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { Role } from "../../../generated/prisma/client";
import { AgentEngine } from "./engine/agent.engine";
import type { ChatMessage, SseEvent } from "./types";

export class AssistantController {
  static chat = catchAsync(async (req: Request, res: Response) => {
    const actor = req.user!;
    const { messages, locale } = req.body as { messages: ChatMessage[]; locale?: string };

    let patientId = req.body.patientId;
    if (actor.role === Role.PATIENT) {
      const patientProfile = await prisma.patientProfile.findUnique({
        where: { userId: actor.id },
      });
      if (!patientProfile) {
        throw new AppError(404, "Patient profile not found");
      }
      patientId = patientProfile.id;
    } else {
      if (!patientId) {
        // Fallback for staff testing or walk-in: first patient in clinic
        const fallback = await prisma.patientProfile.findFirst({
          where: { user: { clinicId: actor.clinicId } },
        });
        patientId = fallback?.id || actor.id;
      }
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const sendSse = (event: SseEvent) => {
      res.write(`event: ${event.event}\n`);
      res.write(`data: ${JSON.stringify(event.data)}\n\n`);
    };

    const engine = new AgentEngine({
      messages,
      context: {
        userId: actor.id,
        patientId,
        clinicId: actor.clinicId,
        role: actor.role,
      },
      locale,
      onEvent: (event) => {
        sendSse(event);
        if (event.event === "done") {
          res.end();
        }
      },
    });

    await engine.run();
  });

  static getTraces = catchAsync(async (req: Request, res: Response) => {
    const clinicId = req.user!.clinicId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { clinicId };
    if (req.query.patientId) where.patientId = req.query.patientId;
    if (req.query.outcome) where.outcome = req.query.outcome;

    const [total, traces] = await Promise.all([
      prisma.assistantTrace.count({ where }),
      prisma.assistantTrace.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Assistant traces retrieved successfully",
      data: traces,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });

  static getTraceById = catchAsync(async (req: Request, res: Response) => {
    const actor = req.user!;
    const id = req.params.id as string;

    const trace = await prisma.assistantTrace.findUnique({
      where: { id },
    });

    if (!trace) {
      throw new AppError(404, "Assistant trace not found");
    }

    if (trace.clinicId !== actor.clinicId) {
      throw new AppError(403, "Trace belongs to another clinic");
    }

    if (actor.role === Role.PATIENT) {
      const patientProfile = await prisma.patientProfile.findUnique({
        where: { userId: actor.id },
      });
      if (trace.patientId !== patientProfile?.id) {
        throw new AppError(403, "You can only view your own traces");
      }
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Assistant trace retrieved successfully",
      data: trace,
    });
  });
}
