import { Injectable, Logger } from '@nestjs/common';
import KeycloakAdminClient from 'keycloak-admin';

@Injectable()
export class KeycloakAdminService {
    private readonly logger = new Logger(KeycloakAdminService.name);
    private kc: KeycloakAdminClient;

    constructor() {
        this.kc = new KeycloakAdminClient({
            baseUrl: process.env.KEYCLOAK_BASE_URL || 'http://keycloak:8080',
            realmName: process.env.KEYCLOAK_REALM || 'docker-admin',
        });
    }

    async init() {
        await this.kc.auth({
            grantType: 'client_credentials',
            clientId: process.env.KEYCLOAK_CLIENT_ID!,
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
        });
    }

    async listUsers() {
        await this.init();
        return this.kc.users.find();
    }

    async createUser(dto: { username: string; email?: string; password?: string }) {
        await this.init();

        const user = await this.kc.users.create({
            username: dto.username,
            email: dto.email,
            enabled: true,
        });

        if (dto.password) {
            await this.kc.users.resetPassword({
                id: user.id!,
                credential: {
                    temporary: false,
                    type: 'password',
                    value: dto.password,
                },
            });
        }

        return user;
    }
}
