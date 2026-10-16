import { z } from "zod";

export const bookManualInputSchema = z.object({
  slotId: z.string().min(1, "Please select an available slot"),
  reason: z.string().min(3, "Please describe the reason for your visit (min 3 characters)"),
  doctorId: z.string().optional(),
  dateString: z.string().optional(),
});

export type BookManualInput = z.infer<typeof bookManualInputSchema>;
