import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse();
    const request = context.getRequest();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const errorMessage = exception instanceof Error ? exception.message : 'Unknown error';

    const logContext = `${request.method ?? 'UNKNOWN'} ${request.url ?? ''}`;
    if (status >= 500) {
      if (exception instanceof Error) {
        this.logger.error(exception.message, exception.stack);
      } else {
        this.logger.error(`Request failed ${logContext} -> ${status} ${errorMessage}`);
      }
    } else {
      this.logger.warn(`Request failed ${logContext} -> ${status} ${errorMessage}`);
    }

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      const body =
        typeof exceptionResponse === 'object'
          ? exceptionResponse
          : { error: exceptionResponse, statusCode: exception.getStatus() };

      response.status(status).json({
        ...body,
        statusCode: exception.getStatus(),
        timestamp: new Date().toISOString(),
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'INTERNAL_ERROR',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
    });
  }
}
