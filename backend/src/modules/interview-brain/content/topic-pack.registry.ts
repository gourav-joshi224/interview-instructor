import apisPack from './packs/apis.pack';
import cachingPack from './packs/caching.pack';
import concurrencyPack from './packs/concurrency.pack';
import databasesPack from './packs/databases.pack';
import javascriptPack from './packs/javascript.pack';
import nodeJsPack from './packs/nodejs.pack';
import queuesPack from './packs/queues.pack';
import systemDesignPack from './packs/system-design.pack';
import { TopicId, TopicPack } from './topic-pack.types';

export const topicPacks: Record<TopicId, TopicPack> = {
  'system-design': systemDesignPack,
  databases: databasesPack,
  caching: cachingPack,
  queues: queuesPack,
  apis: apisPack,
  concurrency: concurrencyPack,
  javascript: javascriptPack,
  nodejs: nodeJsPack,
};

export function listTopicPacks(): TopicPack[] {
  return Object.values(topicPacks);
}

export function getTopicPack(topicId: TopicId): TopicPack {
  const pack = topicPacks[topicId];
  if (!pack) {
    throw new Error(
      `PACK_NOT_FOUND: No topic pack registered for TopicId '${topicId}'. Registered: ${Object.keys(topicPacks).join(', ')}`,
    );
  }
  return pack;
}
