import { IsNotEmpty, IsString, IsNumber, Min, Max, ValidateNested, ArrayMinSize, IsArray, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWorkspaceDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  currency: string;
}

export class InviteUserDto {
  @IsNotEmpty()
  @IsString()
  email: string;
}

export class SplitEntryDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;
}

export class UpdateWorkspaceDto {
  @IsNotEmpty()
  @IsString()
  name: string;
}

export class UpdateSplittingConfigDto {
  @ValidateNested({ each: true })
  @Type(() => SplitEntryDto)
  @ArrayMinSize(1)
  splittingConfig: SplitEntryDto[];
}

export class UpdateCategoriesDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  add?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  remove?: string[];
}
