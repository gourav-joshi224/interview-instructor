import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuestionDto {
  @ApiPropertyOptional({ example: 'javascript.event_loop::js-memory-leak' })
  @IsOptional()
  @IsString()
  questionId?: string;

  @ApiProperty({ example: 'JavaScript' })
  @IsString()
  @IsNotEmpty()
  topic!: string;

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

  @ApiPropertyOptional({ example: 'https://example.com/resume.pdf' })
  @IsOptional()
  @IsString()
  resumeDataUrl?: string;
}
