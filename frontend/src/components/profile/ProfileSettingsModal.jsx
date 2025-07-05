import { useState, useRef, useCallback } from "react";
import axios from "axios";
import { FaTimesCircle } from "react-icons/fa";

import {
  FormControl,
  Checkbox,
  Input,
  Image,
  FormErrorMessage,
  FormLabel,
  Stack,
} from "@chakra-ui/react";

import ImageCropper from "../ImageCropper";
import { EllipsisText, CustomButton, formProps } from "../CustomComponents";

import { useUserState } from "../../context/UserProvider.jsx";
import useNotification from "../../commonHooks/useNotification";
import usePostDetails from "../../commonHooks/usePostDetails";

import { errors, messages } from "../../messages";
import ModalTemplete from "../ModalTemplete";

const initialState = {
  isUserNameChanged: false,
  userName: "",
};

const ProfileSettingsModal = ({ isOpen, onClose }) => {
  const { user, uDispatch } = useUserState();
  const showToast = useNotification();
  const [cropImage, setCropImage] = useState(false);
  const [isPictureChanged, setIsPictureChanged] = useState(false);
  const [pic, setPic] = useState(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [values, setValues] = useState({
    ...initialState,
    userName: user.userName,
  });
  const [errorsState, setErrorsState] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef();

  const postDetails = usePostDetails({
    setImgSrc,
    onOpen: () => setCropImage(true),
    inputRef,
  });

  const validate = (vals) => {
    const errs = {};
    if (vals.isUserNameChanged) {
      if (!vals.userName || vals.userName.length < 2) {
        errs.userName = "2文字以上で入力してください";
      }
    }
    return errs;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(values);
    setErrorsState(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    if (!values.isUserNameChanged && !isPictureChanged) return;
    setIsSubmitting(true);

    const payload = {};
    if (values.isUserNameChanged && values.userName)
      payload.userName = values.userName;
    if (isPictureChanged && pic) payload.pic = pic;

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put("/api/user/profile", payload, config);

      if (values.isUserNameChanged && values.userName) {
        uDispatch({ type: "CHANGE_NAME", payload: values.userName });
      }
      if (data.pic) {
        uDispatch({ type: "CHANGE_PIC", payload: data.pic });
      }

      localStorage.setItem(
        "userInfo",
        JSON.stringify({
          ...JSON.parse(localStorage.getItem("userInfo")),
          userName: user.userName,
          pic: user.pic,
        })
      );

      showToast(messages.PROFILE_SETTINGS_CHANGED, "success");
      onClose();
    } catch (error) {
      showToast(
        error?.response?.data?.message || errors.PROFILE_SETTINGS_FAILED,
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageClick = useCallback(() => {
    if (isPictureChanged) inputRef.current.click();
  }, [isPictureChanged]);

  return (
    <ModalTemplete isOpen={isOpen} onClose={onClose} title={"プロフィール設定"}>
      {!cropImage && (
        <Stack as="form" onSubmit={handleSubmit} gap={6}>
          <Stack gap={6}>
            <FormControl id="userName" isInvalid={!!errorsState.userName}>
              <FormLabel>
                <FormControl id="isUserNameChanged">
                  <Checkbox
                    name="isUserNameChanged"
                    isChecked={values.isUserNameChanged}
                    onChange={handleChange}
                  >
                    <EllipsisText>ユーザー名を変更する</EllipsisText>
                  </Checkbox>
                </FormControl>
              </FormLabel>

              <Input
                name="userName"
                placeholder="ユーザー名"
                autoComplete="off"
                isDisabled={!values.isUserNameChanged}
                value={values.userName}
                onChange={handleChange}
                {...formProps}
              />
              <FormErrorMessage>
                {!!errorsState.userName && (
                  <span style={{ display: "flex", alignItems: "center" }}>
                    <FaTimesCircle
                      style={{ marginRight: 6, color: "#E53E3E" }}
                    />
                    {errorsState.userName}
                  </span>
                )}
              </FormErrorMessage>
            </FormControl>

            <FormControl id="isPictureChanged">
              <Checkbox
                id="isPictureChanged"
                isChecked={isPictureChanged}
                onChange={(e) => setIsPictureChanged(e.target.checked)}
              >
                <EllipsisText>プロフィール画像を変更する</EllipsisText>
              </Checkbox>
            </FormControl>
          </Stack>

          <FormControl
            id="pic"
            display="flex"
            flexDirection="column"
            alignItems="center"
          >
            {pic ? (
              <Image
                src={pic}
                boxSize="120px"
                borderRadius="lg"
                objectFit="cover"
                alt="プロフィール画像"
                cursor={isPictureChanged ? "pointer" : "not-allowed"}
                onClick={handleImageClick}
                opacity={isPictureChanged ? 1 : 0.7}
                boxShadow="md"
                _hover={{
                  transform: "translateY(-2px)",
                  boxShadow: "lg",
                }}
              />
            ) : (
              <CustomButton
                isDisabled={!isPictureChanged}
                width="120px"
                height="120px"
                borderRadius="lg"
                onClick={() => inputRef.current.click()}
              >
                画像を選択
              </CustomButton>
            )}

            <Input
              hidden
              type="file"
              accept="image/jpeg, image/png"
              onChange={(e) => postDetails(e.target.files[0])}
              ref={inputRef}
            />
          </FormControl>

          <CustomButton type="submit" isLoading={isSubmitting}>
            送信
          </CustomButton>
        </Stack>
      )}

      {cropImage && (
        <ImageCropper
          imgSrc={imgSrc}
          setPic={setPic}
          onClose={() => setCropImage(false)}
        />
      )}
    </ModalTemplete>
  );
};

export default ProfileSettingsModal;
