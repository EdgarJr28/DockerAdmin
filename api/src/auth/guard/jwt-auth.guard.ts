// src/auth/jwt-auth.guard.ts
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import jwksClient, { JwksClient } from 'jwks-rsa';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';


// pásalo a .env en tu proyecto
const KEYCLOAK_ISSUER =
    process.env.KEYCLOAK_ISSUER ??
    'https://tu-keycloak/realms/docker-admin';
const KEYCLOAK_AUDIENCE =
    process.env.KEYCLOAK_AUDIENCE ?? 'docker-admin-ui';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    private client: JwksClient;

    constructor(private readonly reflector: Reflector) {
        this.client = jwksClient({
            jwksUri: `${KEYCLOAK_ISSUER}/protocol/openid-connect/certs`,
        });
    }

    private getKey(
        header: jwt.JwtHeader,
        callback: (err: Error | null, key?: string) => void,
    ) {
        this.client.getSigningKey(header.kid as string, (err, key) => {
            if (err) return callback(err);
            const signingKey = key?.getPublicKey();
            callback(null, signingKey);
        });
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // 1. si es público, no pedimos token
        if (isPublic) {
            return true;
        }

        const req = context.switchToHttp().getRequest();
        const auth = req.headers['authorization'];

        if (!auth || !auth.startsWith('Bearer ')) {
            throw new UnauthorizedException('Falta header Authorization');
        }

        const token = auth.slice('Bearer '.length);

        // 2. verificar contra JWKS de Keycloak
        return new Promise((resolve, reject) => {
            jwt.verify(
                token,
                this.getKey.bind(this), // importante: bind(this)
                {
                    issuer: KEYCLOAK_ISSUER,
                    audience: KEYCLOAK_AUDIENCE,
                    algorithms: ['RS256'],
                },
                (err, decoded) => {
                    if (err) {
                        return reject(new UnauthorizedException('Token inválido'));
                    }
                    // guardamos el usuario para los controladores
                    (req as any).user = decoded;
                    resolve(true);
                },
            );
        });
    }
}
