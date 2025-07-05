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

const SuccessView = ({ onClose, email }) => {
  const textColor = useColorModeValue("gray.600", "gray.400");
  const successColor = useColorModeValue("green.500", "green.300");

  return (
    <VStack spacing={8} align="stretch" textAlign="center" py={4}>
      <VStack spacing={6}>
        <Icon as={FaCheckCircle} w={16} h={16} color={successColor} />
        <VStack spacing={4}>
          <Heading size="lg">メールアドレス変更完了</Heading>
          <Text color={textColor} maxW="md">
            メールアドレスの変更が完了しました。
            {email && (
              <>
                <br />
                新しいメールアドレス（{email}）に確認メールを送信しました。
              </>
            )}
          </Text>
        </VStack>
      </VStack>

      <Box
        p={4}
        bg={useColorModeValue("orange.50", "orange.900")}
        rounded="lg"
        border="1px"
        borderColor={useColorModeValue("orange.200", "orange.700")}
        textAlign="left"
      >
        <VStack spacing={4} align="stretch">
          <Heading
            size="sm"
            color={useColorModeValue("orange.600", "orange.300")}
          >
            メールが届かない場合
          </Heading>
          <VStack spacing={3} align="stretch">
            <Text fontSize="sm" color={textColor}>
              • 迷惑メールフォルダをご確認ください
            </Text>
            <Text fontSize="sm" color={textColor}>
              • メールアドレスが正しいかご確認ください
            </Text>
            <Text fontSize="sm" color={textColor}>
              • 数分待っても届かない場合は、再度メールアドレスを変更してください
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
