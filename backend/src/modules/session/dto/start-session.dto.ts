import { IsArray, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TOPIC_DISPLAY_MAP } from '../../interview-brain/domain/topic-routing.util';

export class StartSessionDto {
  @ApiProperty({ example: 'System Design', enum: Object.keys(TOPIC_DISPLAY_MAP) })
  @IsString()
  topic!: string;

  @ApiProperty({ example: 'Mid', enum: ['Junior', 'Mid', 'Senior'] })
  @IsString()
  @IsIn(['Junior', 'Mid', 'Senior'])
  experience!: string;

  @ApiProperty({ example: 'Medium', enum: ['Warm Up', 'Medium', 'Hard', 'Epic'] })
  @IsString()
  @IsIn(['Warm Up', 'Medium', 'Hard', 'Epic'])
  difficulty!: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  totalQuestions!: number;

  // TODO: make required once ApiKeyGuard is replaced with JWT guard
  @ApiPropertyOptional({ example: 'user_123' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ type: [String], example: ['q_101', 'q_102'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recentQuestionIds?: string[];
}
