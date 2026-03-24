import { QuestionMeta } from '../../question-registry.types';
import { BenchmarkCase } from '../benchmark.types';

export const systemDesignQuestions: QuestionMeta[] = [
  {
    questionId: 'sd_q1',
    topic: 'system_design',
    text: 'How would you design a URL shortener?',
    rubric: 'Must cover: API, unique ID generation, database, redirects, scalability, caching',
  },
  {
    questionId: 'sd_q2',
    topic: 'system_design',
    text: 'How would you design a rate limiter?',
    rubric: 'Must cover: algorithm choice, distributed state, latency, accuracy, failure handling',
  },
  {
    questionId: 'sd_q3',
    topic: 'system_design',
    text: 'How would you design a chat system?',
    rubric: 'Must cover: real-time delivery, fan-out, storage, presence, scaling',
  },
  {
    questionId: 'sd_q4',
    topic: 'system_design',
    text: 'How would you design a notification system?',
    rubric: 'Must cover: channels, queueing, retries, preferences, idempotency, observability',
  },
];

export const systemDesignBenchmarks: BenchmarkCase[] = [
  {
    id: 'system_design_001',
    topic: 'system_design',
    questionId: 'sd_q2',
    answer: 'rate limiter rate limiter rate limiter rate limiter rate limiter rate limiter rate limiter rate limiter rate limiter rate limiter rate limiter rate limiter rate limiter rate limiter rate limiter',
    expectedBand: 'non_attempt',
    expectedStatus: 'non_attempt',
    mustMatchSignals: ['repeated_word_spam'],
    notes: ['Repeated keyword spam should still be rejected in system design'],
  },
  {
    id: 'system_design_002',
    topic: 'system_design',
    questionId: 'sd_q3',
    answer: 'asdfghjkl poiuytrewq mnbvcxz qqqqq',
    expectedBand: 'non_attempt',
    expectedStatus: 'non_attempt',
    mustMatchSignals: ['keyboard_mash'],
    notes: ['Longer keyboard mash should trip gibberish detection'],
  },
  {
    id: 'system_design_003',
    topic: 'system_design',
    questionId: 'sd_q1',
    answer: 'API, cache, database, redirect, scale.',
    expectedBand: 'weak',
    expectedStatus: 'weak_attempt',
    mustMatchSignals: ['technical_signal_3+_no_connector'],
    notes: ['System-design keywords without architecture reasoning should stay weak'],
  },
  {
    id: 'system_design_004',
    topic: 'system_design',
    questionId: 'sd_q4',
    answer:
      'A great culture requires empathy, rituals, leadership visibility, onboarding care, and regular feedback, which matter a lot more than channels or retry design in this response.',
    expectedBand: 'weak',
    expectedStatus: 'weak_attempt',
    mustMatchSignals: ['no_technical_signal'],
    notes: ['Fluent but topic-irrelevant answer with no system-design signal'],
  },
  {
    id: 'system_design_005',
    topic: 'system_design',
    questionId: 'sd_q2',
    answer:
      'I would put a rate limiter in front of the API and use a token bucket so each key can spend tokens over time. Shared counters in Redis can coordinate multiple servers, but I am leaving out deeper failure handling and consistency tradeoffs.',
    expectedBand: 'partial',
    expectedStatus: 'valid_attempt',
    mustMatchSignals: ['technical_signal_3+'],
    notes: ['Reasonable design start with notable gaps'],
  },
  {
    id: 'system_design_006',
    topic: 'system_design',
    questionId: 'sd_q4',
    answer:
      'A notification system should accept requests through an API, enqueue them, and fan out to workers that send email, push, or SMS. Retries and user preferences matter, but this answer leaves out idempotency and monitoring depth.',
    expectedBand: 'partial',
    expectedStatus: 'valid_attempt',
    mustMatchSignals: ['technical_signal_3+'],
    notes: ['Covers the outline but misses some expected controls'],
  },
  {
    id: 'system_design_007',
    topic: 'system_design',
    questionId: 'sd_q1',
    answer:
      'For a URL shortener, I would expose create and redirect APIs, generate unique IDs with a collision-resistant strategy, and store mappings in a database keyed by short code. Redirect traffic can be served through a cache in front of storage, while read-heavy scaling can rely on replication and stateless application servers.',
    expectedBand: 'solid',
    expectedStatus: 'valid_attempt',
    mustMatchSignals: ['technical_signal_3+'],
    notes: ['Solid design answer with core pieces present'],
  },
  {
    id: 'system_design_008',
    topic: 'system_design',
    questionId: 'sd_q3',
    answer:
      'A chat system needs persistent connections for real-time delivery, a routing layer for fan-out, and durable storage for message history. Presence can be tracked in fast ephemeral storage, while horizontal scaling usually separates gateway nodes from message services so the platform can grow without tightly coupling transport and storage concerns.',
    expectedBand: 'solid',
    expectedStatus: 'valid_attempt',
    mustMatchSignals: ['technical_signal_3+'],
    notes: ['Good architecture coverage across delivery, storage, and scale'],
  },
  {
    id: 'system_design_009',
    topic: 'system_design',
    questionId: 'sd_q2',
    answer:
      'A robust rate limiter starts by selecting an algorithm such as token bucket or sliding window based on burst tolerance and accuracy needs. In a distributed deployment, counters live in a low-latency shared store like Redis and updates should be atomic to avoid inconsistent enforcement across nodes. The service also needs clear failure behavior, such as fail-open for internal tools or fail-closed for abuse-sensitive paths, plus metrics so operators can observe rejection rates and latency.',
    expectedBand: 'strong',
    expectedStatus: 'valid_attempt',
    mustMatchSignals: ['technical_signal_3+'],
    notes: ['Strong system-design answer with tradeoffs and operations'],
  },
  {
    id: 'system_design_010',
    topic: 'system_design',
    questionId: 'sd_q4',
    answer:
      'I would model a notification system with an intake API, per-channel queues, and worker fleets for email, push, and SMS. User preference checks and idempotency keys happen before enqueue or send so retries do not create duplicates. Failed deliveries go through bounded retries and dead-letter queues, while observability tracks lag, success rates, provider errors, and per-channel throughput so the system can scale safely and be debugged under load.',
    expectedBand: 'strong',
    expectedStatus: 'valid_attempt',
    mustMatchSignals: ['technical_signal_3+'],
    notes: ['Comprehensive answer with reliability and observability'],
  },
];
