import {
  Box,
  Container,
  VStack,
  Button,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";

const SuccessView = () => {
  const navigate = useNavigate();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const textColor = useColorModeValue("gray.600", "gray.400");

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
        >
          <VStack spacing={8} align="center">
            <FaCheckCircle size={80} color="#48BB78" />
            <VStack spacing={4} textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                パスワードの再設定が完了しました
              </Text>
              <Text color={textColor}>
                新しいパスワードでログインしてください。
              </Text>
            </VStack>

            <Button
              colorScheme="blue"
              size="lg"
              onClick={() => navigate("/")}
              _hover={{ transform: "translateY(-2px)", shadow: "md" }}
              transition="all 0.2s"
            >
              トップページへ戻る
            </Button>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default SuccessView;
