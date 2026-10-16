import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { KnowledgeService } from "./knowledge.service";

export class KnowledgeController {
  static createDoc = catchAsync(async (req: Request, res: Response) => {
    const clinicId = req.user!.clinicId;
    const doc = await KnowledgeService.createDoc(req.body, clinicId);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Knowledge document created successfully",
      data: doc,
    });
  });

  static getDocs = catchAsync(async (req: Request, res: Response) => {
    const clinicId = req.user!.clinicId;
    const result = await KnowledgeService.getDocs(clinicId, req.query as any);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Knowledge documents retrieved successfully",
      data: result.docs,
      meta: result.meta,
    });
  });

  static getDocById = catchAsync(async (req: Request, res: Response) => {
    const clinicId = req.user!.clinicId;
    const id = req.params.id as string;
    const doc = await KnowledgeService.getDocById(id, clinicId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Knowledge document retrieved successfully",
      data: doc,
    });
  });

  static updateDoc = catchAsync(async (req: Request, res: Response) => {
    const clinicId = req.user!.clinicId;
    const id = req.params.id as string;
    const doc = await KnowledgeService.updateDoc(id, req.body, clinicId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Knowledge document updated successfully",
      data: doc,
    });
  });

  static deleteDoc = catchAsync(async (req: Request, res: Response) => {
    const clinicId = req.user!.clinicId;
    const id = req.params.id as string;
    await KnowledgeService.deleteDoc(id, clinicId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Knowledge document deleted successfully",
    });
  });

  static search = catchAsync(async (req: Request, res: Response) => {
    const clinicId = req.user?.clinicId || (req.body.clinicId as string | undefined);
    if (!clinicId) {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "clinicId is required for knowledge search",
      });
      return;
    }

    const { query, limit = 3 } = req.body;
    const result = await KnowledgeService.search(query, clinicId, limit);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: result.message,
      data: result,
    });
  });
}
