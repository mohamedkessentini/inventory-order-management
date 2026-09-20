export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly fieldErrors?: FieldError[],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static notFound(entity: string, id: string): ApiError {
    return new ApiError(404, `${entity} not found with id: ${id}`);
  }

  static badRequest(message: string, fieldErrors?: FieldError[]): ApiError {
    return new ApiError(400, message, fieldErrors);
  }

  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Not allowed to access this resource'): ApiError {
    return new ApiError(403, message);
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, message);
  }

  static unprocessable(message: string): ApiError {
    return new ApiError(422, message);
  }
}
