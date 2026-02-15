import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async registerByToken(tokenCode: string, username: string) {
    const inviteToken = await this.prisma.inviteToken.findUnique({
      where: { id: tokenCode },
    });

    if (!inviteToken) {
      throw new BadRequestException('Invalid invite token');
    }

    if (inviteToken.isUsed) {
      throw new BadRequestException('Invite token already used');
    }

    if (new Date() > inviteToken.expiresAt) {
      throw new BadRequestException('Invite token expired');
    }

    // 2. Generate User Data
    // Ensure loginId is unique
    let uniqueLoginId: string;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random number
      uniqueLoginId = `${username}#${randomSuffix}`;
      const existingUser = await this.prisma.user.findUnique({ where: { loginId: uniqueLoginId } });
      if (!existingUser) {
        isUnique = true;
      } else {
        attempts++;
      }
    }

    if (!isUnique) {
      throw new BadRequestException('Could not generate unique login ID, please try again');
    }

    const deviceId = uuidv4();

    // 3. Create User & Mark Token Used (Transaction)
    const user = await this.prisma.$transaction(async (prisma) => {
      // Mark token as used
      await prisma.inviteToken.update({
        where: { id: inviteToken.id },
        data: { isUsed: true },
      });

      // Create user
      return prisma.user.create({
        data: {
          username,
          loginId: uniqueLoginId!,
          deviceId,
          inviteTokenId: inviteToken.id,
          favorites: '[]', // Initialize empty JSON array
        },
      });
    });

    // 4. Generate Tokens
    const payload = { sub: user.id, deviceId: user.deviceId };
    const accessToken = this.jwtService.sign(payload);

    return {
      user,
      accessToken,
      deviceId,
    };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
