import { IBlockedUserList } from '../../models/BlockedUsers/BlockedUserTypes';

export interface IBlockService {
  getBlockedUserList(
    userId: string,
    channelId: string,
  ): Promise<IBlockedUserList[]>;
  registerBlockUser(
    userId: string,
    selectedUser: string,
    channelId: string,
  ): Promise<void>;
  cancelBlock(
    userId: string,
    selectedUser: string,
    channelId: string,
  ): Promise<void>;
}
