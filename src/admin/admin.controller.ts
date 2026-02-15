import { Controller, Post, Get, Delete, Param } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Post('generate-invite')
  async generateInvite() {
    return this.adminService.generateInvite();
  }

  @Get('invites')
  async getInvites() {
    return this.adminService.getAllInvites();
  }

  @Get('users')
  async getUsers() {
    return this.adminService.getAllUsers();
  }

  @Delete('invites/:id')
  async deleteInvite(@Param('id') id: string) {
    return this.adminService.deleteInvite(id);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }
}