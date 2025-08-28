import { Document, Types, Model, ClientSession } from 'mongoose';

/**
 * ユーザーインスタンスのインターフェイス
 * ドキュメントの基本プロパティとインスタンスメソッドを含む
 */
export interface IUser extends Document {
  _id: Types.ObjectId;
  userName: string; // ユーザー名（一意）
  email?: string; // メールアドレス（ゲストユーザーは未定義）
  password?: string; // パスワードハッシュ（ゲストユーザーはnull）
  pic?: string; // プロフィール画像URL
  isGuest: boolean; // ゲストユーザーフラグ
  deletedAt?: Date; // ソフトデリートフラグ（削除日時）
  matchPassword(enteredPassword: string): Promise<void>; // パスワード照合
  changePassword(currentPassword: string, newPassword: string): Promise<void>; // パスワード認証と更新
  resetPassword(password: string): Promise<void>; // パスワードリセット
  updateEmail(email: string): Promise<void>; // メールアドレス更新
  updateProfile(data: { userName?: string; pic?: string }): Promise<void>; // プロフィール更新
  isModified: (path: string) => boolean; // フィールド変更チェック
  createdAt: Date; // 作成日時
  updatedAt: Date; // 更新日時
}

/**
 * ユーザーモデルの静的メソッドインターフェイス
 * クラスレベルで実行されるメソッドを定義
 */
export interface IUserStatics extends Model<IUser> {
  isGuest(userId: string): Promise<boolean>; // ゲストユーザー判定
  register(userName: string, email: string, password: string): Promise<string>; // ユーザー登録
  login(email: string, password: string): Promise<IUser>; // ログイン認証
  loginAsGuest(): Promise<IUser>; // ゲストユーザー作成
  updateEmail(userId: string, email: string): Promise<void>; // メールアドレス更新
  changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void>; // パスワード変更
  resetPassword(email: string, password: string): Promise<void>; // パスワードリセット
  findActiveUserById(userId: string, session?: ClientSession): Promise<IUser>; // アクティブユーザー検索
  softDelete(userId: string, session?: ClientSession): Promise<void>; // ユーザーソフトデリート
  checkEmailRecentlyDeleted(email: string): Promise<void>; // 削除済みメールアドレスチェック
  checkEmailAvailable(email: string): Promise<void>; // メールアドレス利用可能チェック
  checkEmailRegisterd(email: string): Promise<void>; // メールアドレス登録済みチェック
  findActiveUserByEmail(email: string): Promise<IUser>; // アクティブユーザー検索
  updateProfile(
    userId: string,
    data: { userName?: string; pic?: string },
  ): Promise<void>; // プロフィール更新
  authChangeEmail(
    userId: string,
    email: string,
    currentPassword: string,
  ): Promise<void>; // メールアドレス変更認証
}
