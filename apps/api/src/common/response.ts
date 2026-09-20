export function success<T>(data: T) {
  return { success: true as const, data };
}

export function failure(code: string, message: string, requestId?: string) {
  return {
    success: false as const,
    error: {
      code,
      message,
      ...(requestId ? { requestId } : {}),
    },
  };
}
