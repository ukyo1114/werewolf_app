import { useState, useEffect } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import axios from "axios";
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
  HStack,
  Divider,
  InputGroup,
  InputLeftElement,
  Link,
} from "@chakra-ui/react";
import { FaUser, FaLock, FaUserFriends, FaSignInAlt } from "react-icons/fa";
import { useUserState } from "../../context/UserProvider";
import useNotification from "../../commonHooks/useNotification";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const showToast = useNotification();
  const { uDispatch, chDispatch } = useUserState();
  const textColor = useColorModeValue("gray.600", "gray.400");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const iconColor = useColorModeValue("blue.500", "blue.300");

  useEffect(() => {
    if (localStorage.getItem("userInfo")) {
      navigate("/channel-list");
    } else {
      uDispatch({ type: "LOGOUT" });
      chDispatch({ type: "LEAVE_CHANNEL" });
    }
  }, [navigate, uDispatch, chDispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const { data } = await axios.post("/api/user/login", {
        email,
        password,
      });
      localStorage.setItem("userInfo", JSON.stringify(data));
      navigate("/channel-list");
    } catch (error) {
      showToast(
        error.response?.data?.message || "ログインに失敗しました",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.get("/api/user/guest");
      localStorage.setItem(
        "userInfo",
        JSON.stringify({
          ...data,
          userName: "ゲスト",
          pic: null,
          isGuest: true,
        })
      );
      navigate("/channel-list");
    } catch (error) {
      showToast(
        error.response?.data?.message ||
          "ログインに失敗しました。もう一度お試しください。",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
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
                ログイン
              </Heading>
              <Text color={textColor} textAlign="center" fontSize="md">
                メールアドレスとパスワードを入力してください。
              </Text>
            </VStack>

            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel fontWeight="medium">メールアドレス</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FaUser color={iconColor} />
                    </InputLeftElement>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@example.com"
                      size="lg"
                      _focus={{
                        borderColor: "blue.500",
                        boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
                      }}
                    />
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="medium">パスワード</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FaLock color={iconColor} />
                    </InputLeftElement>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="パスワードを入力"
                      size="lg"
                      _focus={{
                        borderColor: "blue.500",
                        boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
                      }}
                    />
                  </InputGroup>
                </FormControl>

                <HStack justify="flex-end" spacing={2} mt={-2}>
                  <Link
                    as={RouterLink}
                    to="/request-password-reconfig"
                    color="blue.500"
                    _hover={{ textDecoration: "none", color: "blue.600" }}
                    transition="all 0.2s"
                  >
                    パスワードをお忘れですか？
                  </Link>
                </HStack>

                <Button
                  type="submit"
                  colorScheme="blue"
                  width="full"
                  size="lg"
                  isLoading={isLoading}
                  leftIcon={<FaSignInAlt />}
                  _hover={{ transform: "translateY(-2px)", shadow: "md" }}
                  transition="all 0.2s"
                >
                  ログイン
                </Button>
              </VStack>
            </form>

            <HStack spacing={4} align="center">
              <Divider />
              <Text color={textColor} fontSize="sm" whiteSpace="nowrap">
                または
              </Text>
              <Divider />
            </HStack>

            <Button
              onClick={handleGuestLogin}
              colorScheme="gray"
              width="full"
              size="lg"
              isLoading={isLoading}
              leftIcon={<FaUserFriends />}
              _hover={{ transform: "translateY(-2px)", shadow: "md" }}
              transition="all 0.2s"
            >
              ゲストとしてログイン
            </Button>

            <HStack justify="center" spacing={2} pt={2}>
              <Text color={textColor} fontSize="sm">
                アカウントをお持ちでない方は
              </Text>
              <Link
                as={RouterLink}
                to="/send-registration-email"
                color="blue.500"
                fontWeight="medium"
                _hover={{ textDecoration: "underline" }}
              >
                新規登録
              </Link>
            </HStack>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
