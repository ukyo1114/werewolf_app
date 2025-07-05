import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Button,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  FormErrorMessage,
} from "@chakra-ui/react";

const PasswordForm = ({
  onSubmit,
  isSubmitting,
  errors,
  formData,
  handleChange,
}) => {
  const textColor = useColorModeValue("gray.600", "gray.400");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const bgColor = useColorModeValue("gray.50", "gray.900");

  return (
    <Box bg={bgColor} minH="100vh" py={10}>
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
                新しいパスワードを設定してください。
              </Text>
            </VStack>

            <form onSubmit={onSubmit}>
              <VStack spacing={6}>
                <FormControl isRequired isInvalid={errors.password}>
                  <FormLabel fontWeight="medium">新しいパスワード</FormLabel>
                  <Input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="新しいパスワードを入力"
                    size="lg"
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
                    }}
                  />
                  <Text mt={2} fontSize="sm" color="gray.600">
                    8文字以上で入力してください。
                  </Text>
                  <FormErrorMessage>{errors.password}</FormErrorMessage>
                </FormControl>

                <FormControl isRequired isInvalid={errors.confirmPassword}>
                  <FormLabel fontWeight="medium">パスワード（確認）</FormLabel>
                  <Input
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="パスワードを再入力"
                    size="lg"
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
                    }}
                  />
                  <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                </FormControl>

                <Alert status="info" borderRadius="md" mt={2}>
                  <AlertIcon />
                  <Box>
                    <AlertTitle>セキュリティについて</AlertTitle>
                    <AlertDescription>
                      パスワードは安全に保管され、他のユーザーに表示されることはありません。
                      定期的なパスワード変更をお勧めします。
                    </AlertDescription>
                  </Box>
                </Alert>

                <Button
                  type="submit"
                  colorScheme="blue"
                  width="full"
                  size="lg"
                  isLoading={isSubmitting}
                  loadingText="送信中..."
                  _hover={{ transform: "translateY(-2px)", shadow: "md" }}
                  transition="all 0.2s"
                >
                  パスワードを再設定
                </Button>
              </VStack>
            </form>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default PasswordForm;
