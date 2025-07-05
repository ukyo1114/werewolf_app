import { useToast } from "@chakra-ui/react";
import { useCallback } from "react";

const useNotification = () => {
  const toast = useToast();

  /**
   * @param {"success" | "error" | "warning" | "info"} status - 通知の種類
   */
  const showToast = useCallback(
    (title, status = "info") => {
      toast({
        title,
        status,
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
    },
    [toast]
  );

  return showToast;
};

export default useNotification;
