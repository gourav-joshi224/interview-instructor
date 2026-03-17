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

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Keep frontend response safe and stable. Internal details are only logged.
    this.logger.error('Unhandled request error', exception instanceof Error ? exception.stack : undefined);

    response.status(status).json({
      error: status >= 500 ? 'Internal server error.' : 'Request failed.',
    });
  }
}
