import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  // TODO: replace with JWT guard when user auth is implemented
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const providedKey = request.headers['x-api-key'] as string | undefined;
    const valid = process.env.INTERNAL_API_KEY;

    if (!valid) return true; // dev mode passthrough
    if (providedKey !== valid) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
