export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(opts: { message: string; status: number; code: string; details?: unknown }) {
    super(opts.message);
    this.status = opts.status;
    this.code = opts.code;
    this.details = opts.details;
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super({ message, status: 400, code: "BAD_REQUEST", details });
  }
}