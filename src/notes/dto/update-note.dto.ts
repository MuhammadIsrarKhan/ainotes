import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateNoteDto {
  @ApiProperty({ example: 'Updated Note Title', required: false })
  @IsString()
  @IsOptional()
  @MinLength(1)
  title?: string;

  @ApiProperty({ example: 'Updated content...', required: false })
  @IsString()
  @IsOptional()
  content?: string;
}
