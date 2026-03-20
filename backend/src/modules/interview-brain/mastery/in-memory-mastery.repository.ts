import { Injectable } from '@nestjs/common';
import { MasteryRepository, UserConceptMastery } from './mastery-updater.types';

@Injectable()
export class InMemoryMasteryRepository implements MasteryRepository {
  private store = new Map<string, UserConceptMastery>();

  async getByUserAndConceptIds(userId: string, conceptIds: string[]): Promise<UserConceptMastery[]> {
    return conceptIds
      .map((conceptId) => this.store.get(this.key(userId, conceptId)) ?? null)
      .filter((item): item is UserConceptMastery => Boolean(item));
  }

  async upsertMany(records: UserConceptMastery[]): Promise<void> {
    for (const record of records) {
      this.store.set(this.key(record.userId, record.conceptId), { ...record });
    }
  }

  private key(userId: string, conceptId: string): string {
    return `${userId}::${conceptId}`;
  }
}
