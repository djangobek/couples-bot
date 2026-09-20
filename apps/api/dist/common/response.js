export function success(data) {
    return { success: true, data };
}
export function failure(code, message, requestId) {
    return {
        success: false,
        error: {
            code,
            message,
            ...(requestId ? { requestId } : {}),
        },
    };
}
