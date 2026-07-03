import catalyst from "zcatalyst-sdk-node";
import { Request } from "express";

// ─── Catalyst / Express Extensions ───────────────────────────────────────────

export interface AuthenticatedRequest extends Request {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catalystUser?: any;
}

// ─── API Response Shapes ──────────────────────────────────────────────────────

export interface ApiSuccessResponse<T = unknown> {
  message: string;
  data?: T;
}

export interface ApiErrorResponse {
  error: string;
}

// ─── Todo Shapes (matches Mongoose schema) ────────────────────────────────────

export interface TodoBody {
  title: string;
  description?: string;
  completed?: boolean;
}

export interface TodoUpdateBody {
  title?: string;
  description?: string;
  completed?: boolean;
}

// keep catalyst imported so ReturnType resolves (used only in middleware inline)
type _CatalystRef = typeof catalyst;
export type { _CatalystRef };
