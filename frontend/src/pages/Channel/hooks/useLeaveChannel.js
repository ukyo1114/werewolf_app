import axios from "axios";

import { useUserState } from "../../../context/UserProvider";
import useNotification from "../../../commonHooks/useNotification";
import { messages } from "../../../messages";

const useLeaveChannel = () => {
  const { chDispatch, currentChannel, user } = useUserState();
  const { _id: channelId, channelAdmin } = currentChannel;
  const isAdmin = channelAdmin === user.userId;
  const showToast = useNotification();

  const leaveChannel = async () => {
    if (isAdmin) return;

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`/api/channel/leave/${channelId}`, config);

      showToast(messages.LEFT_CHANNEL, "success");
      chDispatch({ type: "LEAVE_CHANNEL" });
    } catch (error) {
      showToast(
        error?.response?.data?.message || "退出に失敗しました",
        "error"
      );
    }
  };

  return [leaveChannel];
};

export default useLeaveChannel;
