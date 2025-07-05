import { Box, Flex, Text, Avatar } from "@chakra-ui/react";
import { EllipsisText } from "../../../components/CustomComponents";
import { useUserState } from "../../../context/UserProvider";

const DisplayMessage = ({ message, user }) => {
  const { isMobile } = useUserState();
  const messageBg = {
    werewolf: "pink.100",
    spectator: "purple.100",
  };

  return (
    <Flex gap={1} w="100%">
      <Avatar size={isMobile ? "md" : "lg"} src={user.pic} borderRadius="md" />

      <Flex direction="column" w="100%" overflowX="hidden">
        <Flex justify="space-between" align="center" w="100%" px={2}>
          <EllipsisText>{user.userName}</EllipsisText>
          <EllipsisText fontSize="sm">
            {new Date(message.createdAt).toLocaleString("ja-JP", {
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </EllipsisText>
        </Flex>

        <Box
          bg={messageBg[message.messageType] || "green.100"}
          borderRadius="lg"
          px={4}
          py={2}
          w="100%"
        >
          <Text color="black" whiteSpace="pre-wrap">
            {message.message}
          </Text>
        </Box>
      </Flex>
    </Flex>
  );
};

export default DisplayMessage;
