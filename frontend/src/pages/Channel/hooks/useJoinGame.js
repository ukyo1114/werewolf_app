import { useCallback } from "react";
import axios from "axios";

import { useUserState } from "../../../context/UserProvider.jsx";
import useNotification from "../../../commonHooks/useNotification";
import { errors } from "../../../messages";

const useJoinGame = () => {
  const { user, chDispatch } = useUserState();
  const showToast = useNotification();

  const joinGame = useCallback(
    async (gameId) => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const {
          data: { game },
        } = await axios.get(`/api/game/join/${gameId}`, config);

        chDispatch({ type: "JOIN_GAME", payload: game });
      } catch (error) {
        showToast(
          error?.response?.data?.error || errors.CHANNEL_ENTER_FAILED,
          "error"
        );
      }
    },
    [chDispatch, showToast, user.token]
  );

  return joinGame;
};

export default useJoinGame;
