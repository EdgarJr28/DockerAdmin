import { Module } from '@nestjs/common';
import { KeycloakAdminService } from './keycloak.service';
import { IamController } from './iam.controller';

@Module({
  providers: [KeycloakAdminService],
  controllers: [IamController],
  exports: [KeycloakAdminService],
})
export class IamModule {}
