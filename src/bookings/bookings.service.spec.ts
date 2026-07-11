import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingsService } from './bookings.service';
import { Booking, BookingStatus } from './entities/booking.entity';
import { Service } from '../services/entities/service.entity';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

const mockBookingRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockServiceRepository = () => ({
  findOne: jest.fn(),
});

type MockRepository<T = any> = jest.Mocked<Partial<Repository<T>>>;

describe('BookingsService', () => {
  let service: BookingsService;
  let bookingRepository: MockRepository<Booking>;
  let serviceRepository: MockRepository<Service>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: getRepositoryToken(Booking),
          useFactory: mockBookingRepository,
        },
        {
          provide: getRepositoryToken(Service),
          useFactory: mockServiceRepository,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    bookingRepository = module.get<MockRepository<Booking>>(getRepositoryToken(Booking));
    serviceRepository = module.get<MockRepository<Service>>(getRepositoryToken(Service));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const nextYear = new Date().getFullYear() + 1;
    const createDto = {
      customerName: 'Bob',
      customerEmail: 'bob@example.com',
      customerPhone: '123456',
      serviceId: 'service-uuid',
      bookingDate: `${nextYear}-12-25`,
      bookingTime: '10:00',
    };

    it('should successfully create a booking if service is active and slot is free', async () => {
      const activeService = { id: 'service-uuid', isActive: true };
      const expectedBooking = { id: 'booking-uuid', ...createDto, status: BookingStatus.PENDING };

      serviceRepository.findOne.mockResolvedValue(activeService as any);
      bookingRepository.findOne.mockResolvedValue(null); // No duplicates
      bookingRepository.create.mockReturnValue(expectedBooking as any);
      bookingRepository.save.mockResolvedValue(expectedBooking as any);

      const result = await service.create(createDto);
      expect(result).toEqual(expectedBooking);
    });

    it('should throw NotFoundException if service does not exist', async () => {
      serviceRepository.findOne.mockResolvedValue(null);
      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if service is inactive', async () => {
      const inactiveService = { id: 'service-uuid', isActive: false };
      serviceRepository.findOne.mockResolvedValue(inactiveService as any);
      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if duplicate slot exists', async () => {
      const activeService = { id: 'service-uuid', isActive: true };
      const existingBooking = { id: 'booking-uuid', ...createDto, status: BookingStatus.CONFIRMED };

      serviceRepository.findOne.mockResolvedValue(activeService as any);
      bookingRepository.findOne.mockResolvedValue(existingBooking as any); // Duplicate found

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('updateStatus', () => {
    it('should throw BadRequestException if trying to complete a cancelled booking', async () => {
      const cancelledBooking = { id: 'booking-uuid', status: BookingStatus.CANCELLED };
      bookingRepository.findOne.mockResolvedValue(cancelledBooking as any);

      await expect(
        service.updateStatus('booking-uuid', { status: BookingStatus.COMPLETED }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
