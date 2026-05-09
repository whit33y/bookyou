import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mocked_token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: '1',
        ...dto,
        role: 'CLIENT',
        deletedAt: null,
      });

      const result = await service.register(dto);

      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe(dto.email);
    });

    it('should re-activate a soft-deleted user', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: dto.email,
        deletedAt: new Date(),
      });
      mockPrismaService.user.update.mockResolvedValue({
        id: '1',
        email: dto.email,
        name: dto.name,
        role: 'CLIENT',
        deletedAt: null,
      });

      const result = await service.register(dto);

      expect(result).toHaveProperty('accessToken');
      expect(mockPrismaService.user.update).toHaveBeenCalled();
      expect(result.user.email).toBe(dto.email);
    });

    it('should throw ConflictException if user exists and is active', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: dto.email,
        deletedAt: null,
      });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login a user with valid credentials', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const hashedPassword = await bcrypt.hash(dto.password, 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: dto.email,
        password: hashedPassword,
        role: 'CLIENT',
        name: 'Test User',
        deletedAt: null,
      });

      const result = await service.login(dto);

      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe(dto.email);
    });

    it('should throw UnauthorizedException if user is soft-deleted', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: dto.email,
        deletedAt: new Date(),
      });

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      const dto = { email: 'test@example.com', password: 'wrongpassword' };
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: dto.email,
        password: hashedPassword,
        deletedAt: null,
      });

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const dto = { email: 'nonexistent@example.com', password: 'password123' };
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
