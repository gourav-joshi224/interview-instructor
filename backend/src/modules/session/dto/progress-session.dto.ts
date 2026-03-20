import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsString, Min, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class SessionAnswerDto {
  @ApiProperty({ example: 'javascript.event_loop::js-memory-leak' })
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @ApiProperty({ example: 'Walk through event loop phases for this scenario.' })
  @IsString()
  @IsNotEmpty()
  question!: string;

  @ApiProperty({ example: 'I would prioritize microtasks...' })
  @IsString()
  @IsNotEmpty()
  answer!: string;
}

export class ProgressSessionDto {
  @ApiProperty({ example: 'd0a7d35f-7f1b-4f4b-9d89-9328b6ec9d42' })
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @ApiProperty({ example: 'System Design' })
  @IsString()
  @IsNotEmpty()
  topic!: string;

  @ApiProperty({ example: 'Mid' })
  @IsString()
  @IsNotEmpty()
  experience!: string;

  @ApiProperty({ example: 'Medium' })
  @IsString()
  @IsNotEmpty()
  difficulty!: string;

  @ApiProperty({ example: 5, minimum: 1 })
  @IsInt()
  @Min(1)
  totalQuestions!: number;

  @ApiProperty({ type: [SessionAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionAnswerDto)
  answers!: SessionAnswerDto[];
}
