import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export function IsDateNotInPast(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'isDateNotInPast',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          // Validate YYYY-MM-DD format
          const regex = /^\d{4}-\d{2}-\d{2}$/;
          if (!regex.test(value)) return false;

          // Parse current date in local timezone
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Parse input date (append T00:00:00 to parse in local timezone)
          const inputDate = new Date(`${value}T00:00:00`);
          return !isNaN(inputDate.getTime()) && inputDate >= today;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be in YYYY-MM-DD format and cannot be in the past.`;
        },
      },
    });
  };
}

export class CreateBookingDto {
  @ApiProperty({ example: 'Alice Smith', description: 'Customer full name' })
  @IsString()
  @IsNotEmpty({ message: 'Customer name is required' })
  customerName!: string;

  @ApiProperty({ example: 'alice@example.com', description: 'Customer email address' })
  @IsEmail({}, { message: 'Customer email must be a valid email' })
  @IsNotEmpty({ message: 'Customer email is required' })
  customerEmail!: string;

  @ApiProperty({ example: '+1234567890', description: 'Customer phone number' })
  @IsString()
  @IsNotEmpty({ message: 'Customer phone is required' })
  customerPhone!: string;

  @ApiProperty({ example: 'a2b6e15a-8bde-41a3-8321-4fbd73c683b5', description: 'UUID of the service' })
  @IsUUID('4', { message: 'Service ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Service ID is required' })
  serviceId!: string;

  @ApiProperty({ example: '2026-08-15', description: 'Booking date (YYYY-MM-DD, today or later)' })
  @IsDateNotInPast()
  @IsNotEmpty({ message: 'Booking date is required' })
  bookingDate!: string;

  @ApiProperty({ example: '14:30', description: 'Booking time (HH:MM format, 24-hour)' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Booking time must be in HH:MM 24-hour format',
  })
  @IsNotEmpty({ message: 'Booking time is required' })
  bookingTime!: string;

  @ApiProperty({ example: 'Please prepare the tools.', description: 'Additional notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
