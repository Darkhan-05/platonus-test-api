import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../prisma/prisma.service'; // Не забудь добавить PrismaService

@Module({
  imports: [
    ConfigModule, // Добавь это, чтобы модуль видел конфигурацию
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '7300d' // <--- ВАЖНО: 20 лет (было 1h)
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, PrismaService], // Добавь PrismaService в провайдеры
  controllers: [AuthController],
  exports: [AuthService, JwtModule]
})
export class AuthModule { }