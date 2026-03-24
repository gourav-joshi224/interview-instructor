import { Topic } from './attempt-gate.types';

interface TechnicalSignalAssessment {
  keywordMatchCount: number;
  hasConnector: boolean;
}

const TOPIC_KEYWORDS: Readonly<Record<Topic, readonly string[]>> = {
  nodejs: [
    'event loop',
    'libuv',
    'cluster',
    'stream',
    'buffer',
    'middleware',
    'callback',
    'promise',
    'async',
    'module',
    'require',
    'npm',
    'process',
    'worker thread',
    'http module',
  ],
  javascript: [
    'closure',
    'prototype',
    'hoisting',
    'scope',
    'this',
    'arrow function',
    'event loop',
    'promise',
    'async await',
    'spread',
    'destructuring',
    'generator',
    'map',
    'reduce',
    'typeof',
  ],
  system_design: [
    'scalability',
    'load balancer',
    'cache',
    'database',
    'sharding',
    'replication',
    'microservice',
    'api gateway',
    'cdn',
    'queue',
    'consistency',
    'availability',
    'latency',
    'throughput',
    'partition',
  ],
  caching: [
    'cache',
    'ttl',
    'eviction',
    'redis',
    'hit rate',
    'stampede',
    'stale',
    'write through',
    'write back',
    'prefetch',
    'warmup',
    'cache key',
  ],
  databases: [
    'index',
    'query plan',
    'transaction',
    'isolation',
    'mvcc',
    'replication',
    'shard',
    'hot partition',
  ],
  queues: ['queue', 'kafka', 'rabbitmq', 'consumer', 'producer', 'dead letter', 'offset', 'backpressure'],
  apis: ['rest', 'graphql', 'pagination', 'idempotency', 'rate limit', 'http', 'endpoint', 'throttle'],
  concurrency: ['lock', 'mutex', 'race', 'deadlock', 'thread', 'async', 'parallel', 'throughput'],
  debugging: ['debug', 'trace', 'profile', 'log', 'stack', 'heap', 'memory leak', 'cpu'],
  generic: ['system', 'architecture', 'design', 'performance', 'scaling'],
};

const EXPLANATORY_CONNECTORS: readonly string[] = [
  'because',
  'when',
  'if',
  'then',
  'use',
  'works',
  'means',
  'allows',
  'due',
  'so',
  'to',
];

const hasPhraseMatch = (normalizedText: string, phrase: string): boolean => {
  const paddedText = ` ${normalizedText} `;
  const paddedPhrase = ` ${phrase} `;
  return paddedText.includes(paddedPhrase);
};

export const countTopicKeywordMatches = (normalizedAnswer: string, topic: Topic): number => {
  const keywords = TOPIC_KEYWORDS[topic];
  let matchCount = 0;

  for (const keyword of keywords) {
    if (hasPhraseMatch(normalizedAnswer, keyword)) {
      matchCount += 1;
    }
  }

  return matchCount;
};

export const hasTopicKeywordMatch = (normalizedAnswer: string, topic: Topic): boolean => {
  return countTopicKeywordMatches(normalizedAnswer, topic) > 0;
};

export const hasExplanatoryConnector = (normalizedAnswer: string): boolean => {
  return EXPLANATORY_CONNECTORS.some((connector: string): boolean => {
    return hasPhraseMatch(normalizedAnswer, connector);
  });
};

export const assessTechnicalSignal = (
  normalizedAnswer: string,
  topic: Topic,
): TechnicalSignalAssessment => {
  const keywordMatchCount = countTopicKeywordMatches(normalizedAnswer, topic);
  const hasConnector = hasExplanatoryConnector(normalizedAnswer);

  return {
    keywordMatchCount,
    hasConnector,
  };
};
