import { useCallback } from "react";
import axios from "axios";

import { useUserState } from "../context/UserProvider.jsx";
import useNotification from "./useNotification";
import { errors } from "../messages";

const useJoinGame = () => {
  const { user, chDispatch } = useUserState();
  const showToast = useNotification();

  const joinGame = useCallback(
    async (gameId) => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const {
          data: { game, users },
        } = await axios.get(`/api/game/join/${gameId}`, config);

        const payload = {
          _id: game._id,
          channel: {
            _id: game.channelId._id,
            channelName: game.channelId.channelName,
            channelDescription: game.channelId.channelDescription,
          },
          users,
        };
        chDispatch({ type: "JOIN_GAME", payload });
      } catch (error) {
        showToast(
          error?.response?.data?.message || errors.CHANNEL_ENTER_FAILED,
          "error"
        );
      }
    },
    [chDispatch, showToast, user.token]
  );

  return joinGame;
};

export default useJoinGame;
