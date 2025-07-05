import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button, Icon, Text } from "@chakra-ui/react";
import { FaUser } from "react-icons/fa";
import useNotification from "../../commonHooks/useNotification";

const GuestLoginButton = () => {
  const navigate = useNavigate();
  const showToast = useNotification();
  const [isLoading, setIsLoading] = useState(false);

  const handleGuestLogin = async () => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (userInfo && userInfo.isGuest) {
      navigate("/channel-list");
      return;
    }

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
    <Button
      onClick={handleGuestLogin}
      colorScheme="blue"
      variant="outline"
      size="lg"
      h="60px"
      display="flex"
      alignItems="center"
      justifyContent="center"
      gap={3}
      _hover={{ transform: "translateY(-2px)", shadow: "md" }}
      transition="all 0.2s"
      isLoading={isLoading}
      loadingText="ログイン中..."
    >
      <Icon as={FaUser} w={5} h={5} />
      <Text>ゲストで始める</Text>
    </Button>
  );
};

export default GuestLoginButton;
