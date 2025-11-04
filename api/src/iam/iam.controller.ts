import { Controller, Get, Post, Body } from '@nestjs/common';
import { KeycloakAdminService } from './keycloak.service';
import { Public } from 'src/auth/decorator/public.decorator';


@Controller('iam')
@Public()
export class IamController {
    constructor(private readonly kc: KeycloakAdminService) { }

    @Get('users')
    async listUsers() {
        return this.kc.listUsers();
    }

    @Post('users')
    async createUser(
        @Body() body: { username: string; email?: string; password?: string },
    ) {
        return this.kc.createUser(body);
    }
}
