import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const msg = (exceptionResponse as any).message;
        if (msg) {
          message = msg;
        }
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      // TypeORM or generic Database errors
      const err = exception as any;
      if (err.code === 'SQLITE_CONSTRAINT' || err.code === '23505') {
        status = HttpStatus.CONFLICT;
        message = 'Resource already exists or violates unique constraint';
      } else {
        message = exception.message;
      }
    }

    // Format error message to be an array or string consistently
    const responseMessage = Array.isArray(message)
      ? message.join(', ')
      : message;

    response.status(status).json({
      success: false,
      statusCode: status,
      message: responseMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
