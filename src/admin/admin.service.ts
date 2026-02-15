import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) { }

  async generateInvite(adminId: string = 'system-admin') {
    const code = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const token = await this.prisma.inviteToken.create({
      data: {
        code,
        expiresAt,
        createdBy: adminId,
      },
    });

    return {
      registrationUrl: `http://localhost:5173/register/${token.id}`,
      ...token,
    };
  }

  async getAllInvites() {
    return this.prisma.inviteToken.findMany({
      include: {
        user: true, // ВАЖНО: Подгружаем юзера, чтобы видеть кто использовал
      },
      orderBy: {
        expiresAt: 'desc', // Свежие сверху
      },
    });
  }

  // 3. Получить всех юзеров (для статистики)
  async getAllUsers() {
    return this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Удалить токен (только если он не привязан к юзеру, либо настроен Cascade Delete)
  async deleteInvite(id: string) {
    return this.prisma.inviteToken.delete({
      where: { id },
    });
  }

  // Удалить пользователя
  async deleteUser(id: string) {
    // При удалении пользователя, связанный токен останется "использованным".
    // Если нужно освободить токен, это отдельная логика. Пока просто удаляем юзера.
    return this.prisma.user.delete({
      where: { id },
    });
  }
}