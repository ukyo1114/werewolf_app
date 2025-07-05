import { Stack, Divider, Text, Flex } from "@chakra-ui/react";
import { useUserState } from "../context/UserProvider.jsx";
import ModalTemplete from "./ModalTemplete.jsx";

const DisplayChDescription = ({ mode = "channel", isOpen, onClose }) => {
  const { currentChannel, isMobile } = useUserState();
  const { channelName, channelDescription } =
    mode === "channel" ? currentChannel : currentChannel.channel;

  return (
    <ModalTemplete isOpen={isOpen} onClose={onClose} title={"チャンネル情報"}>
      <Stack overflow="auto" spacing={6}>
        <Stack>
          <Text fontSize="lg" fontWeight="bold" textAlign="center">
            {channelName}
          </Text>
        </Stack>

        <Divider borderColor="gray.500" />

        <Stack>
          <Text fontWeight="bold">説明：</Text>
          <Text
            overflow="auto"
            whiteSpace="pre-wrap"
            bg="gray.50"
            p={isMobile ? 2 : 4}
            borderRadius="md"
            maxH="350px"
            color="gray.800"
          >
            {channelDescription}
          </Text>
        </Stack>

        {currentChannel.numberOfPlayers && (
          <Flex>
            <Text fontWeight="bold" mr={2}>
              プレイ人数：
            </Text>
            <Text color="gray.600">{currentChannel.numberOfPlayers}人</Text>
          </Flex>
        )}
      </Stack>
    </ModalTemplete>
  );
};

export default DisplayChDescription;
