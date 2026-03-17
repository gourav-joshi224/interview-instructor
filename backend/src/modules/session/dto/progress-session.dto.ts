import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsString, Min, ValidateNested } from 'class-validator';

class SessionAnswerDto {
  @IsString()
  @IsNotEmpty()
  question!: string;

  @IsString()
  @IsNotEmpty()
  answer!: string;
}

export class ProgressSessionDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsString()
  @IsNotEmpty()
  topic!: string;

  @IsString()
  @IsNotEmpty()
  experience!: string;

  @IsString()
  @IsNotEmpty()
  difficulty!: string;

  @IsInt()
  @Min(1)
  totalQuestions!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionAnswerDto)
  answers!: SessionAnswerDto[];
}
