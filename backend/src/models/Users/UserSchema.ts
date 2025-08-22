import { Schema } from 'mongoose';

export const UserSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      maxlength: 20,
      default: 'ゲスト',
    },
    email: {
      type: String,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: { type: String, minlength: 8 },
    pic: { type: String },
    isGuest: { type: Boolean, default: false, required: true },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

// インデックス
UserSchema.index({ email: 1, deletedAt: 1 });
