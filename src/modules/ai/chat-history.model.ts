import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

export interface IChatHistory extends Document {
  userId: mongoose.Types.ObjectId;
  messages: IChatMessage[];
  context?: any;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ChatHistorySchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    messages: [ChatMessageSchema],
    context: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

export const ChatHistoryModel = mongoose.models.ChatHistory || mongoose.model<IChatHistory>('ChatHistory', ChatHistorySchema);
