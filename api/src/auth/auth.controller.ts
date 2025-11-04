import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorator/public.decorator';

@Controller('auth')
@Public()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    // dto.username puede ser tu email de KC: admin@ludycom.com
    return this.authService.login(dto.username, dto.password);
  }
}
