import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class QuestionDto {
  @IsString()
  @IsNotEmpty()
  topic!: string;

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
  resumeDataUrl?: string;
}
