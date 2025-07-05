import { useState, useCallback } from "react";
import axios from "axios";
import { useUserState } from "../../../context/UserProvider.jsx";
import useNotification from "../../../commonHooks/useNotification";

const useChatMessages = ({ messages, mDispatch, messagesCompletedRef }) => {
  const [loading, setLoading] = useState(false);
  const { user, currentChannel } = useUserState();
  const { _id: channelId, phase } = currentChannel;
  const showToast = useNotification();

  const fetchMessages = useCallback(async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
        params: {
          messageId:
            messages.length > 0 ? messages[messages.length - 1]._id : null,
        },
      };

      setLoading(true);

      const { data } = await axios.get(`/api/message/${channelId}`, config);

      if (data.length < 50) messagesCompletedRef.current = true;

      const uniqueMessages = data.filter(
        (newMsg) => !messages.some((msg) => msg._id === newMsg._id)
      );

      if (uniqueMessages.length > 0) {
        const allMessages = [...messages, ...uniqueMessages].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        mDispatch({ type: "FETCH_MESSAGES", payload: allMessages });
      }

      setLoading(false);
    } catch (error) {
      showToast(
        error?.response?.data?.message || "メッセージの読み込みに失敗しました",
        "error"
      );
    }
  }, [
    channelId,
    user.token,
    messagesCompletedRef,
    messages,
    mDispatch,
    showToast,
  ]);

  const canSendMessage = useCallback(() => {
    if (
      user.status === "alive" && // ステータスはgameStateに移行
      user.role && // 役職はgameStateに移行
      user.role !== "werewolf" &&
      phase.currentPhase === "night"
    ) {
      showToast("発言が禁止されています", "error");
      return false;
    }
    return true;
  }, [user, phase, showToast]);

  const sendMessage = useCallback(
    async (newMessage) => {
      if (!canSendMessage()) return;

      try {
        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
        await axios.post(
          `/api/message/${channelId}`,
          { message: newMessage },
          config
        );
      } catch (error) {
        showToast(
          error?.response?.data?.message || "メッセージの送信に失敗しました",
          "error"
        );
      }
    },
    [canSendMessage, user.token, channelId, showToast]
  );

  return { loading, fetchMessages, sendMessage };
};

export default useChatMessages;
