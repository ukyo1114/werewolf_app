import { useState, useEffect, useCallback } from "react";
import axios from "axios";

import { Flex, Stack, Avatar } from "@chakra-ui/react";

import { useUserState } from "../../../../context/UserProvider.jsx";
import { errors, messages } from "../../../../messages";
import {
  SelectableBox,
  StyledText,
  EllipsisText,
} from "../../../../components/CustomComponents.jsx";
import { PHASE_MAP, RESULT_MAP } from "../../../../constants";
import useNotification from "../../../../commonHooks/useNotification";
import useJoinGame from "../../../../commonHooks/useJoinGame";
import { CustomButton } from "../../../../components/CustomComponents.jsx";
import ModalTemplete from "../../../../components/ModalTemplete.jsx";

const SpectatorModal = ({ isOpen, onClose }) => {
  const { user, currentChannel } = useUserState();
  const [gameList, setGameList] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const { _id: channelId } = currentChannel;
  const showToast = useNotification();
  const joinGame = useJoinGame();

  const fetchGameList = useCallback(async () => {
    if (!user.token || !channelId) return;

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`api/spectate/${channelId}`, config);

      setGameList(data);
    } catch (error) {
      showToast(
        error?.response?.data?.message || errors.FETCH_GAME_LIST,
        "error"
      );
    }
  }, [user.token, channelId, setGameList, showToast]);

  useEffect(() => {
    fetchGameList();
  }, [fetchGameList]);

  return (
    <ModalTemplete isOpen={isOpen} onClose={onClose} title={"ゲームリスト"}>
      <Stack w="100%" gap={6}>
        <Stack w="100%" gap={6}>
          {gameList.length > 0 ? (
            gameList.map((game) => {
              const { gameId, players, currentDay, currentPhase, result } =
                game;

              return (
                <SelectableBox
                  key={gameId}
                  bg={selectedGame === gameId ? "green.100" : "white"}
                  onClick={() => setSelectedGame(gameId)}
                >
                  <Stack width="100%" overflow="hidden">
                    <Flex px="2px" overflowX="hidden">
                      <EllipsisText mr={3}>{currentDay}日目</EllipsisText>
                      <EllipsisText mr={3}>
                        {PHASE_MAP[currentPhase]}
                      </EllipsisText>
                      <EllipsisText mr={3}>{RESULT_MAP[result]}</EllipsisText>
                    </Flex>

                    <Flex width="100%" gap="2px" overflowX="auto" px="2px">
                      {players.map((pl) => (
                        <Avatar
                          key={pl._id}
                          size="sm"
                          src={pl.pic}
                          borderRadius="md"
                        />
                      ))}
                    </Flex>
                  </Stack>
                </SelectableBox>
              );
            })
          ) : (
            <StyledText>{messages.NO_ACTIVE_GAME}</StyledText>
          )}
        </Stack>

        <CustomButton
          isDisabled={!selectedGame}
          onClick={() => joinGame(selectedGame)}
        >
          観戦
        </CustomButton>
      </Stack>
    </ModalTemplete>
  );
};

export default SpectatorModal;
