import { Stack, Divider, Text, Box, Heading } from "@chakra-ui/react";
import { useUserState } from "../../context/UserProvider.jsx";

export const DisplayChDescription = ({ mode = "channel" }) => {
  const { currentChannel } = useUserState();
  const { channelName, channelDescription } =
    mode === "channel" ? currentChannel : currentChannel.channel;

  return (
    <Stack
      overflow="hidden"
      spacing={4}
      p={4}
      bg="white"
      borderRadius="md"
      boxShadow="sm"
    >
      <Box>
        <Heading as="h2" size="md" mb={2} color="gray.700">
          チャンネル名
        </Heading>
        <Text fontSize="lg" fontWeight="medium" color="gray.800">
          {channelName}
        </Text>
      </Box>

      <Divider borderWidth={1} borderColor="gray.200" />

      <Box>
        <Heading as="h3" size="sm" mb={2} color="gray.700">
          説明
        </Heading>
        <Text
          fontSize="md"
          color="gray.600"
          overflow="auto"
          whiteSpace="pre-wrap"
          lineHeight="tall"
          bg="gray.50"
          p={3}
          borderRadius="md"
        >
          {channelDescription || "説明はありません"}
        </Text>
      </Box>
    </Stack>
  );
};
