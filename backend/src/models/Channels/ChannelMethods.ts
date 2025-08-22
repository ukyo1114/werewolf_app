import bcrypt from 'bcryptjs';
import { IChannel, IUpdateChannelSetingsData } from './ChannelTypes';

// Channelインスタンスメソッド
export const ChannelMethods = {
  // パスワードの照合
  async matchPassword(
    this: IChannel,
    enteredPassword: string,
  ): Promise<boolean> {
    if (!this.password) throw new Error();
    return await bcrypt.compare(enteredPassword, this.password);
  },

  async softDelete(this: IChannel): Promise<void> {
    this.deletedAt = new Date();
    await this.save();
  },

  async update(
    this: IChannel,
    data: IUpdateChannelSetingsData,
  ): Promise<IChannel> {
    Object.assign(this, {
      channelName: data.channelName || this.channelName,
      channelDescription: data.channelDescription || this.channelDescription,
      passwordEnabled: data.passwordEnabled,
      password: data.password.length >= 8 ? data.password : this.password,
      denyGuests: data.denyGuests,
      numberOfPlayers: data.numberOfPlayers,
    });
    await this.save();
    return this;
  },
};
