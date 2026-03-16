import mongoose, { Document, Schema } from 'mongoose';

export interface IKnowledgeItem extends Document {
  title: string;
  content: string;
  type: 'note' | 'link' | 'insight' | 'document';
  url?: string;
  fileUrl?: string;
  summary?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeItemSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ['note', 'link', 'insight', 'document'],
      required: true,
    },
    url: { type: String },
    fileUrl: { type: String }, // For Cloudinary URLs
    summary: { type: String },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<IKnowledgeItem>('KnowledgeItem', KnowledgeItemSchema);
