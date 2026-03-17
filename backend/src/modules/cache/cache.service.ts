import { Injectable } from '@nestjs/common';

@Injectable()
export class CacheService {
  // Placeholder hook for Redis/in-memory cache integration.
  async get<T>(_key: string): Promise<T | null> {
    return null;
  }

  // Placeholder hook for caching AI responses.
  async set<T>(_key: string, _value: T, _ttlSeconds = 300): Promise<void> {
    return;
  }
}
