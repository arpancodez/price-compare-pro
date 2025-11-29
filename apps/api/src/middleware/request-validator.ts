import { Request } from 'express';
import { z } from 'zod';

const searchQuerySchema = z.object({
  query: z.string().min(1).max(100),
  location: z.string().optional(),
  limit: z.number().optional(),
});

export class RequestValidator {
  validate(req: Request) {
    try {
      const data = { ...req.query, ...req.body };
      const result = searchQuerySchema.safeParse(data);
      return {
        valid: result.success,
        errors: result.error?.errors || [],
      };
    } catch (error) {
      return { valid: false, errors: [error] };
    }
  }
}
