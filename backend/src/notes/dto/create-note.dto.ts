import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ example: 'My First Note' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  title: string;

  @ApiProperty({ example: 'This is the content of my note...' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
