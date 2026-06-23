import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsInt, IsString, Max, Min, ValidateNested } from 'class-validator';
import { LicenseType } from '../../common/license';

export enum QuizMode {
  QUICK = 'QUICK',
  MOCK = 'MOCK',
}

export class QuestionQueryDto {
  @IsEnum(LicenseType)
  licenseType!: LicenseType;

  @IsEnum(QuizMode)
  mode!: QuizMode;
}

export class SubmittedAnswerDto {
  @IsString()
  questionId!: string;

  @IsInt()
  @Min(0)
  @Max(3)
  selectedIndex!: number;
}

export class SubmitQuizDto {
  @IsEnum(LicenseType)
  licenseType!: LicenseType;

  @IsEnum(QuizMode)
  mode!: QuizMode;

  @IsInt()
  @Min(0)
  durationSec!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => SubmittedAnswerDto)
  answers!: SubmittedAnswerDto[];
}
