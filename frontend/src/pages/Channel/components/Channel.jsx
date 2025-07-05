import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Flex, Stack } from "@chakra-ui/react";

import { useUserState } from "../../../context/UserProvider.jsx";
import Chat from "./Chat.jsx";
import ChannelHeader from "../Header/ChannelHeader.jsx";
import GameHeader from "../Header/GameHeader.jsx";

const Channel = () => {
  const navigate = useNavigate();
  const { user, uDispatch, currentChannel, isMobile } = useUserState();
  const { _id: channelId, isGame, phase } = currentChannel;

  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");

    if (!userInfo) {
      navigate("/");
    } else {
      const userIn = JSON.parse(userInfo);
      uDispatch({ type: "LOGIN", payload: userIn });
    }
  }, [navigate, uDispatch]);

  useEffect(() => {
    if (!channelId) {
      navigate("/channel-list");
    }
  }, [channelId, navigate]);

  const bgConfig = !isGame
    ? {
        bgImage: "url('/The-citys-main-street2.jpg')",
        bgSize: "cover",
        bgPosition: "center",
        bgRepeat: "no-repeat",
      }
    : phase?.currentPhase === "night"
      ? {
          bgImage: "url('/night-sky3.jpg')",
          bgSize: "cover",
          bgPosition: "center",
          bgRepeat: "no-repeat",
        }
      : {
          bgImage: "url('/cafe2.jpg')",
          bgSize: "cover",
          bgPosition: "center",
          bgRepeat: "no-repeat",
        };

  if (!user.token) return null;

  return (
    <Flex
      justifyContent="center"
      w="100%"
      h="100dvh"
      overflow="hidden"
      {...bgConfig}
    >
      <Stack
        alignItems="center"
        maxW="container.lg"
        overflow="hidden"
        w="100%"
        m={isMobile ? 0 : 4}
        gap={isMobile ? 0 : 4}
      >
        {channelId && (isGame ? <GameHeader /> : <ChannelHeader />)}
        {channelId && <Chat key={channelId} />}
      </Stack>
    </Flex>
  );
};

export default Channel;
