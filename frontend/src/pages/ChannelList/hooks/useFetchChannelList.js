import { useCallback } from "react";
import { useUserState } from "../../../context/UserProvider";
import axios from "axios";
import { errors } from "../../../messages";
import useNotification from "../../../commonHooks/useNotification";

const useFetchChannelList = ({
  setChannelList,
  setJoinedChannels,
  setBlockedChannels,
}) => {
  const { user } = useUserState();
  const showToast = useNotification();

  const fetchChannelList = useCallback(async () => {
    if (!user.token) return;

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };

      const {
        data: { channelList, joinedChannels, blockedChannels },
      } = await axios.get("/api/channel/list", config);
      if (
        !Array.isArray(channelList) ||
        !Array.isArray(joinedChannels) ||
        !Array.isArray(blockedChannels)
      )
        throw new Error();

      setChannelList(channelList);
      setJoinedChannels(joinedChannels || []);
      setBlockedChannels(blockedChannels || []);
    } catch (error) {
      showToast(
        error?.response?.data?.message || errors.FETCH_CHANNEL_LIST,
        "error"
      );
      // エラー時は空の配列をセット
      setChannelList([]);
      setJoinedChannels([]);
      setBlockedChannels([]);
    }
  }, [
    user.token,
    showToast,
    setChannelList,
    setJoinedChannels,
    setBlockedChannels,
  ]);

  return { fetchChannelList };
};

export default useFetchChannelList;
