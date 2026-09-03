import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: "Validation failed.",
      details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }
  // Never leak internal diagnostics or stack traces to the client.
  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ error: "Unable to process the request." });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Resource not found." });
}
