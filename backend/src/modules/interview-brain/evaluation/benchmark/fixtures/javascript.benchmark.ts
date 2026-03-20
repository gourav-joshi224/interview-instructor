import { QuestionMeta } from '../../question-registry.types';
import { BenchmarkCase } from '../benchmark.types';

export const javascriptQuestions: QuestionMeta[] = [
  {
    questionId: 'js_q1',
    topic: 'javascript',
    text: 'What is a closure in JavaScript?',
    rubric: 'Must cover: inner function, lexical scope, retained variables, practical use case',
  },
  {
    questionId: 'js_q2',
    topic: 'javascript',
    text: 'Explain the difference between == and === in JavaScript.',
    rubric: 'Must cover: coercion, strict equality, type comparison, examples',
  },
  {
    questionId: 'js_q3',
    topic: 'javascript',
    text: 'How does the JavaScript event loop work in the browser?',
    rubric: 'Must cover: call stack, task queue, microtasks, rendering interaction, async callbacks',
  },
  {
    questionId: 'js_q4',
    topic: 'javascript',
    text: 'What is prototypal inheritance?',
    rubric: 'Must cover: prototype chain, property lookup, object linkage, reuse',
  },
];

export const javascriptBenchmarks: BenchmarkCase[] = [
  {
    id: 'javascript_001',
    topic: 'javascript',
    questionId: 'js_q1',
    answer: "I don't know",
    expectedBand: 'non_attempt',
    expectedStatus: 'non_attempt',
    mustMatchSignals: ['explicit_non_attempt'],
    notes: ['T2 explicit non-attempt phrase'],
  },
  {
    id: 'javascript_002',
    topic: 'javascript',
    questionId: 'js_q3',
    answer: 'asdfghjkl qwerty zxcvbnm',
    expectedBand: 'non_attempt',
    expectedStatus: 'non_attempt',
    mustMatchSignals: ['too_short'],
    notes: ['T3 gibberish that is also too short should still fail safely at the earliest gate'],
  },
  {
    id: 'javascript_003',
    topic: 'javascript',
    questionId: 'js_q2',
    answer: 'Double equals coerces. Triple equals strict.',
    expectedBand: 'weak',
    expectedStatus: 'weak_attempt',
    mustMatchSignals: ['shallow_length'],
    notes: ['Short but topic-relevant answer should stay capped weak'],
  },
  {
    id: 'javascript_004',
    topic: 'javascript',
    questionId: 'js_q4',
    answer:
      'A prototype chain links objects, but in team management I would mostly focus on weekly planning, communication, morale, and hiring velocity instead of object reuse details.',
    expectedBand: 'weak',
    expectedStatus: 'weak_attempt',
    mustMatchSignals: ['technical_signal_1_2'],
    notes: ['T6 fluent English that is mostly off-topic should remain weak because relevance is shallow'],
  },
  {
    id: 'javascript_005',
    topic: 'javascript',
    questionId: 'js_q1',
    answer:
      'A closure happens when an inner function can still read variables from the scope where it was created, even after that outer function returned. This is useful for private state, but I am not describing lexical environment details or broader patterns here.',
    expectedBand: 'partial',
    expectedStatus: 'valid_attempt',
    mustMatchSignals: ['technical_signal_3+'],
    notes: ['Moderately correct closure explanation with missing depth'],
  },
  {
    id: 'javascript_006',
    topic: 'javascript',
    questionId: 'js_q3',
    answer:
      'JavaScript uses a stack for running code and queues async callbacks for later. Microtasks run before the next task, which is why promise handlers often happen sooner than timers, but this answer skips rendering and several scheduling details.',
    expectedBand: 'partial',
    expectedStatus: 'valid_attempt',
    mustMatchSignals: ['technical_signal_3+'],
    notes: ['T8 correct conceptually even if it does not mirror the rubric wording exactly'],
  },
  {
    id: 'javascript_007',
    topic: 'javascript',
    questionId: 'js_q2',
    answer:
      'The == operator allows type coercion before comparing values, while === requires both value and type to match. That means 5 == \"5\" is true but 5 === \"5\" is false. Using strict equality avoids surprising coercion rules in most application code.',
    expectedBand: 'solid',
    expectedStatus: 'valid_attempt',
    mustMatchSignals: ['technical_signal_3+'],
    notes: ['Solid language fundamentals answer'],
  },
  {
    id: 'javascript_008',
    topic: 'javascript',
    questionId: 'js_q4',
    answer:
      'Prototypal inheritance links objects through a prototype chain. When a property is missing on an object, JavaScript walks that chain until it finds the property or reaches null. This enables behavior reuse without class-based copying because objects can delegate lookups to shared prototypes.',
    expectedBand: 'solid',
    expectedStatus: 'valid_attempt',
    mustMatchSignals: ['technical_signal_3+'],
    notes: ['Good prototype-chain explanation without extra edge cases'],
  },
  {
    id: 'javascript_009',
    topic: 'javascript',
    questionId: 'js_q1',
    answer:
      'A closure is created when a function is defined inside another lexical scope and retains access to that surrounding environment after the outer call finishes. The retained variables are not copied; the inner function still references them through the lexical environment. This is useful for data privacy, function factories, memoization, and event handlers that need stable captured state.',
    expectedBand: 'strong',
    expectedStatus: 'valid_attempt',
    mustMatchSignals: ['technical_signal_3+'],
    notes: ['Strong closure benchmark anchor'],
  },
  {
    id: 'javascript_010',
    topic: 'javascript',
    questionId: 'js_q3',
    answer:
      'In the browser, JavaScript runs on the call stack while the event loop coordinates queued work. Macrotasks such as timers and DOM events are processed one at a time after the current stack clears, and microtasks such as promise reactions are drained before the browser moves on to rendering or the next task. That ordering is why async behavior can feel immediate while still remaining single-threaded from the JavaScript engine perspective.',
    expectedBand: 'strong',
    expectedStatus: 'valid_attempt',
    mustMatchSignals: ['technical_signal_3+'],
    notes: ['High-quality event-loop explanation for browser JavaScript'],
  },
];
