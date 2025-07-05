import { useState } from "react";
import {
  Container,
  Box,
  VStack,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Button,
  useColorModeValue,
  FormErrorMessage,
} from "@chakra-ui/react";

const EmailForm = ({ onSubmit, isLoading }) => {
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const textColor = useColorModeValue("gray.600", "gray.400");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, confirmEmail);
  };

  return (
    <Box bg={useColorModeValue("gray.50", "gray.900")} minH="100vh" py={10}>
      <Container maxW="container.sm">
        <Box
          p={8}
          bg={cardBg}
          rounded="xl"
          shadow="md"
          border="1px"
          borderColor={borderColor}
        >
          <VStack spacing={8} align="stretch">
            <VStack spacing={4} align="center">
              <Heading size="lg" textAlign="center">
                メールアドレスの確認
              </Heading>
              <Text color={textColor} textAlign="center" maxW="md">
                登録するメールアドレスを入力してください。
                確認メールをお送りします。
              </Text>
            </VStack>

            <Box
              p={6}
              bg={useColorModeValue("blue.50", "blue.900")}
              rounded="lg"
              border="1px"
              borderColor={useColorModeValue("blue.200", "blue.700")}
            >
              <VStack spacing={4} align="stretch">
                <Heading
                  size="sm"
                  color={useColorModeValue("blue.600", "blue.300")}
                >
                  登録の流れ
                </Heading>
                <VStack spacing={2} align="stretch">
                  <Text fontSize="sm" color={textColor}>
                    1. メールアドレスを入力して確認メールを送信
                  </Text>
                  <Text fontSize="sm" color={textColor}>
                    2. 届いたメールのリンクをクリック
                  </Text>
                  <Text fontSize="sm" color={textColor}>
                    3. ユーザー名とパスワードを設定
                  </Text>
                  <Text fontSize="sm" color={textColor}>
                    4. 登録完了
                  </Text>
                </VStack>
              </VStack>
            </Box>

            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel fontWeight="medium">メールアドレス</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@example.com"
                    autoComplete="email"
                    size="lg"
                    _focus={{
                      borderColor: "blue.400",
                      boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)",
                    }}
                  />
                </FormControl>

                <FormControl
                  isRequired
                  isInvalid={email !== confirmEmail && confirmEmail !== ""}
                >
                  <FormLabel fontWeight="medium">
                    メールアドレス（確認）
                  </FormLabel>
                  <Input
                    type="email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    placeholder="example@example.com"
                    autoComplete="email"
                    size="lg"
                    _focus={{
                      borderColor: "blue.400",
                      boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)",
                    }}
                  />
                  {email !== confirmEmail && confirmEmail !== "" && (
                    <FormErrorMessage>
                      メールアドレスが一致しません
                    </FormErrorMessage>
                  )}
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  isLoading={isLoading}
                  loadingText="送信中..."
                  isDisabled={email !== confirmEmail || !email || !confirmEmail}
                  mt={2}
                >
                  確認メールを送信
                </Button>
              </VStack>
            </form>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default EmailForm;
