// External libraries
import { Box, Flex } from "@chakra-ui/react";
import { shadowProps } from "../../../components/CustomComponents";
import { useUserState } from "../../../context/UserProvider";

const Header = ({ children, title }) => {
  const { isMobile } = useUserState();

  return (
    <Box
      bgImage="url('/white-wood-texture3.jpg')"
      bgSize="cover"
      bgPosition="center"
      borderRadius="md"
      border="4px solid #b0b0b0"
      p={isMobile ? 2 : 4}
      {...shadowProps}
      w="100%"
    >
      <Flex justify="space-between" align="center" flex={1}>
        {children}
      </Flex>
    </Box>
  );
};

export default Header;
