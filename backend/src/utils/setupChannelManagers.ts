import { appState } from '../config/appState';
import Channels from '../models/Channels';
import ChannelManager from '../classes/ChannelManager';
import EntryManager from '../classes/EntryManager';

const { channelManagers, entryManagers } = appState;

export default async function setupChannelManagers(): Promise<void> {
  const channels = await Channels.find({ deletedAt: { $exists: false } });
  if (channels.length === 0) return;
  channels.forEach((channel) => {
    const channelId = channel._id.toString();
    const numberOfPlayers = channel.numberOfPlayers;
    channelManagers[channelId] = new ChannelManager(channelId);
    entryManagers[channelId] = new EntryManager(channelId, numberOfPlayers);
  });
}
