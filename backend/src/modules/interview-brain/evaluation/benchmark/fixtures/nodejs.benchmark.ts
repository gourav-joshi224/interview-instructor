import { QuestionMeta } from '../../question-registry.types';
import { BenchmarkCase } from '../benchmark.types';

export const nodejsQuestions: QuestionMeta[] = [
  {
    questionId: 'node_q1',
    topic: 'nodejs',
    text: 'Explain the Node.js event loop.',
    rubric: 'Must cover: phases, poll phase, microtask queue, libuv, non-blocking I/O',
  },
  {
    questionId: 'node_q2',
    topic: 'nodejs',
    text: 'What is the role of streams in Node.js?',
    rubric: 'Must cover: readable and writable streams, backpressure, chunked processing, memory efficiency',
  },
  {
    questionId: 'node_q3',
    topic: 'nodejs',
    text: 'How does clustering work in Node.js?',
    rubric: 'Must cover: multiple worker processes, CPU cores, shared server port, process isolation',
  },
  {
    questionId: 'node_q4',
    topic: 'nodejs',
    text: 'How would you handle errors in an Express application?',
    rubric: 'Must cover: middleware, next(err), centralized handler, async error handling, logging',
  },
];

export const nodejsBenchmarks: BenchmarkCase[] = [
  {
    id: 'nodejs_001',
    topic: 'nodejs',
    questionId: 'node_q1',
    answer: 'Explain the Node.js event loop.',
    expectedBand: 'non_attempt',
    expectedStatus: 'non_attempt',
    mustMatchSignals: ['copy_detected'],
    notes: ['T1 copied question verbatim should be rejected before evaluator'],
  },
  {
    id: 'nodejs_002',
    topic: 'nodejs',
    questionId: 'node_q2',
    answer: 'stream stream stream stream stream stream stream stream stream stream stream stream stream stream stream',
    expectedBand: 'non_attempt',
    expectedStatus: 'non_attempt',
    mustMatchSignals: ['repeated_word_spam'],
    notes: ['T4 repeated keyword spam must not be treated as an attempt'],
  },
  {
    id: 'nodejs_003',
    topic: 'nodejs',
    questionId: 'node_q3',
    answer: 'Node.js uses workers and processes.',
    expectedBand: 'weak',
    expectedStatus: 'weak_attempt',
    mustMatchSignals: ['technical_signal_1_2'],
    notes: ['Correct keywords are present but the explanation is too thin'],
  },
  {
    id: 'nodejs_004',
    topic: 'nodejs',
    questionId: 'node_q4',
    answer: 'Middleware, next, logging, async, handler.',
    expectedBand: 'weak',
    expectedStatus: 'weak_attempt',
    mustMatchSignals: ['technical_signal_3+_no_connector'],
    notes: ['T5 rubric terms without explanation should stay weak and capped'],
  },
  {
    id: 'nodejs_005',
    topic: 'nodejs',
    questionId: 'node_q1',
    answer:
      'The event loop lets Node.js handle async work without blocking. It checks timers and later processes callbacks when the call stack is empty, but I am not covering the poll phase or microtasks in detail.',
    expectedBand: 'partial',
    expectedStatus: 'valid_attempt',
    mustMatchSignals: ['technical_signal_3+'],
    notes: ['T7 explains one concept but leaves important rubric areas uncovered'],
  },
  {
    id: 'nodejs_006',
    topic: 'nodejs',
    questionId: 'node_q2',
    answer:
      'Streams move data in chunks instead of loading everything at once. That helps memory usage and supports backpressure between a producer and consumer, but this answer does not discuss the full readable and writable API surface.',
    expectedBand: 'partial',
    expectedStatus: 'valid_attempt',
    mustMatchSignals: ['technical_signal_3+'],
    notes: ['Shows some accurate understanding with notable omissions'],
  },
  {
    id: 'nodejs_007',
    topic: 'nodejs',
    questionId: 'node_q3',
    answer:
      'Clustering in Node.js starts multiple worker processes so one server can use more CPU cores. The master process shares the listening port across isolated workers, which improves concurrency and keeps a crash in one process from directly taking down the others.',
    expectedBand: 'solid',
    expectedStatus: 'valid_attempt',
    mustMatchSignals: ['technical_signal_3+'],
    notes: ['Solid answer with good coverage but not exhaustive depth'],
  },
  {
    id: 'nodejs_008',
    topic: 'nodejs',
    questionId: 'node_q4',
    answer:
      'In Express, I handle operational errors with a centralized error middleware at the end of the chain. Route handlers call next(err), async handlers wrap rejected promises, and the middleware logs context before sending a safe response so the request flow stays consistent.',
    expectedBand: 'solid',
    expectedStatus: 'valid_attempt',
    mustMatchSignals: ['technical_signal_3+'],
    notes: ['Covers the main control flow and error-handling pattern'],
  },
  {
    id: 'nodejs_009',
    topic: 'nodejs',
    questionId: 'node_q1',
    answer:
      'The Node.js event loop is built on libuv and moves through timers, pending callbacks, idle and prepare, poll, check, and close callbacks. The poll phase waits for I/O when appropriate, while Promise microtasks and process.nextTick are drained between phase transitions. That design lets a single-threaded JavaScript runtime coordinate non-blocking I/O efficiently.',
    expectedBand: 'strong',
    expectedStatus: 'valid_attempt',
    mustMatchSignals: ['technical_signal_3+'],
    notes: ['Strong benchmark anchor for event-loop depth'],
  },
  {
    id: 'nodejs_010',
    topic: 'nodejs',
    questionId: 'node_q2',
    answer:
      'Streams are an abstraction for reading or writing data incrementally in Node.js. Readable, writable, duplex, and transform streams process chunks, which avoids buffering entire payloads in memory. Backpressure coordinates producers and consumers so slow downstream code can signal upstream to pause, making file, network, and pipeline work more scalable.',
    expectedBand: 'strong',
    expectedStatus: 'valid_attempt',
    mustMatchSignals: ['technical_signal_3+'],
    notes: ['High-coverage answer for stream fundamentals'],
  },
];
