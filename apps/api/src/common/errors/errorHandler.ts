import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { AppError, ValidationError } from './customErrors.js';

// Типы для внешних ошибок без публичных конструкторов
interface PrismaKnownError extends Error {
  code: string;
  meta?: { target?: string[] };
}

interface ZodLikeError extends Error {
  errors?: Array<{ path?: (string | number)[]; message: string }>;
}

export const errorHandler = (
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    request.log.error(error);
  }

  // Handle AppError instances
  if (error instanceof AppError) {
    const response: Record<string, unknown> = {
      code: error.code,
      message: error.message,
    };

    if (error instanceof ValidationError && error.errors.length > 0) {
      response.errors = error.errors;
    }

    return reply.status(error.statusCode).send(response);
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as PrismaKnownError;
    
    // P2002 - Unique constraint violation
    if (prismaError.code === 'P2002') {
      return reply.status(409).send({
        code: 'DUPLICATE_ENTRY',
        message: 'Resource already exists',
        field: prismaError.meta?.target,
      });
    }

    // P2025 - Record not found
    if (prismaError.code === 'P2025') {
      return reply.status(404).send({
        code: 'NOT_FOUND',
        message: 'Resource not found',
      });
    }

    // P2003 - Foreign key constraint failed
    if (prismaError.code === 'P2003') {
      return reply.status(400).send({
        code: 'FOREIGN_KEY_VIOLATION',
        message: 'Referenced resource does not exist',
      });
    }
  }

  // Handle Zod validation errors from fastify-type-provider-zod
  if (error.name === 'ZodError') {
    const zodError = error as ZodLikeError;
    return reply.status(400).send({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      errors: zodError.errors?.map((e) => ({
        field: e.path?.join('.'),
        message: e.message,
      })),
    });
  }

  // Default error response
  const statusCode = (error as FastifyError).statusCode || 500;
  
  return reply.status(statusCode).send({
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};
