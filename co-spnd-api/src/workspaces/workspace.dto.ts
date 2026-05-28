import { IsNotEmpty, IsString, IsNumber, Min, Max, ValidateNested, ArrayMinSize } from 'class-validator';
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

export class UpdateSplittingConfigDto {
  @ValidateNested({ each: true })
  @Type(() => SplitEntryDto)
  @ArrayMinSize(1)
  splittingConfig: SplitEntryDto[];
}
