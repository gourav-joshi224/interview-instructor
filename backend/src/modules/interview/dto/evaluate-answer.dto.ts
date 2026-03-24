import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EvaluateAnswerDto {
  @ApiPropertyOptional({ example: 'javascript.event_loop::js-memory-leak' })
  @IsOptional()
  @IsString()
  questionId?: string;

  @ApiPropertyOptional({ example: 'JavaScript' })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiProperty({ example: 'Explain how the event loop prioritizes microtasks.' })
  @IsNotEmpty()
  @IsString()
  question!: string;

  @ApiProperty({ example: 'Microtasks run after each macrotask and before rendering...' })
  @IsNotEmpty()
  @IsString()
  answer!: string;

  @ApiPropertyOptional({ example: 'Mid' })
  @IsOptional()
  @IsString()
  experience?: string;

  @ApiPropertyOptional({ example: 'Medium' })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({ example: 'standard' })
  @IsOptional()
  @IsString()
  mode?: string;

  @ApiPropertyOptional({ example: 'JavaScript Core' })
  @IsOptional()
  @IsString()
  selectedSkill?: string;
}
