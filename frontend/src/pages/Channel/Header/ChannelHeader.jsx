import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { Flex, Button, useDisclosure, Text } from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";

import { useUserState } from "../../../context/UserProvider";
import useNotification from "../../../commonHooks/useNotification";
import useJoinGame from "../../../commonHooks/useJoinGame";
import UserList from "../../../components/UserList";
import { EllipsisText } from "../../../components/CustomComponents";
import ProfileMenu from "../../../components/profile/ProfileMenu";
import HeaderTemp from "./HeaderTemp";
import ChannelMenu from "./ChannelMenu";

const ChannelHeader = () => {
  const { user, currentChannel, isMobile } = useUserState();
  const [users, setUsers] = useState([]);
  const [entryButtonState, setEntryButtonState] = useState(false);
  const showToast = useNotification();
  const userList = useDisclosure();
  const { _id: channelId, channelName } = currentChannel;
  const joinGame = useJoinGame();

  const entrySocketRef = useRef(null);

  useEffect(() => {
    if (entrySocketRef.current) return;

    const auth = { auth: { token: user.token, channelId } };
    entrySocketRef.current = io(`${import.meta.env.VITE_SERVER_URL}/entry`, {
      ...auth,
      withCredentials: true,
      transports: ["websocket"],
      path: "/socket.io",
    });

    entrySocketRef.current.on("connect_response", (data) => {
      setUsers(data.users);
    });

    entrySocketRef.current.on("entryUpdate", (data) => {
      setUsers(data);
    });

    entrySocketRef.current.on("gameStart", async (gameId) => {
      await joinGame(gameId);
    });

    entrySocketRef.current.on("connect_error", (err) => {
      entrySocketRef.current.disconnect();
    });

    return () => {
      entrySocketRef.current.disconnect();
    };
  }, [user.token, channelId, joinGame]);

  useEffect(() => {
    setEntryButtonState(users.some((u) => u === user.userId));
  }, [users, user.userId, setEntryButtonState]);

  return (
    <HeaderTemp title={channelName}>
      <Text
        as="h2"
        fontSize={isMobile ? "lg" : "xl"}
        fontWeight="bold"
        color="gray.800"
        letterSpacing="wider"
      >
        {channelName}
      </Text>

      <Flex alignItems="center" gap={isMobile ? 2 : 4}>
        <Button
          data-testid="entry-button" // テスト用
          colorScheme={entryButtonState ? "pink" : "blue"}
          borderWidth="1px"
          variant="outline"
          size={isMobile ? "sm" : "md"}
          boxShadow="md"
          bg="rgba(255,255,255,0.3)"
          backdropFilter="blur(1px)"
          _hover={{
            transform: "translateY(-2px)",
            boxShadow: "lg",
          }}
          onClick={() => {
            if (entryButtonState) {
              entrySocketRef.current.emit("cancelEntry", (response) => {
                if (!response.success) {
                  showToast(
                    response.message ||
                      "エントリーをキャンセルできませんでした",
                    "error"
                  );
                }
              });
            } else {
              entrySocketRef.current.emit("registerEntry", (response) => {
                if (!response.success) {
                  showToast(
                    response.message || "エントリーに失敗しました",
                    "error"
                  );
                }
              });
            }
          }}
        >
          {entryButtonState ? "取消" : "参加"}
        </Button>

        <EllipsisText
          fontSize={isMobile ? "md" : "lg"}
          onClick={userList.onOpen}
          cursor="pointer"
          display="flex"
          alignItems="center"
          px={2}
          py="5px"
          borderRadius="md"
          border="1px solid"
          backdropFilter="blur(1px)"
          _hover={{
            transform: "translateY(-2px)",
            boxShadow: "lg",
          }}
          boxShadow="md"
        >
          {users.length}/{currentChannel.numberOfPlayers}人
          <ChevronDownIcon ml={1} />
        </EllipsisText>

        <ProfileMenu />

        {isMobile && <ChannelMenu />}
      </Flex>

      {users && currentChannel.users && (
        <UserList
          isOpen={userList.isOpen}
          onClose={userList.onClose}
          title={"エントリー中のユーザー"}
          userList={currentChannel.users.filter((user) =>
            users.some((u) => u === user._id)
          )}
        />
      )}
    </HeaderTemp>
  );
};

export default ChannelHeader;
