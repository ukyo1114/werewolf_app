import { Stack, Center } from "@chakra-ui/react";
import ProfileMenu from "../profile/ProfileMenu.jsx";
import { useUserState } from "../../context/UserProvider.jsx";

export const SideBar = ({ children }) => {
  const { isMobile } = useUserState();

  return (
    <Stack
      px={3}
      alignItems="center"
      overflowY="auto"
      justifyContent="space-between"
      h="100%"
      maxW="300px"
    >
      <Stack
        alignItems={
          isMobile ? "flex-start" : { base: "center", lg: "flex-start"}
        }
        w="100%"
      >
        {children}
      </Stack>
      
      <Center mt="auto" mb={4} w="100%">
        <ProfileMenu />
      </Center>
    </Stack>
  );
};
