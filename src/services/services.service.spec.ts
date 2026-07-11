import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServicesService } from './services.service';
import { Service } from './entities/service.entity';
import { NotFoundException } from '@nestjs/common';

const mockServiceRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  merge: jest.fn(),
  remove: jest.fn(),
});

type MockRepository<T = any> = jest.Mocked<Partial<Repository<T>>>;

describe('ServicesService', () => {
  let service: ServicesService;
  let repository: MockRepository<Service>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: getRepositoryToken(Service),
          useFactory: mockServiceRepository,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    repository = module.get<MockRepository<Service>>(getRepositoryToken(Service));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create and save a service', async () => {
      const dto = { title: 'Test Service', duration: 30, price: 50, isActive: true };
      const savedService = { id: 'uuid', ...dto, createdAt: new Date(), updatedAt: new Date() };

      repository.create.mockReturnValue(savedService as any);
      repository.save.mockResolvedValue(savedService as any);

      const result = await service.create(dto);
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(savedService);
      expect(result).toEqual(savedService);
    });
  });

  describe('findOne', () => {
    it('should return a service if found', async () => {
      const existingService = { id: 'uuid', title: 'Service 1' };
      repository.findOne.mockResolvedValue(existingService as any);

      const result = await service.findOne('uuid');
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 'uuid' } });
      expect(result).toEqual(existingService);
    });

    it('should throw NotFoundException if service not found', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.findOne('uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated services', async () => {
      const list = [{ id: '1', title: 'S1' }, { id: '2', title: 'S2' }];
      repository.findAndCount.mockResolvedValue([list, 2] as any);

      const result = await service.findAll(1, 10);
      expect(repository.findAndCount).toHaveBeenCalledWith({ skip: 0, take: 10, order: { createdAt: 'DESC' } });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(list);
      expect(result.meta.total).toBe(2);
      expect(result.meta.totalPages).toBe(1);
    });
  });
});
