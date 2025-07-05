import { useCallback } from "react";
import useNotification from "./useNotification";
import { errors } from "../messages";

const usePostDetails = ({ setImgSrc, onOpen, inputRef }) => {
  const showToast = useNotification();

  const postDetails = useCallback(
    (pics) => {
      if (!pics || (pics.type !== "image/jpeg" && pics.type !== "image/png")) {
        showToast(errors.NO_IMAGE_SELECTED, "warning");
        return;
      }

      // 画像をエンコードし、ImageCropperへ渡す
      const reader = new FileReader();
      reader.onload = (e) => {
        setImgSrc(e.target.result);
        onOpen();
      };
      reader.readAsDataURL(pics);

      inputRef.current.value = "";
    },
    [setImgSrc, onOpen, showToast, inputRef]
  );

  return postDetails;
};

export default usePostDetails;
