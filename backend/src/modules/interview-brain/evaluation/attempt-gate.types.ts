export type AttemptStatus = 'non_attempt' | 'weak_attempt' | 'valid_attempt';

export type Topic =
  | 'nodejs'
  | 'javascript'
  | 'system_design'
  | 'caching'
  | 'databases'
  | 'queues'
  | 'apis'
  | 'concurrency'
  | 'debugging'
  | 'generic';

export interface AttemptGateInput {
  question: string;
  answer: string;
  topic: Topic;
}

export interface AttemptGateResult {
  status: AttemptStatus;
  shouldEvaluate: boolean;
  scoreCap: number | null; // null means uncapped
  reason: string; // human-readable, single sentence
  signals: string[]; // list of triggered check names, e.g. ['too_short', 'no_technical_signal']
}
