import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

class SessionAnswerDto {
  @IsString()
  @IsNotEmpty()
  question!: string;

  @IsString()
  @IsNotEmpty()
  answer!: string;
}

export class FinishSessionDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionAnswerDto)
  answers!: SessionAnswerDto[];
}
