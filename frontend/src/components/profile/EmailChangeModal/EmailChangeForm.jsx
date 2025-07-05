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

const EmailChangeForm = ({ onSuccess }) => {
  const { user } = useUserState();
  const showToast = useNotification();
  const [currentPassShow, setCurrentPassShow] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    confirmEmail: "",
    currentPassword: "",
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

    // メールアドレスの検証
    if (!formData.email) {
      errors.email = "メールアドレスを入力してください";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
    ) {
      errors.email = "有効なメールアドレスを入力してください";
    }

    // 確認用メールアドレスの検証
    if (!formData.confirmEmail) {
      errors.confirmEmail = "確認用メールアドレスを入力してください";
    } else if (formData.email !== formData.confirmEmail) {
      errors.confirmEmail = "メールアドレスが一致しません";
    }

    // パスワードの検証
    if (!formData.currentPassword) {
      errors.currentPassword = "パスワードを入力してください";
    }

    return errors;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e) => {
      if (user.isGuest) {
        showToast("ゲストユーザーはメールアドレスを変更できません", "error");
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
          email: formData.email,
          currentPassword: formData.currentPassword,
        };

        await axios.post("/api/verify-email/change-email", payload, config);

        showToast("メールアドレスを変更しました", "success");
        onSuccess(formData.email);
      } catch (error) {
        showToast(
          error?.response?.data?.message ||
            "メールアドレスの変更に失敗しました",
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
        <FormControl id="email" isInvalid={!!formErrors.email}>
          <FormLabel>
            <EllipsisText>新しいメールアドレス</EllipsisText>
          </FormLabel>
          <Input
            name="email"
            type="email"
            placeholder="新しいメールアドレス"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            {...formProps}
          />
          {formErrors.email && (
            <Box color="red.500" fontSize="sm" mt={1}>
              {formErrors.email}
            </Box>
          )}
        </FormControl>

        <FormControl id="confirmEmail" isInvalid={!!formErrors.confirmEmail}>
          <FormLabel>
            <EllipsisText>確認用メールアドレス</EllipsisText>
          </FormLabel>
          <Input
            name="confirmEmail"
            type="email"
            placeholder="確認用メールアドレス"
            autoComplete="email"
            value={formData.confirmEmail}
            onChange={handleChange}
            {...formProps}
          />
          {formErrors.confirmEmail && (
            <Box color="red.500" fontSize="sm" mt={1}>
              {formErrors.confirmEmail}
            </Box>
          )}
        </FormControl>

        <FormControl
          id="currentPassword"
          isInvalid={!!formErrors.currentPassword}
        >
          <FormLabel>
            <EllipsisText>パスワード</EllipsisText>
          </FormLabel>
          <InputGroup>
            <Input
              name="currentPassword"
              type={currentPassShow ? "text" : "password"}
              placeholder="パスワード"
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
      </Stack>

      <CustomButton type="submit" isLoading={isSubmitting}>
        送信
      </CustomButton>
    </Stack>
  );
};

export default EmailChangeForm;
