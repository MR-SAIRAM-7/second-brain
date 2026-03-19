import mongoose, { Document, Schema } from 'mongoose';

export interface IKnowledgeItem extends Document {
  title: string;
  content: string;
  type: 'note' | 'link' | 'insight' | 'article' | 'idea' | 'document';
  url?: string;
  fileUrl?: string;
  filePublicId?: string;
  fileMimeType?: string;
  fileFormat?: string;
  fileResourceType?: string;
  extractedText?: string;
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
      enum: ['note', 'link', 'insight', 'article', 'idea', 'document'],
      required: true,
    },
    url: { type: String },
    fileUrl: { type: String }, // For Cloudinary URLs
    filePublicId: { type: String },
    fileMimeType: { type: String },
    fileFormat: { type: String },
    fileResourceType: { type: String },
    extractedText: { type: String },
    summary: { type: String },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<IKnowledgeItem>('KnowledgeItem', KnowledgeItemSchema);
