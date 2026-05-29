import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Workspace, WorkspaceDocument } from './workspace.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>,
    private usersService: UsersService,
  ) {}

  async create(name: string, currency: string, userId: string): Promise<WorkspaceDocument> {
    const workspace = new this.workspaceModel({
      name,
      currency,
      createdBy: new Types.ObjectId(userId),
      members: [new Types.ObjectId(userId)],
      splittingConfig: [{ userId: new Types.ObjectId(userId), percentage: 100 }],
    });
    return workspace.save();
  }

  async findByUser(userId: string): Promise<WorkspaceDocument[]> {
    return this.workspaceModel.find({ members: new Types.ObjectId(userId) }).exec();
  }

  async findById(id: string): Promise<WorkspaceDocument | null> {
    return this.workspaceModel.findById(id).exec();
  }

  async getSplittingConfig(workspaceId: string): Promise<{ userId: string; name: string; percentage: number }[]> {
    const workspace = await this.workspaceModel
      .findById(workspaceId)
      .populate('splittingConfig.userId', '_id name')
      .exec();
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    return workspace.splittingConfig
      .filter((entry: any) => entry.userId != null)
      .map((entry: any) => ({
        userId: entry.userId._id.toString(),
        name: entry.userId.name,
        percentage: entry.percentage,
      }));
  }

  async updateSplittingConfig(
    workspaceId: string,
    requestingUserId: string,
    entries: { userId: string; percentage: number }[],
  ): Promise<{ userId: string; name: string; percentage: number }[]> {
    const workspace = await this.workspaceModel.findById(workspaceId).exec();
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    if (workspace.createdBy.toString() !== requestingUserId) {
      throw new ForbiddenException('Only the workspace creator can update splitting config');
    }

    const uniqueUserIds = new Set(entries.map((e) => e.userId));
    if (uniqueUserIds.size !== entries.length) {
      throw new BadRequestException('Duplicate userIds in splitting config');
    }

    const memberIds = workspace.members.map((m) => m.toString());
    for (const entry of entries) {
      if (!memberIds.includes(entry.userId)) {
        throw new BadRequestException(`User ${entry.userId} is not a member of this workspace`);
      }
    }

    const sum = entries.reduce((acc, e) => acc + e.percentage, 0);
    if (Math.abs(sum - 100) > 0.01) {
      throw new BadRequestException('Percentages must sum to 100');
    }

    workspace.splittingConfig = entries.map((e) => ({
      userId: new Types.ObjectId(e.userId),
      percentage: e.percentage,
    }));
    await workspace.save();

    return this.getSplittingConfig(workspaceId);
  }

  async updateName(workspaceId: string, requestingUserId: string, name: string): Promise<WorkspaceDocument> {
    const workspace = await this.findById(workspaceId);
    if (!workspace) throw new NotFoundException('Workspace not found');
    if (workspace.createdBy.toString() !== requestingUserId) {
      throw new ForbiddenException('Only the workspace creator can rename the workspace');
    }
    workspace.name = name;
    return workspace.save();
  }

  async isMember(workspaceId: string, userId: string): Promise<boolean> {
    const workspace = await this.findById(workspaceId);
    if (!workspace) return false;
    return workspace.members.some((m) => m.toString() === userId);
  }

  async inviteUser(workspaceId: string, email: string): Promise<boolean> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const workspace = await this.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const alreadyMember = workspace.members.some((m) => m.toString() === user._id.toString());
    if (alreadyMember) {
      return true;
    }

    workspace.members.push(user._id as Types.ObjectId);
    // Add to splitting config with 0% initially (must be configured manually later)
    workspace.splittingConfig.push({ userId: user._id as Types.ObjectId, percentage: 0 });
    
    await workspace.save();
    return true;
  }

  async getMembers(workspaceId: string): Promise<any[]> {
    const workspace = await this.workspaceModel
      .findById(workspaceId)
      .populate('members', '_id name email')
      .exec();
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    return workspace.members.map((m: any) => ({
      id: m._id,
      name: m.name,
      email: m.email,
    }));
  }
}
