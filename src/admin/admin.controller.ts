import { Controller, Post } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('generate-invite')
  async generateInvite() {
    return this.adminService.generateInvite();
  }
}
