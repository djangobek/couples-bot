export class ApiError extends Error {
    code;
    statusCode;
    constructor(code, message, statusCode) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = "ApiError";
    }
}
export function isApiError(error) {
    return error instanceof ApiError;
}
