import { Controller, Post, Body, Res, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register-by-token')
  async registerByToken(
    @Body('token') token: string,
    @Body('username') username: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.registerByToken(token, username);

    const FOREVER_MS = 1000 * 60 * 60 * 24 * 365 * 20;

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: FOREVER_MS,
      expires: new Date(Date.now() + FOREVER_MS)
    };

    res.cookie('access_token', result.accessToken, cookieOptions);
    res.cookie('device_id', result.deviceId, cookieOptions);

    return result.user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req) {
    return this.authService.validateUser(req.user.userId);
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('device_id');
    return { message: 'Logged out successfully' };
  }
}
