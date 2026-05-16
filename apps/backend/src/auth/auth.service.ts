import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { AuthResponse, AuthUserResponse } from './dto/auth-response.dto';

const BCRYPT_SALT_ROUNDS = 10;
const DUMMY_HASH =
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgNI9Dg8dzI8H586j7f7F7F7F7F7';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Check if user exists (including soft-deleted)
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser && existingUser.deletedAt === null) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    if (existingUser) {
      // Re-activate soft-deleted user with selected role (defaults to CLIENT)
      const updatedUser = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          name: dto.name,
          role: dto.role ?? Role.CLIENT,
          deletedAt: null,
        },
      });

      const accessToken = await this.generateToken(
        updatedUser.id,
        updatedUser.email,
        updatedUser.role,
      );

      return {
        accessToken,
        user: this.mapUserToResponse(updatedUser),
      };
    }

    // Create new user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: dto.role ?? Role.CLIENT,
      },
    });

    const accessToken = await this.generateToken(
      user.id,
      user.email,
      user.role,
    );

    return {
      accessToken,
      user: this.mapUserToResponse(user),
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    const isUserValid = user !== null && user.deletedAt === null;

    // Use dummy hash if user is not found to prevent timing attacks
    const passwordToCompare = isUserValid ? user.password : DUMMY_HASH;
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      passwordToCompare,
    );

    if (!isUserValid || !isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // If we reach here, we know user is valid and not null
    const accessToken = await this.generateToken(
      user.id,
      user.email,
      user.role,
    );

    return {
      accessToken,
      user: this.mapUserToResponse(user),
    };
  }

  async validateUserById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      omit: { password: true },
    });

    // Only return user if they are not soft-deleted
    if (!user || user.deletedAt !== null) {
      return null;
    }

    return user;
  }

  public mapUserToResponse(user: User): AuthUserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  private async generateToken(
    userId: string,
    email: string,
    role: Role,
  ): Promise<string> {
    const payload = { sub: userId, email, role };
    return this.jwtService.signAsync(payload);
  }
}
