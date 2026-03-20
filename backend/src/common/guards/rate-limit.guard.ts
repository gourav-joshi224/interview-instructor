import { CanActivate, ExecutionContext, Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly windowMs = 60_000;
  private readonly maxRequests = 60;
  private readonly buckets = new Map<string, { count: number; windowStart: number }>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip ?? request.connection?.remoteAddress ?? 'unknown';
    const now = Date.now();
    const existing = this.buckets.get(ip);

    if (!existing || now - existing.windowStart >= this.windowMs) {
      this.buckets.set(ip, { count: 1, windowStart: now });
      return true;
    }

    existing.count += 1;
    if (existing.count > this.maxRequests) {
      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}
