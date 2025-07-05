import {
  Box,
  VStack,
  Heading,
  Text,
  useColorModeValue,
  Icon,
} from "@chakra-ui/react";
import { FaCheckCircle } from "react-icons/fa";
import { CustomButton } from "../../CustomComponents.jsx";

const SuccessView = ({ onClose }) => {
  const textColor = useColorModeValue("gray.600", "gray.400");
  const successColor = useColorModeValue("green.500", "green.300");

  return (
    <VStack spacing={8} align="stretch" textAlign="center" py={4}>
      <VStack spacing={6}>
        <Icon as={FaCheckCircle} w={16} h={16} color={successColor} />
        <VStack spacing={4}>
          <Heading size="lg">パスワード変更完了</Heading>
          <Text color={textColor} maxW="md">
            パスワードの変更が完了しました。
            <br />
            新しいパスワードでログインできるようになりました。
          </Text>
        </VStack>
      </VStack>

      <Box
        p={4}
        bg={useColorModeValue("blue.50", "blue.900")}
        rounded="lg"
        border="1px"
        borderColor={useColorModeValue("blue.200", "blue.700")}
        textAlign="left"
      >
        <VStack spacing={4} align="stretch">
          <Heading size="sm" color={useColorModeValue("blue.600", "blue.300")}>
            セキュリティに関する注意事項
          </Heading>
          <VStack spacing={3} align="stretch">
            <Text fontSize="sm" color={textColor}>
              • 新しいパスワードは安全に管理してください
            </Text>
            <Text fontSize="sm" color={textColor}>
              • 他のサービスと同じパスワードは使用しないでください
            </Text>
            <Text fontSize="sm" color={textColor}>
              • 定期的にパスワードを変更することをお勧めします
            </Text>
          </VStack>
        </VStack>
      </Box>

      <CustomButton
        onClick={onClose}
        colorScheme="blue"
        size="lg"
        width="full"
        _hover={{
          transform: "translateY(-1px)",
          boxShadow: "lg",
        }}
        transition="all 0.2s"
      >
        閉じる
      </CustomButton>
    </VStack>
  );
};

export default SuccessView;
