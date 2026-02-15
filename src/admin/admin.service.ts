import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async generateInvite(adminId: string = 'system-admin') {
    const code = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expires in 24 hours

    await this.prisma.inviteToken.create({
      data: {
        code,
        expiresAt,
        createdBy: adminId,
      },
    });

    // In a real app, the base URL should be configurable
    return {
      registrationUrl: `http://localhost:5173/register/${code}`,
      code,
    };
  }
}
