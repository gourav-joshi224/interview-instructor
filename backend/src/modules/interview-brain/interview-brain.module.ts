import { Module } from '@nestjs/common';
import { AttemptGateService } from './evaluation/attempt-gate.service';
import { EvaluationContextService } from './evaluation/evaluation-context.service';
import { EvidenceExtractorService } from './evaluation/evidence-extractor.service';
import { FeedbackGeneratorService } from './evaluation/feedback-generator.service';
import { ScoreEngineService } from './evaluation/score-engine.service';
import { QuestionAssemblyService, QuestionRendererService, QuestionValidatorService } from './content';
import { SessionAggregatorService } from './evaluation/session-aggregation/session-aggregator.service';
import { MasteryUpdaterService } from './mastery/mastery-updater.service';
import { InMemoryMasteryRepository } from './mastery/in-memory-mastery.repository';
import { MASTERY_REPOSITORY } from './mastery/mastery-updater.types';
import { HistoryFilterService } from './planner/history-filter.service';
import { MasteryFilterService } from './planner/mastery-filter.service';
import { PlannerService } from './planner/planner.service';
import { RulesService } from './planner/rules.service';

// Domain-only module scaffolding; no controllers/providers yet.
@Module({
  providers: [
    PlannerService,
    RulesService,
    MasteryFilterService,
    HistoryFilterService,
    AttemptGateService,
    EvidenceExtractorService,
    ScoreEngineService,
    FeedbackGeneratorService,
    SessionAggregatorService,
    EvaluationContextService,
    MasteryUpdaterService,
    InMemoryMasteryRepository,
    QuestionRendererService,
    QuestionValidatorService,
    QuestionAssemblyService,
    {
      provide: MASTERY_REPOSITORY,
      useExisting: InMemoryMasteryRepository,
    },
  ],
  exports: [
    PlannerService,
    RulesService,
    MasteryFilterService,
    HistoryFilterService,
    AttemptGateService,
    EvidenceExtractorService,
    ScoreEngineService,
    FeedbackGeneratorService,
    SessionAggregatorService,
    EvaluationContextService,
    MasteryUpdaterService,
    InMemoryMasteryRepository,
    QuestionRendererService,
    QuestionValidatorService,
    QuestionAssemblyService,
  ],
})
export class InterviewBrainModule {}
