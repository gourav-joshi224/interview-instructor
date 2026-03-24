import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
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

export class FinishSessionDto {
  @ApiProperty({ example: 'd0a7d35f-7f1b-4f4b-9d89-9328b6ec9d42' })
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @ApiProperty({ type: [SessionAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionAnswerDto)
  answers!: SessionAnswerDto[];
}
