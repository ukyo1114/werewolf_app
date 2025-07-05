import { Flex, Avatar, Stack } from "@chakra-ui/react";
import { EllipsisText } from "./CustomComponents.jsx";
import { useUserState } from "../context/UserProvider.jsx";

const DisplayUser = ({ children, user, ...props }) => {
  const { isMobile } = useUserState();

  return (
    <Flex
      alignItems="center"
      p={isMobile ? 2 : 4}
      borderRadius="lg"
      boxShadow="md"
      bg="white"
      gap={isMobile ? 2 : 4}
      {...props}
      overflow="hidden"
      w="100%"
      flexShrink={0}
    >
      <Avatar
        size={isMobile ? "md" : "lg"}
        src={user.pic}
        borderRadius={isMobile ? "md" : "lg"}
      />
      <Stack flexDir="column" overflow="hidden" gap={isMobile ? 0 : 2} w="100%">
        <EllipsisText fontSize="lg">{user.userName}</EllipsisText>
        <Flex gap={4}>
          {children}
          {/* {user.isGuest && <GuestBadge />} */}
        </Flex>
      </Stack>
    </Flex>
  );
};

export default DisplayUser;
