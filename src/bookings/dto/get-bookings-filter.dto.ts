import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '../entities/booking.entity';

export class GetBookingsFilterDto {
  @ApiPropertyOptional({
    enum: BookingStatus,
    description: 'Filter bookings by status',
  })
  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @ApiPropertyOptional({
    description: 'Search string to filter by customer name or email',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination (default: 1)',
    default: 1,
  })
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({
    description: 'Number of items per page (default: 10)',
    default: 10,
  })
  @IsOptional()
  limit?: string;
}
