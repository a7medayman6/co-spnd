import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto, InviteUserDto, UpdateSplittingConfigDto, UpdateWorkspaceDto } from './workspace.dto';
import { WorkspaceMemberGuard } from './workspace-member.guard';

@Controller('workspaces')
@UseGuards(AuthGuard('jwt'))
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  @Post()
  async create(@Request() req: any, @Body() createWorkspaceDto: CreateWorkspaceDto) {
    const workspace = await this.workspacesService.create(
      createWorkspaceDto.name,
      createWorkspaceDto.currency,
      req.user.userId,
    );
    return {
      id: workspace._id,
      name: workspace.name,
      currency: workspace.currency,
      createdBy: workspace.createdBy,
      splittingConfig: workspace.splittingConfig,
    };
  }

  @Get()
  async findAll(@Request() req: any) {
    const workspaces = await this.workspacesService.findByUser(req.user.userId);
    return workspaces.map((w) => ({
      id: w._id,
      name: w.name,
      currency: w.currency,
      membersCount: w.members.length,
      createdBy: w.createdBy,
    }));
  }

  @Patch(':workspaceId')
  @UseGuards(WorkspaceMemberGuard)
  async update(
    @Param('workspaceId') workspaceId: string,
    @Request() req: any,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    const workspace = await this.workspacesService.updateName(workspaceId, req.user.userId, dto.name);
    return {
      id: workspace._id,
      name: workspace.name,
      currency: workspace.currency,
      createdBy: workspace.createdBy,
    };
  }

  @Post(':workspaceId/invite')
  @UseGuards(WorkspaceMemberGuard)
  async invite(@Param('workspaceId') workspaceId: string, @Body() inviteUserDto: InviteUserDto) {
    await this.workspacesService.inviteUser(workspaceId, inviteUserDto.email);
    return { success: true };
  }

  @Get(':workspaceId/members')
  @UseGuards(WorkspaceMemberGuard)
  async getMembers(@Param('workspaceId') workspaceId: string) {
    return this.workspacesService.getMembers(workspaceId);
  }

  @Get(':workspaceId/splitting-config')
  @UseGuards(WorkspaceMemberGuard)
  async getSplittingConfig(@Param('workspaceId') workspaceId: string) {
    return this.workspacesService.getSplittingConfig(workspaceId);
  }

  @Patch(':workspaceId/splitting-config')
  @UseGuards(WorkspaceMemberGuard)
  async updateSplittingConfig(
    @Param('workspaceId') workspaceId: string,
    @Request() req: any,
    @Body() dto: UpdateSplittingConfigDto,
  ) {
    return this.workspacesService.updateSplittingConfig(workspaceId, req.user.userId, dto.splittingConfig);
  }
}
