import { Flex, Avatar } from "@chakra-ui/react";
import { StyledDivider, EllipsisText } from "./CustomComponents.jsx";
import { useUserState } from "../../context/UserProvider.jsx";

const DisplayUser = ({ children, user, ...props }) => {
  const { isMobile } = useUserState();

  return (
    <Flex
      alignItems={children ? "flex-start" : "center"}
      w="100%"
      p={2}
      borderRadius="lg"
      boxShadow="uniform"
      {...props}
    >
      <Avatar
        size={isMobile ? "md" : "lg"}
        src={user.pic}
        borderRadius={isMobile ? "md" : "lg"}
        mt={children && 1}
        mr={4}
      />
      <Flex flexDir="column" width="100%" overflowX="hidden">
        <EllipsisText fontSize="lg">{user.userName}</EllipsisText>
        {children && <StyledDivider />}
        {children}
      </Flex>
    </Flex>
  );
};

export default DisplayUser;
