import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, message, error } = this.mapException(exception);

    const body: ErrorResponse = {
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log completo apenas em não-produção ou para erros 5xx
    if (statusCode >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`[${request.method}] ${request.url} → ${statusCode}: ${message}`);
    }

    response.status(statusCode).json(body);
  }

  private mapException(exception: unknown): {
    statusCode: number;
    message: string | string[];
    error: string;
  } {
    // NestJS HTTP exceptions
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const message =
        typeof res === 'object' && 'message' in res
          ? (res as { message: string | string[] }).message
          : exception.message;
      return {
        statusCode: exception.getStatus(),
        message,
        error: exception.constructor.name,
      };
    }

    // Prisma: registro não encontrado
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2025') {
        return { statusCode: 404, message: 'Recurso não encontrado', error: 'NotFound' };
      }
      if (exception.code === 'P2002') {
        return { statusCode: 409, message: 'Conflito: dado já existe', error: 'Conflict' };
      }
      return { statusCode: 400, message: 'Erro de banco de dados', error: 'DatabaseError' };
    }

    // Erros desconhecidos → 500 (sem vazar detalhes em produção)
    const isProd = process.env.NODE_ENV === 'production';
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: isProd ? 'Erro interno do servidor' : String(exception),
      error: 'InternalServerError',
    };
  }
}
