import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from '../auth.service';
import { Role } from '../../generated/prisma/client';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('test-secret'),
          },
        },
        {
          provide: AuthService,
          useValue: {
            validateUserById: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate and return the user if found', async () => {
    const user = {
      id: '1',
      email: 'test@example.com',
      role: Role.CLIENT,
      name: 'Test User',
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    const validateSpy = jest
      .spyOn(authService, 'validateUserById')
      .mockResolvedValue(user);

    const result = await strategy.validate({
      sub: '1',
      email: 'test@example.com',
      role: Role.CLIENT,
    });

    expect(result).toEqual(user);
    expect(validateSpy).toHaveBeenCalledWith('1');
  });

  it('should throw UnauthorizedException if user not found', async () => {
    jest.spyOn(authService, 'validateUserById').mockResolvedValue(null);

    await expect(
      strategy.validate({
        sub: '1',
        email: 'test@example.com',
        role: Role.CLIENT,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
