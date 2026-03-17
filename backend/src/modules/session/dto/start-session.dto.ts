import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class StartSessionDto {
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
}
