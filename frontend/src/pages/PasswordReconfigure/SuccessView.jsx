import { Link } from "react-router-dom";
import {
  Container,
  Box,
  VStack,
  Heading,
  Text,
  Button,
  useColorModeValue,
  Icon,
} from "@chakra-ui/react";
import { FaCheckCircle } from "react-icons/fa";

const SuccessView = ({ email }) => {
  const textColor = useColorModeValue("gray.600", "gray.400");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const successColor = useColorModeValue("green.500", "green.300");
  const bgColor = useColorModeValue("gray.50", "gray.900");

  return (
    <Box bg={bgColor} minH="100vh" py={10}>
      <Container maxW="container.sm">
        <Box
          p={8}
          bg={cardBg}
          rounded="xl"
          shadow="md"
          border="1px"
          borderColor={borderColor}
          textAlign="center"
        >
          <VStack spacing={8} align="stretch">
            <VStack spacing={6}>
              <Icon as={FaCheckCircle} w={20} h={20} color={successColor} />
              <VStack spacing={4}>
                <Heading size="lg">メールを送信しました</Heading>
                <Text color={textColor} maxW="md">
                  入力されたメールアドレス（{email}
                  ）にパスワード再設定用のメールを送信しました。
                  メールに記載されたリンクからパスワードの再設定を行ってください。
                </Text>
              </VStack>
            </VStack>

            <Box
              p={6}
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
                    •
                    数分待っても届かない場合は、再度メールアドレスを入力してください
                  </Text>
                </VStack>
              </VStack>
            </Box>

            <Button
              as={Link}
              to="/login"
              colorScheme="blue"
              size="lg"
              width="full"
              _hover={{
                transform: "translateY(-1px)",
                boxShadow: "lg",
              }}
              transition="all 0.2s"
            >
              ログインページに戻る
            </Button>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default SuccessView;
