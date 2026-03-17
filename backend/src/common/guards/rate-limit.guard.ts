import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class RateLimitGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    // Placeholder for future throttling integration.
    return true;
  }
}
