export class AuthorizationError extends Error {
  readonly statusCode: number;

  constructor(message = "Unauthorized", statusCode = 401) {
    super(message);
    this.name = "AuthorizationError";
    this.statusCode = statusCode;
  }
}
