import { useState, useCallback } from "react";
import axios from "axios";
import useNotification from "../../../commonHooks/useNotification";
import { useUserState } from "../../../context/UserProvider.jsx";
import {
  Stack,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Box,
  Button,
} from "@chakra-ui/react";
import {
  EllipsisText,
  CustomButton,
  formProps,
} from "../../CustomComponents.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons";

const PasswordChangeForm = ({ onSuccess }) => {
  const { user } = useUserState();
  const showToast = useNotification();
  const [currentPassShow, setCurrentPassShow] = useState(false);
  const [newPassShow, setNewPassShow] = useState(false);
  const [confirmPassShow, setConfirmPassShow] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // エラーをクリア
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = useCallback(() => {
    const errors = {};

    // 現在のパスワードの検証
    if (!formData.currentPassword) {
      errors.currentPassword = "現在のパスワードを入力してください";
    }

    // 新しいパスワードの検証
    if (!formData.newPassword) {
      errors.newPassword = "新しいパスワードを入力してください";
    } else if (formData.newPassword.length < 8) {
      errors.newPassword = "パスワードは8文字以上で入力してください";
    }

    // 確認用パスワードの検証
    if (!formData.confirmPassword) {
      errors.confirmPassword = "確認用パスワードを入力してください";
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "パスワードが一致しません";
    }

    return errors;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e) => {
      if (user.isGuest) {
        showToast("ゲストユーザーは使用できません", "error");
        return;
      }

      e.preventDefault();

      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      setIsSubmitting(true);

      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const payload = {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        };

        await axios.put("/api/user/password", payload, config);

        showToast("パスワードが変更されました", "success");
        onSuccess();
      } catch (error) {
        showToast(
          error?.response?.data?.message || "パスワードの変更に失敗しました",
          "error"
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, user.token, showToast, onSuccess, validateForm, user.isGuest]
  );

  return (
    <Stack as="form" onSubmit={handleSubmit} gap={6}>
      <Stack spacing={6} overflow="auto" maxH="calc(100vh - 200px)">
        <FormControl
          id="currentPassword"
          isInvalid={!!formErrors.currentPassword}
        >
          <FormLabel>
            <EllipsisText>現在のパスワード</EllipsisText>
          </FormLabel>
          <InputGroup>
            <Input
              name="currentPassword"
              type={currentPassShow ? "text" : "password"}
              placeholder="現在のパスワード"
              autoComplete="current-password"
              pr="4rem"
              value={formData.currentPassword}
              onChange={handleChange}
              {...formProps}
            />
            <InputRightElement width="4.5rem">
              <Button
                h="1.75rem"
                size="sm"
                onClick={() => setCurrentPassShow(!currentPassShow)}
                variant="ghost"
                aria-label={
                  currentPassShow ? "パスワードを隠す" : "パスワードを表示"
                }
                color="gray.700"
              >
                <FontAwesomeIcon icon={currentPassShow ? faEyeSlash : faEye} />
              </Button>
            </InputRightElement>
          </InputGroup>
          {formErrors.currentPassword && (
            <Box color="red.500" fontSize="sm" mt={1}>
              {formErrors.currentPassword}
            </Box>
          )}
        </FormControl>

        <FormControl id="newPassword" isInvalid={!!formErrors.newPassword}>
          <FormLabel>
            <EllipsisText>新しいパスワード</EllipsisText>
          </FormLabel>
          <InputGroup>
            <Input
              name="newPassword"
              type={newPassShow ? "text" : "password"}
              placeholder="新しいパスワード"
              autoComplete="new-password"
              pr="4rem"
              value={formData.newPassword}
              onChange={handleChange}
              {...formProps}
            />
            <InputRightElement width="4.5rem">
              <Button
                h="1.75rem"
                size="sm"
                onClick={() => setNewPassShow(!newPassShow)}
                variant="ghost"
                aria-label={
                  newPassShow ? "パスワードを隠す" : "パスワードを表示"
                }
                color="gray.700"
              >
                <FontAwesomeIcon icon={newPassShow ? faEyeSlash : faEye} />
              </Button>
            </InputRightElement>
          </InputGroup>
          {formErrors.newPassword && (
            <Box color="red.500" fontSize="sm" mt={1}>
              {formErrors.newPassword}
            </Box>
          )}
        </FormControl>

        <FormControl
          id="confirmPassword"
          isInvalid={!!formErrors.confirmPassword}
        >
          <FormLabel>
            <EllipsisText>確認用パスワード</EllipsisText>
          </FormLabel>
          <InputGroup>
            <Input
              name="confirmPassword"
              type={confirmPassShow ? "text" : "password"}
              placeholder="確認用パスワード"
              autoComplete="new-password"
              pr="4rem"
              value={formData.confirmPassword}
              onChange={handleChange}
              {...formProps}
            />
            <InputRightElement width="4.5rem">
              <Button
                h="1.75rem"
                size="sm"
                onClick={() => setConfirmPassShow(!confirmPassShow)}
                variant="ghost"
                aria-label={
                  confirmPassShow ? "パスワードを隠す" : "パスワードを表示"
                }
                color="gray.700"
              >
                <FontAwesomeIcon icon={confirmPassShow ? faEyeSlash : faEye} />
              </Button>
            </InputRightElement>
          </InputGroup>
          {formErrors.confirmPassword && (
            <Box color="red.500" fontSize="sm" mt={1}>
              {formErrors.confirmPassword}
            </Box>
          )}
        </FormControl>
      </Stack>

      <CustomButton type="submit" isLoading={isSubmitting}>
        送信
      </CustomButton>
    </Stack>
  );
};

export default PasswordChangeForm;
