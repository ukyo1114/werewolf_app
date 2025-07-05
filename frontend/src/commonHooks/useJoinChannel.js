import { useCallback } from "react";
import axios from "axios";
import { useUserState } from "../context/UserProvider.jsx";
import useNotification from "./useNotification";
import { errors } from "../messages";
import { useNavigate } from "react-router-dom";

export const useJoinChannel = () => {
  const { user, chDispatch } = useUserState();
  const showToast = useNotification();
  const navigate = useNavigate();
  const joinChannel = useCallback(
    async (channelId, password) => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };

        const {
          data: {
            channelName,
            channelDescription,
            channelAdmin,
            channelUsers,
            numberOfPlayers,
          },
        } = await axios.put(
          `/api/channel/join/${channelId}`,
          { password: password || null },
          config
        );

        const channel = {
          _id: channelId,
          channelName,
          channelDescription,
          channelAdmin,
          users: channelUsers,
          numberOfPlayers,
        };

        chDispatch({ type: "JOIN_CHANNEL", payload: channel });
        navigate("/channel");
      } catch (error) {
        showToast(
          error?.response?.data?.message || errors.CHANNEL_ENTER_FAILED,
          "error"
        );
      }
    },
    [user.token, chDispatch, showToast, navigate]
  );

  return joinChannel;
};
