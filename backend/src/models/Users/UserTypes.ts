import { Document, Types, Model } from 'mongoose';

/**
 * ユーザーインスタンスのインターフェイス
 * ドキュメントの基本プロパティとインスタンスメソッドを含む
 */
export interface IUser extends Document {
  _id: Types.ObjectId;
  userName: string; // ユーザー名（一意）
  email: string | undefined; // メールアドレス（ゲストユーザーは未定義）
  password: string | undefined; // パスワードハッシュ（ゲストユーザーはnull）
  pic: string | undefined; // プロフィール画像URL
  isGuest: boolean; // ゲストユーザーフラグ
  deletedAt: Date | undefined; // ソフトデリートフラグ（削除日時）
  matchPassword(enteredPassword: string): Promise<boolean>; // パスワード照合
  isModified: (path: string) => boolean; // フィールド変更チェック
  createdAt: Date; // 作成日時
  updatedAt: Date; // 更新日時
}

/**
 * ユーザーモデルの静的メソッドインターフェイス
 * クラスレベルで実行されるメソッドを定義
 */
export interface IUserStatics extends Model<IUser> {
  isGuestUser(userId: string): Promise<boolean>; // ゲストユーザー判定
  login(email: string, password: string): Promise<IUser>; // ログイン認証
  updateEmail(userId: string, email: string): Promise<void>; // メールアドレス更新
  changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void>; // パスワード変更
  resetPassword(email: string, password: string): Promise<void>; // パスワードリセット
  softDeleteUser(userId: string): Promise<void>; // ユーザーソフトデリート
  restoreUser(userId: string): Promise<void>; // ユーザー復元
  isEmailRecentlyDeleted(email: string): Promise<boolean>; // 削除済みメールアドレスチェック
  findActiveUserByEmail(email: string): Promise<IUser | null>; // アクティブユーザー検索
}
