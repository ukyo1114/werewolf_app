import { Skeleton, VStack } from "@chakra-ui/react";

const ChatLoading = () => {
  return (
    <VStack spacing={4} align="stretch" p={4} w="100%">
      {[...Array(6)].map((_, index) => (
        <Skeleton
          key={index}
          height="45px"
          width="100%"
          borderRadius="md"
          speed={1.5}
        />
      ))}
    </VStack>
  );
};

export default ChatLoading;
