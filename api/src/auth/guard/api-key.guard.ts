import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';


@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. ¿es pública?
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // 2. si no es pública, validamos api key
    const request = context.switchToHttp().getRequest();
    const header = request.headers['x-api-key'];

    const expected = process.env.API_KEY || process.env.NEST_API_KEY;
    if (!header || header !== expected) {
      throw new UnauthorizedException('Falta header x-api-key');
    }

    return true;
  }
}
