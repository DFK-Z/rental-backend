// Импортируем зависимости
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// Определяем сервис для обработки аутентификации
@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  // Регистрация нового пользователя
  async register(dto: RegisterDto) {
    // Хешируем пароль с использованием argon2
    const hashedPassword = await argon2.hash(dto.password);
    // Создаем пользователя в базе данных
    const user = await this.prisma.user.create({
      data: { email: dto.email, password: hashedPassword, name: dto.name },
    });
    // Генерируем токены для пользователя
    return this.generateTokens(user.id, user.email, user.role);
  }

  // Вход пользователя
  async login(dto: LoginDto) {
    // Ищем пользователя по email
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    // Проверяем наличие пользователя и корректность пароля
    if (!user || !(await argon2.verify(user.password, dto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // Генерируем токены для пользователя
    return this.generateTokens(user.id, user.email, user.role);
  }

  // Обновление токенов
  async refresh(refreshToken: string) {
    try {
      // Проверяем валидность refresh-токена
      const payload = this.jwt.verify(refreshToken, { secret: process.env.JWT_REFRESH_SECRET });
      // Ищем пользователя по ID из токена
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();
      // Генерируем новые токены
      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // Генерация access и refresh токенов
  private generateTokens(userId: number, email: string, role: string) {
    // Создаем access-токен с временем жизни 15 минут
    const accessToken = this.jwt.sign({ sub: userId, email, role }, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: "15m",
    });
    // Создаем refresh-токен с временем жизни 7 дней
    const refreshToken = this.jwt.sign({ sub: userId }, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: "7d",
    });
    return { accessToken, refreshToken };
  }
}