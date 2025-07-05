import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { EllipsisText } from "./CustomComponents";

const ModalTemplete = ({ children, isOpen, onClose, title }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} motionPreset="none" isCentered>
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent
        maxH="80vh"
        mx={4}
        borderRadius="xl"
        boxShadow="xl"
        bg="white"
      >
        <ModalHeader borderBottom="1px" borderColor="gray.100" pb={4}>
          <EllipsisText
            textAlign="center"
            fontSize="xl"
            fontWeight="semibold"
            color="gray.700"
          >
            {title && title}
          </EllipsisText>
        </ModalHeader>
        <ModalCloseButton
          size="lg"
          color="gray.500"
          _hover={{ color: "gray.700" }}
        />
        <ModalBody display="flex" flexDir="column" overflow="auto" p={6}>
          {children}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalTemplete;
