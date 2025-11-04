// src/auth/roles.guard.ts
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';
import { ROLES_KEY } from '../decorator/roles.decorator';


const KEYCLOAK_CLIENT_ID =
    process.env.KEYCLOAK_AUDIENCE ?? 'docker-admin-ui';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        const requiredRoles =
            this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
                context.getHandler(),
                context.getClass(),
            ]) || [];

        // si no se pidió rol específico, con que esté autenticado basta
        if (!requiredRoles.length) return true;

        const req = context.switchToHttp().getRequest();
        const user = req.user;
        if (!user) {
            throw new ForbiddenException('Token sin usuario');
        }

        // 1) roles de realm
        const realmRoles: string[] = user?.realm_access?.roles ?? [];

        // 2) roles por cliente
        const clientRoles: string[] =
            user?.resource_access?.[KEYCLOAK_CLIENT_ID]?.roles ?? [];

        const allRoles = new Set([...realmRoles, ...clientRoles]);

        const hasRole = requiredRoles.some((r) => allRoles.has(r));
        if (!hasRole) {
            throw new ForbiddenException('No tienes permisos');
        }
        return true;
    }
}
