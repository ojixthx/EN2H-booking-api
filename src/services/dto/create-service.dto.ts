import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ example: 'Haircut & Styling', description: 'Title of the service' })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title!: string;

  @ApiProperty({
    example: 'A complete haircut, wash, and style session with our top stylist.',
    description: 'Detailed description of the service',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 45, description: 'Duration of the service in minutes' })
  @IsNumber()
  @IsPositive({ message: 'Duration must be a positive number' })
  duration!: number;

  @ApiProperty({ example: 35.5, description: 'Price of the service' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Price cannot be negative' })
  price!: number;

  @ApiProperty({ example: true, description: 'Whether the service is active', default: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
