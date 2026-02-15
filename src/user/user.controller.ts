import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Post('favorites')
  async toggleFavorite(@Req() req, @Body('questionId') questionId: string) {
    return this.userService.toggleFavorite(req.user.userId, questionId);
  }
}
