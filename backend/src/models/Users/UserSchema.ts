import { Schema } from 'mongoose';

export const UserSchema = new Schema(
  {
    userName: {
      type: String,
      maxlength: 20,
      default: 'ゲスト',
    },
    email: {
      type: String,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      unique: true,
      sparse: true, // null値の重複を許可
    },
    password: { type: String, minlength: 8 },
    pic: { type: String },
    isGuest: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

// インデックス
UserSchema.index({ email: 1, deletedAt: 1 });
