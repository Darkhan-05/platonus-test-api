import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) { }

  async toggleFavorite(userId: string, questionId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let favorites: string[] = [];
    try {
      favorites = JSON.parse(user.favorites || '[]');
    } catch (e) {
      favorites = [];
    }

    const index = favorites.indexOf(questionId);
    if (index > -1) {
      favorites.splice(index, 1);
    } else {
      favorites.push(questionId);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { favorites: JSON.stringify(favorites) },
    });
  }
}
