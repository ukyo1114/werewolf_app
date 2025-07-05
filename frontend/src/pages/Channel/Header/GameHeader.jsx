import { useCallback, useMemo, useEffect, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
import Countdown from "react-countdown";
import { Flex, Text } from "@chakra-ui/react";

import { useUserState } from "../../../context/UserProvider";
import useNotification from "../../../commonHooks/useNotification";
import { useJoinChannel } from "../../../commonHooks/useJoinChannel";
import { errors } from "../../../messages";
import { PHASE_MAP, PHASE_DURATIONS } from "../../../constants";
import { DisplayPhase } from "../../../components/CustomComponents";
import ProfileMenu from "../../../components/profile/ProfileMenu";
import HeaderTemp from "./HeaderTemp";
import GameMenu from "./GameMenu";
import { RoleBadge } from "../../../components/Badge";

const GameHeader = () => {
  const { user, uDispatch, currentChannel, chDispatch, isMobile } =
    useUserState();
  const { _id: channelId, channel, isGame, phase } = currentChannel;
  const { currentDay, currentPhase, changedAt } = phase;
  const showToast = useNotification();
  const gameSocketRef = useRef(null);
  const joinChannel = useJoinChannel();

  const fetchUserState = useCallback(async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };

      const { data } = await axios.get(
        `/api/game/player-state/${channelId}`,
        config
      );
      uDispatch({ type: "JOIN_GAME", payload: data });
    } catch (error) {
      showToast(
        error?.response?.data?.message || errors.PLAYER_LOAD_FAILED,
        "error"
      );
    }
  }, [showToast, user.token, channelId, uDispatch]);

  const timerEnd = useMemo(() => {
    const duration = PHASE_DURATIONS[currentPhase] * 1000;
    return new Date(changedAt).getTime() + duration;
  }, [currentPhase, changedAt]);

  useEffect(() => {
    if (isGame) fetchUserState();

    return () => uDispatch({ type: "LEAVE_GAME" });
  }, [isGame, fetchUserState, uDispatch]);

  useEffect(() => {
    if (gameSocketRef.current || !isGame) return;

    const auth = { auth: { token: user.token } };
    gameSocketRef.current = io(`${import.meta.env.VITE_SERVER_URL}/game`, auth);

    gameSocketRef.current.on("connect", async () => {
      try {
        const { gameState } = await gameSocketRef.current.emitWithAck(
          "joinGame",
          channelId
        );

        if (!gameState) {
          showToast(errors.GAME_NOT_FOUND, "error");
          await joinChannel(channel._id);
        }

        chDispatch({ type: "UPDATE_GAME_STATE", payload: gameState });
        uDispatch({ type: "UPDATE_STATUS", payload: gameState });
      } catch (error) {
        showToast(
          error?.response?.data?.message || errors.CONNECTION_FAILED,
          "error"
        );
        gameSocketRef.current.disconnect();
      }
    });

    gameSocketRef.current.on("updateGameState", (gameState) => {
      chDispatch({ type: "UPDATE_GAME_STATE", payload: gameState });
      uDispatch({ type: "UPDATE_STATUS", payload: gameState });
    });

    gameSocketRef.current.on("connect_error", (err) =>
      showToast(err.message, "error")
    );

    return () => {
      if (gameSocketRef.current) {
        gameSocketRef.current.disconnect();
      }
    };
  }, [
    isGame,
    user.token,
    channelId,
    channel,
    showToast,
    uDispatch,
    chDispatch,
    joinChannel,
  ]);

  return (
    <HeaderTemp>
      <Flex
        alignItems="center"
        backdropFilter="blur(1px)"
        bg="rgba(255,255,255,0.3)"
      >
        <DisplayPhase mr={2}>{currentDay}日目</DisplayPhase>
        <DisplayPhase>{PHASE_MAP[currentPhase || "pre"]}</DisplayPhase>
      </Flex>

      {currentPhase && changedAt && (
        <Countdown
          key={timerEnd}
          date={timerEnd}
          renderer={({ minutes, seconds }) => (
            <Text
              fontSize="xl"
              fontWeight="bold"
              fontFamily="'Comic Sans MS', cursive"
              letterSpacing="0.2em"
            >
              {minutes * 60 + seconds}
            </Text>
          )}
        />
      )}

      <Flex alignItems="center" gap={isMobile ? 2 : 4}>
        <RoleBadge role={user.role || "spectator"} />

        <ProfileMenu />

        {isMobile && <GameMenu />}
      </Flex>
    </HeaderTemp>
  );
};

export default GameHeader;
