import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Flex,
  VStack,
  Image,
  Text,
  Button,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useUserState } from "../../context/UserProvider.jsx";
import GuestLoginButton from "./GuestLoginButton.jsx";
import { FaBook, FaSignInAlt, FaUserPlus } from "react-icons/fa";

const TITLE_LOGO = "/TITLE.webp"; // 必要に応じてパスを修正
const DESCRIPTION =
  "初めての方でも簡単に楽しめる人狼ゲーム。ゲストとしてすぐに始めたり、メンバー登録してより多くの機能を楽しんだりできます。";
const BG_IMAGE = "/Village-entrance-pixel-art1.jpg";

const Home = () => {
  const { uDispatch, chDispatch } = useUserState();
  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    uDispatch({ type: "LOGOUT" });
    chDispatch({ type: "LEAVE_CHANNEL" });
  }, [uDispatch, chDispatch]);

  // メインビジュアル（最上部・横幅いっぱい・上下ぼかし、モバイルのみ）
  const mainVisualMobile = (
    <Box position="relative" w="100vw" overflow="hidden">
      <Image
        src={BG_IMAGE}
        alt="メインビジュアル"
        w="100vw"
        h="auto"
        objectFit="cover"
        objectPosition="center"
        style={{ display: "block" }}
      />
      <Box
        position="absolute"
        top={0}
        left={0}
        w="100%"
        h="100%"
        pointerEvents="none"
        bgGradient="linear(to-b, white 0%, transparent 20%, transparent 80%, white 100%)"
        zIndex={1}
      />
    </Box>
  );

  // タイトルロゴと説明文
  const logoAndDesc = (
    <VStack spacing={4} align={{ base: "center", md: "flex-start" }} w="100%">
      <Image
        src={TITLE_LOGO}
        alt="タイトルロゴ"
        w={{ base: "220px", md: "260px" }}
      />
      <Text fontSize={{ base: "md", md: "lg" }} color="gray.700" maxW="360px">
        {DESCRIPTION}
      </Text>
    </VStack>
  );

  // デスクトップ・モバイル分岐
  if (isMobile) {
    // モバイル表示: メインビジュアル＋縦並び
    return (
      <VStack minH="100vh" spacing={8} py={8} px={4} bg="gray.50">
        {mainVisualMobile}
        <Image src={TITLE_LOGO} alt="タイトルロゴ" w="220px" />
        <Text fontSize="md" color="gray.700" textAlign="center">
          {DESCRIPTION}
        </Text>
        <VStack spacing={6} w="100%">
          <GuestLoginButton w="100%" h="60px" fontSize="lg" />
          <Button
            as={Link}
            to={localStorage.getItem("userInfo") ? "/channel-list" : "/login"}
            colorScheme="blue"
            variant="outline"
            size="lg"
            w="100%"
            h="60px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={3}
            boxShadow="md"
            _hover={{
              transform: "translateY(-2px)",
              shadow: "md",
              boxShadow: "lg",
            }}
            transition="all 0.2s"
            leftIcon={<FaSignInAlt />}
          >
            ログイン
          </Button>
          <Button
            as={Link}
            to="/send-registration-email"
            colorScheme="blue"
            variant="outline"
            size="lg"
            w="100%"
            h="60px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={3}
            boxShadow="md"
            _hover={{
              transform: "translateY(-2px)",
              shadow: "md",
              boxShadow: "lg",
            }}
            transition="all 0.2s"
            leftIcon={<FaUserPlus />}
          >
            ユーザー登録
          </Button>
          <Button
            as={Link}
            to="/how-to-play"
            colorScheme="blue"
            variant="outline"
            size="lg"
            w="100%"
            h="60px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={3}
            boxShadow="md"
            _hover={{
              transform: "translateY(-2px)",
              shadow: "md",
              boxShadow: "lg",
            }}
            transition="all 0.2s"
            leftIcon={<FaBook />}
          >
            あそびかた
          </Button>
        </VStack>
      </VStack>
    );
  }

  // PC表示: 従来のレイアウト
  return (
    <Flex
      minH="100vh"
      bgImage={`url(${BG_IMAGE})`}
      bgSize="cover"
      bgPosition="center"
      bgRepeat="no-repeat"
      position="relative"
    >
      {/* 右上: タイトル・説明文（オーバーレイ付き） */}
      <Box
        position="absolute"
        top={8}
        left="50%"
        transform="translateX(-50%)"
        bg="rgba(255,255,255,0.3)"
        borderRadius="xl"
        p={8}
        maxW="400px"
        zIndex={1}
        sx={{ backdropFilter: "blur(16px)" }}
      >
        {logoAndDesc}
      </Box>
      {/* 下部中央: ボタン群（横並び、オーバーレイ付き） */}
      <Flex
        position="absolute"
        bottom={8}
        left={0}
        right={0}
        justify="center"
        zIndex={1}
      >
        <Box
          bg="rgba(255,255,255,0.5)"
          borderRadius="xl"
          p={4}
          sx={{ backdropFilter: "blur(16px)" }}
        >
          <Flex gap={4}>
            <GuestLoginButton h="60px" fontSize="lg" />
            <Button
              as={Link}
              to={localStorage.getItem("userInfo") ? "/channel-list" : "/login"}
              colorScheme="blue"
              variant="outline"
              size="lg"
              h="60px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={3}
              boxShadow="md"
              _hover={{
                transform: "translateY(-2px)",
                shadow: "md",
                boxShadow: "lg",
              }}
              transition="all 0.2s"
              leftIcon={<FaSignInAlt />}
            >
              ログイン
            </Button>
            <Button
              as={Link}
              to="/send-registration-email"
              colorScheme="blue"
              variant="outline"
              size="lg"
              h="60px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={3}
              boxShadow="md"
              _hover={{
                transform: "translateY(-2px)",
                shadow: "md",
                boxShadow: "lg",
              }}
              transition="all 0.2s"
              leftIcon={<FaUserPlus />}
            >
              ユーザー登録
            </Button>
            <Button
              as={Link}
              to="/how-to-play"
              colorScheme="blue"
              variant="outline"
              size="lg"
              h="60px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={3}
              boxShadow="md"
              _hover={{
                transform: "translateY(-2px)",
                shadow: "md",
                boxShadow: "lg",
              }}
              transition="all 0.2s"
              leftIcon={<FaBook />}
            >
              あそびかた
            </Button>
          </Flex>
        </Box>
      </Flex>
    </Flex>
  );
};

export default Home;
