import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { EllipsisText } from "./CustomComponents";
import { useUserState } from "../context/UserProvider";

const ModalTemplete = ({ children, isOpen, onClose, title }) => {
  const { isMobile } = useUserState();

  return (
    <Modal isOpen={isOpen} onClose={onClose} motionPreset="none" isCentered>
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent
        maxH="100vh"
        w="100%"
        maxW={isMobile ? "100vw" : "2xl"}
        bg="blue.50"
      >
        <ModalHeader borderBottom="1px" borderColor="gray.500">
          <EllipsisText textAlign="center" fontSize="xl" color="gray.700">
            {title && title}
          </EllipsisText>
        </ModalHeader>

        <ModalCloseButton />

        <ModalBody display="flex" flexDir="column" overflow="auto" p={4}>
          {children}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalTemplete;
