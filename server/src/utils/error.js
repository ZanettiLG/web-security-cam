class HttpError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends HttpError {
  constructor(message = 'Validation error') {
    super(message, 400);
  }
}

class RequiredError extends HttpError {
  constructor(message = 'Required error') {
    super(message, 400);
  }
}

class NotFoundError extends HttpError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class BadRequestError extends HttpError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

class ConflictError extends HttpError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

class InternalServerError extends HttpError {
  constructor(message = 'Internal server error') {
    super(message, 500);
  }
}

module.exports = {
  HttpError,
  RequiredError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
  ValidationError,
  BadRequestError,
  UnauthorizedError,
  InternalServerError,
};