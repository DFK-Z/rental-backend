// Импортируем зависимости
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// Определяем стратегию JWT для аутентификации
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([(req) => req.cookies['accessToken']]),
      ignoreExpiration: false, // Проверяем срок действия токена
      secretOrKey: "access-secret-key"
    });
  }

  // Валидация полезной нагрузки токена
  async validate(payload: any) {
    // Возвращаем данные пользователя для использования в запросах
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}