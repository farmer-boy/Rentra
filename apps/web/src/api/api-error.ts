import axios from 'axios';

export type ApiFieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly fieldErrors?: ApiFieldErrors;

  constructor(input: {
    message: string;
    status?: number;
    code?: string;
    fieldErrors?: ApiFieldErrors;
  }) {
    super(input.message);
    this.name = 'ApiError';
    this.status = input.status;
    this.code = input.code;
    this.fieldErrors = input.fieldErrors;
  }
}

export const getApiErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof ApiError ? error.message : fallback;

const validationFieldErrors = (message: unknown): ApiFieldErrors | undefined => {
  if (!Array.isArray(message)) return undefined;
  const fields: ApiFieldErrors = {};
  for (const issue of message) {
    if (
      issue &&
      typeof issue === 'object' &&
      'property' in issue &&
      typeof issue.property === 'string' &&
      'constraints' in issue &&
      issue.constraints &&
      typeof issue.constraints === 'object'
    ) {
      fields[issue.property] = Object.values(
        issue.constraints as Record<string, string>,
      );
    }
  }
  return Object.keys(fields).length ? fields : undefined;
};

const validationMessages = (message: unknown): string[] => {
  if (!Array.isArray(message)) return [];
  return message.flatMap((issue) => {
    if (!issue || typeof issue !== 'object') return [];
    if ('constraints' in issue && issue.constraints && typeof issue.constraints === 'object') {
      return Object.values(issue.constraints as Record<string, unknown>).filter(
        (value): value is string => typeof value === 'string',
      );
    }
    return 'property' in issue && typeof issue.property === 'string'
      ? [`${issue.property} is invalid`]
      : [];
  });
};

export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error;
  if (error instanceof Error && !axios.isAxiosError(error)) {
    return new ApiError({ message: error.message });
  }
  if (!axios.isAxiosError(error)) {
    return new ApiError({ message: 'An unexpected error occurred.' });
  }

  const status = error.response?.status;
  const data = error.response?.data as
    | { message?: unknown; error?: string; code?: string }
    | undefined;
  const backendMessage = data?.message;
  const validationErrors = validationMessages(backendMessage);
  const message =
    typeof backendMessage === 'string'
      ? backendMessage
      : Array.isArray(backendMessage)
        ? validationErrors.join(', ') ||
          'Some submitted fields are invalid. Check the form and try again.'
        : error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
          ? 'The request timed out. Please try again.'
          : !error.response
            ? 'Unable to reach Rentra. Check your connection and try again.'
            : status === 401
              ? 'Please sign in to continue.'
              : status === 403
                ? 'You do not have permission to perform this action.'
                : status === 404
                  ? 'The requested item could not be found.'
                  : status === 429
                    ? 'Too many requests. Please wait and try again.'
                    : status && status >= 500
                      ? 'Rentra is temporarily unavailable. Please try again.'
                      : 'The request could not be completed.';

  return new ApiError({
    status,
    message,
    code: data?.code ?? data?.error,
    fieldErrors: validationFieldErrors(backendMessage),
  });
};
