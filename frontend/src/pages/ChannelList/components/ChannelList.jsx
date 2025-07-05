// React and related
import { useEffect, useState, useCallback } from "react";

// External libraries
import {
  Box,
  Text,
  useDisclosure,
  Stack,
  Flex,
  Avatar,
} from "@chakra-ui/react";
import {
  FaCheck,
  FaEllipsisH,
  FaBan,
  FaLock,
  FaUserSlash,
} from "react-icons/fa";

// Internal components
import Header from "./Header";
import ChannelInfo from "./ChannelInfo";
import {
  EllipsisText,
  shadowProps,
} from "../../../components/CustomComponents";

// Internal hooks
import { useUserState } from "../../../context/UserProvider";
import { useAuthCheck } from "../../../commonHooks/useAuthCheck";
import useFetchChannelList from "../hooks/useFetchChannelList";
import { PasswordBadge, DenyGuestsBadge } from "../../../components/Badge";

const ChannelList = () => {
  // React hooks
  const [channelList, setChannelList] = useState([]);
  const [joinedChannels, setJoinedChannels] = useState([]);
  const [blockedChannels, setBlockedChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [showJoinedCh, setShowJoinedCh] = useState(false);
  const channelInfo = useDisclosure();

  // Custom hooks
  useAuthCheck();
  const { user, isMobile } = useUserState();
  const { fetchChannelList } = useFetchChannelList({
    setChannelList,
    setJoinedChannels,
    setBlockedChannels,
  });

  const handleChannelSelect = useCallback(
    (channel) => {
      const isBlocked = blockedChannels.includes(channel._id);
      const isJoined = joinedChannels.includes(channel._id);
      setSelectedChannel({ ...channel, isBlocked, isJoined });
      channelInfo.onOpen();
    },
    [blockedChannels, joinedChannels, channelInfo]
  );

  // Effects
  useEffect(() => {
    fetchChannelList();
  }, [fetchChannelList]);

  // Computed values
  const filteredChannelList = showJoinedCh
    ? channelList.filter((channel) => joinedChannels.includes(channel._id))
    : channelList.filter((channel) => !blockedChannels.includes(channel._id));

  if (!user.token) return null;

  return (
    <Flex
      justifyContent="center"
      w="100%"
      h="100dvh"
      overflow="hidden"
      bgImage="url('/cork-board2.jpg')"
      bgSize="cover"
      bgPosition="center"
      bgRepeat="no-repeat"
    >
      <Stack
        alignItems="center"
        maxW="container.lg"
        overflow="hidden"
        w="100%"
        mx={isMobile ? 0 : 4}
        pt={isMobile ? 0 : 4}
        spacing={isMobile ? 0 : 4}
      >
        <Header showJoinedCh={showJoinedCh} setShowJoinedCh={setShowJoinedCh} />
        <Box
          position="relative"
          w="100%"
          flex="1 1 0%"
          h={isMobile ? "calc(100dvh - 110px)" : "calc(100dvh - 140px)"}
          overflowY="auto"
        >
          <Stack spacing={6} m={isMobile ? 4 : 0}>
            {channelList.length === 0
              ? [...Array(3)].map((_, idx) => (
                  <Box
                    key={idx}
                    p={5}
                    w={isMobile ? "100%" : "80%"}
                    borderRadius="lg"
                    boxShadow="lg"
                    bg="rgba(255,255,255,0.7)"
                    style={{ backdropFilter: "blur(2px)" }}
                    {...(isMobile
                      ? {}
                      : idx % 2 === 0
                        ? { ml: "auto" }
                        : { mr: "auto" })}
                    minH="88px"
                  />
                ))
              : filteredChannelList.map((channel, idx) => {
                  if (!channel.channelAdmin) return null;

                  const isJoined = joinedChannels.includes(channel._id);
                  const isBlocked = blockedChannels.includes(channel._id);

                  // デスクトップ時のみ幅80%、左右互い違い（偶数:右寄せ, 奇数:左寄せ）
                  const boxWidth = isMobile ? "100%" : "80%";
                  const boxMargin = isMobile
                    ? undefined
                    : idx % 2 === 0
                      ? { ml: "auto" }
                      : { mr: "auto" };

                  return (
                    <Box
                      data-key={channel._id}
                      onClick={() => handleChannelSelect(channel)}
                      cursor="pointer"
                      p={5}
                      w={boxWidth}
                      key={channel._id}
                      borderRadius="lg"
                      {...shadowProps}
                      _hover={{
                        filter: "brightness(1.05) saturate(1.2)",
                        transform: "translateY(-2px)",
                        ...shadowProps,
                      }}
                      bgImage="url('/blank-map5.jpg')"
                      bgSize="cover"
                      bgPosition="center"
                      {...boxMargin}
                    >
                      <Flex
                        justify="space-between"
                        align="center"
                        width="100%"
                        gap={4}
                      >
                        <Avatar
                          size={isMobile ? "md" : "lg"}
                          src={channel.channelAdmin.pic}
                          borderRadius={isMobile ? "md" : "lg"}
                        />

                        <Stack
                          textAlign="left"
                          w="100%"
                          overflow="hidden"
                          spacing={isMobile ? 0 : 2}
                        >
                          <Text fontSize="xl" fontWeight="bold">
                            {isJoined && (
                              <FaCheck
                                color="#38A169"
                                style={{ display: "inline", marginLeft: 8 }}
                              />
                            )}{" "}
                            {isBlocked && (
                              <FaBan
                                color="#C53030"
                                style={{ display: "inline", marginLeft: 8 }}
                              />
                            )}{" "}
                            {channel.channelName}
                          </Text>
                          <EllipsisText color="gray.700">
                            作成者：{channel.channelAdmin.userName}
                          </EllipsisText>
                          <Flex
                            gap={3}
                            fontSize="sm"
                            color="gray.600"
                            alignItems="center"
                          >
                            <Text>プレイ人数：{channel.numberOfPlayers}人</Text>
                            {channel.passwordEnabled &&
                              (isMobile ? (
                                <FaLock
                                  color="#3182ce"
                                  style={{ fontSize: 16 }}
                                />
                              ) : (
                                <PasswordBadge />
                              ))}
                            {channel.denyGuests &&
                              (isMobile ? (
                                <FaUserSlash
                                  color="#805ad5"
                                  style={{ fontSize: 16 }}
                                />
                              ) : (
                                <DenyGuestsBadge />
                              ))}
                          </Flex>
                        </Stack>

                        <Box color="gray.700">
                          <FaEllipsisH />
                        </Box>
                      </Flex>
                    </Box>
                  );
                })}
          </Stack>
        </Box>

        {selectedChannel && (
          <ChannelInfo
            selectedChannel={selectedChannel}
            isOpen={channelInfo.isOpen}
            onClose={channelInfo.onClose}
          />
        )}
      </Stack>
    </Flex>
  );
};

export default ChannelList;
