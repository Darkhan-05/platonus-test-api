import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }

    const request = context.switchToHttp().getRequest();
    const deviceIdCookie = request.cookies?.device_id;

    if (!deviceIdCookie || deviceIdCookie !== user.deviceId) {
      throw new UnauthorizedException('Device mismatch or missing device cookie');
    }

    return user;
  }
}
