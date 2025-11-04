// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { RolesGuard } from './guard/roles.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';


@Module({
    providers: [
        AuthService,
        // 1º: que valide el token
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        // 2º: que revise los roles
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
    ],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule { }
