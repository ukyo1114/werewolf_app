import { useState } from "react";
import { Link } from "react-router-dom";
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
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import { FaEnvelope, FaArrowLeft } from "react-icons/fa";

const EmailForm = ({ onSubmit, isLoading }) => {
  const [email, setEmail] = useState("");
  const textColor = useColorModeValue("gray.600", "gray.400");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const iconColor = useColorModeValue("blue.500", "blue.300");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email);
  };

  return (
    <Box bg={useColorModeValue("gray.50", "gray.900")} minH="100vh" py={10}>
      <Container maxW="container.sm">
        <Box
          p={8}
          bg={cardBg}
          rounded="xl"
          shadow="lg"
          border="1px"
          borderColor={borderColor}
          _hover={{ shadow: "xl" }}
          transition="all 0.3s"
        >
          <VStack spacing={8} align="stretch">
            <VStack spacing={3}>
              <Heading
                size="lg"
                textAlign="center"
                bgGradient="linear(to-r, blue.400, blue.600)"
                bgClip="text"
              >
                パスワード再設定
              </Heading>
              <Text color={textColor} textAlign="center" fontSize="md">
                登録したメールアドレスを入力してください。
                <br />
                パスワード再設定用のメールをお送りします。
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
                  パスワード再設定の流れ
                </Heading>
                <VStack spacing={2} align="stretch">
                  <Text fontSize="sm" color={textColor}>
                    1. メールアドレスを入力して再設定用メールを送信
                  </Text>
                  <Text fontSize="sm" color={textColor}>
                    2. 届いたメールのリンクをクリック
                  </Text>
                  <Text fontSize="sm" color={textColor}>
                    3. 新しいパスワードを設定
                  </Text>
                  <Text fontSize="sm" color={textColor}>
                    4. ログインして完了
                  </Text>
                </VStack>
              </VStack>
            </Box>

            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel fontWeight="medium">メールアドレス</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FaEnvelope color={iconColor} />
                    </InputLeftElement>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@example.com"
                      size="lg"
                      autoComplete="email"
                      _focus={{
                        borderColor: "blue.500",
                        boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
                      }}
                    />
                  </InputGroup>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  width="full"
                  size="lg"
                  isLoading={isLoading}
                  _hover={{ transform: "translateY(-2px)", shadow: "md" }}
                  transition="all 0.2s"
                >
                  メールを送信
                </Button>
              </VStack>
            </form>

            <Button
              as={Link}
              to="/login"
              variant="ghost"
              leftIcon={<FaArrowLeft />}
              size="sm"
              alignSelf="center"
            >
              ログインページに戻る
            </Button>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default EmailForm;
