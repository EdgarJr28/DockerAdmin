import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';


@Injectable()
export class ApiKeyGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        const headerKey = req.headers['x-api-key'];
        const expected = process.env.API_KEY;
        if (!expected || headerKey !== expected) {
            throw new UnauthorizedException('Invalid API key');
        }
        return true;
    }
}