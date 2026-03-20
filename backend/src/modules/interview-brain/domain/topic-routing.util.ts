import { TopicId } from '../content/topic-pack.types';
import { TopicId as TopicIdEnum } from './enums';

export const TOPIC_DISPLAY_MAP: Record<string, TopicId> = {
  javascript: TopicIdEnum.JavaScript,
  'node.js': TopicIdEnum.NodeJS,
  nodejs: TopicIdEnum.NodeJS,
  'system design': TopicIdEnum.SystemDesign,
  system_design: TopicIdEnum.SystemDesign,
  caching: TopicIdEnum.Caching,
  databases: TopicIdEnum.Databases,
  queues: TopicIdEnum.Queues,
  apis: TopicIdEnum.Apis,
  concurrency: TopicIdEnum.Concurrency,
};

export function toTopicId(topic: string): TopicId | null {
  return TOPIC_DISPLAY_MAP[topic.toLowerCase().trim()] ?? null;
}
