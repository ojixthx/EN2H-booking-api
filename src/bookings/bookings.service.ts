import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { Service } from '../services/entities/service.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { GetBookingsFilterDto } from './dto/get-bookings-filter.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    const { serviceId, bookingDate, bookingTime } = createBookingDto;

    // Rule 1: A booking must belong to an existing service and must be active.
    const service = await this.serviceRepository.findOne({ where: { id: serviceId } });
    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }
    if (!service.isActive) {
      throw new BadRequestException('Cannot book a service that is inactive');
    }

    // Rule 2: Booking dates cannot be in the past (additional double-check in service layer)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(`${bookingDate}T00:00:00`);
    if (inputDate < today) {
      throw new BadRequestException('Booking date cannot be in the past');
    }

    // Rule 4: Prevent duplicate bookings for the same service, date, and time
    // Exclude CANCELLED bookings from duplication checks!
    const duplicate = await this.bookingRepository.findOne({
      where: {
        serviceId,
        bookingDate,
        bookingTime,
        status: Not(BookingStatus.CANCELLED),
      },
    });

    if (duplicate) {
      throw new ConflictException(
        'This timeslot is already booked for the selected service',
      );
    }

    const booking = this.bookingRepository.create({
      ...createBookingDto,
      status: BookingStatus.PENDING,
    });

    return this.bookingRepository.save(booking);
  }

  async findAll(filterDto: GetBookingsFilterDto) {
    const { status, search } = filterDto;
    const page = filterDto.page ? parseInt(filterDto.page, 10) : 1;
    const limit = filterDto.limit ? parseInt(filterDto.limit, 10) : 10;
    
    const pageNum = isNaN(page) || page < 1 ? 1 : page;
    const limitNum = isNaN(limit) || limit < 1 ? 10 : limit;

    const query = this.bookingRepository.createQueryBuilder('booking');
    query.leftJoinAndSelect('booking.service', 'service');

    if (status) {
      query.andWhere('booking.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        '(LOWER(booking.customerName) LIKE LOWER(:search) OR LOWER(booking.customerEmail) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    query.orderBy('booking.createdAt', 'DESC');
    query.skip((pageNum - 1) * limitNum);
    query.take(limitNum);

    const [data, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limitNum);

    return {
      success: true,
      statusCode: 200,
      data,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    };
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['service'],
    });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }
    return booking;
  }

  async updateStatus(
    id: string,
    updateBookingStatusDto: UpdateBookingStatusDto,
  ): Promise<Booking> {
    const { status: newStatus } = updateBookingStatusDto;
    const booking = await this.findOne(id);

    // Rule 3: Cancelled bookings cannot be marked as completed
    if (
      booking.status === BookingStatus.CANCELLED &&
      newStatus === BookingStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Cancelled bookings cannot be marked as completed',
      );
    }

    booking.status = newStatus;
    return this.bookingRepository.save(booking);
  }

  async cancel(id: string): Promise<Booking> {
    // Customers can cancel bookings. A helper to update status to CANCELLED directly.
    return this.updateStatus(id, { status: BookingStatus.CANCELLED });
  }
}
