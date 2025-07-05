// React and related
// External libraries
import {
  Box,
  Text,
  Checkbox,
  Flex,
  IconButton,
  useDisclosure,
} from "@chakra-ui/react";
import { FaRegPlusSquare } from "react-icons/fa";

// Internal components
import {
  EllipsisText,
  CustomButton,
  shadowProps,
} from "../../../components/CustomComponents";
import CreateChannel from "./CreateChannel";
import ProfileMenu from "../../../components/profile/ProfileMenu";

// Internal hooks
import { useUserState } from "../../../context/UserProvider";

const Header = ({ showJoinedCh, setShowJoinedCh }) => {
  const { isMobile } = useUserState();
  const ccModal = useDisclosure();

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
        <Text
          as="h2"
          fontSize={isMobile ? "md" : "xl"}
          fontWeight="bold"
          color="gray.800"
          letterSpacing="wider"
        >
          チャンネル一覧
        </Text>

        <Flex gap={isMobile ? 2 : 4} align="center">
          <Checkbox
            id="isJoined"
            isChecked={showJoinedCh}
            onChange={(e) => setShowJoinedCh(e.target.checked)}
            borderColor="gray.500"
            _hover={{ borderColor: "gray.600" }}
          >
            <EllipsisText fontSize={isMobile ? "sm" : "md"}>
              参加中のみ
            </EllipsisText>
          </Checkbox>

          {isMobile ? (
            <IconButton
              icon={<FaRegPlusSquare />}
              variant="ghost"
              size="md"
              onClick={ccModal.onOpen}
            />
          ) : (
            <CustomButton
              onClick={ccModal.onOpen}
              leftIcon={<FaRegPlusSquare />}
            >
              チャンネル作成
            </CustomButton>
          )}
          <ProfileMenu />
        </Flex>
      </Flex>

      <CreateChannel isOpen={ccModal.isOpen} onClose={ccModal.onClose} />
    </Box>
  );
};

export default Header;
