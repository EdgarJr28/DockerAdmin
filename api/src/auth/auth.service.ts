// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, InternalServerErrorException, Logger } from '@nestjs/common';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
    private baseUrl = process.env.KEYCLOAK_BASE_URL!;
    private realm = process.env.KEYCLOAK_REALM!;
    private clientId = process.env.KEYCLOAK_CLIENT_ID!;
    private clientSecret = process.env.KEYCLOAK_CLIENT_SECRET!;

    async login(username: string, password: string) {
        const url = `${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/token`;

        const body = new URLSearchParams();
        body.append('grant_type', 'password');
        body.append('client_id', this.clientId);
        body.append('client_secret', this.clientSecret);
        body.append('username', username);
        body.append('password', password);

        try {
            const { data } = await axios.post(url, body.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            // data === { access_token, refresh_token, expires_in, ... }
            
            // opcional: decodificar el access_token para mandarte el perfil
            let profile: any = null;
            try {
                profile = jwt.decode(data.access_token);
            } catch {
                profile = null;
            }

            return {
                ok: true,
                token: data.access_token,
                refreshToken: data.refresh_token,
                expiresIn: data.expires_in,
                profile,
            };
        } catch (err: any) {
            const kcError = err?.response?.data;
            // aquí sale típicamente: { error: 'invalid_grant', error_description: '...' }
            Logger.error(kcError);
            if (kcError) {
                throw new UnauthorizedException(
                    kcError.error_description || kcError.error || 'Credenciales inválidas en Keycloak',
                );
            }
            throw new InternalServerErrorException('No se pudo contactar a Keycloak.');
        }
    }
}
