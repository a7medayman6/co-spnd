import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WorkspaceDocument = Workspace & Document;

@Schema()
export class Workspace {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  currency: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  members: Types.ObjectId[];

  @Prop({
    type: [
      {
        userId: { type: Types.ObjectId, ref: 'User' },
        percentage: { type: Number, required: true },
        _id: false,
      },
    ],
    default: [],
  })
  splittingConfig: { userId: Types.ObjectId; percentage: number }[];

  @Prop({ type: [String], default: [] })
  customCategories: string[];
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
