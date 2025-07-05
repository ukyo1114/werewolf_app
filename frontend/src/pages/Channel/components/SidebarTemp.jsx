import { Stack } from "@chakra-ui/react";
import ProfileMenu from "../../../components/profile/ProfileMenu.jsx";

const SidebarTemp = ({ children }) => {
  return (
    <Stack
      p={4}
      alignItems="center"
      overflowY="auto"
      justifyContent="space-between"
      h="100%"
      bg="rgba(255,255,255,0.5)"
      backdropFilter="blur(10px)"
      borderRadius="lg"
    >
      <Stack alignItems="center" w="100%" gap={4}>
        {children}
      </Stack>
    </Stack>
  );
};

export default SidebarTemp;
