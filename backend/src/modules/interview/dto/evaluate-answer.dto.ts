import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EvaluateAnswerDto {
  @IsOptional()
  @IsString()
  topic?: string;

  @IsNotEmpty()
  @IsString()
  question!: string;

  @IsNotEmpty()
  @IsString()
  answer!: string;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsString()
  mode?: string;

  @IsOptional()
  @IsString()
  selectedSkill?: string;
}
