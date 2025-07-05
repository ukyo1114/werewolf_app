import { useState, useCallback } from "react";
import axios from "axios";

import {
  Stack,
  FormControl,
  FormLabel,
  Checkbox,
  Input,
  InputGroup,
  InputRightElement,
  Textarea,
  Box,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Divider,
  Button,
} from "@chakra-ui/react";

import { useUserState } from "../../../../context/UserProvider.jsx";
import { messages } from "../../../../messages";
import TextareaAutosize from "react-textarea-autosize";
import ModalTemplete from "../../../../components/ModalTemplete.jsx";
import {
  CustomButton,
  EllipsisText,
  formProps,
} from "../../../../components/CustomComponents.jsx";
import useNotification from "../../../../commonHooks/useNotification";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons";

const ChannelSettingsModal = ({ isOpen, onClose }) => {
  const { user, currentChannel } = useUserState();
  const {
    _id: channelId,
    channelAdmin,
    channelName: initialChannelName,
    channelDescription: initialDescription,
    denyGuests: initialDenyGuests,
    numberOfPlayers: initialNumberOfPlayers,
  } = currentChannel;
  const showToast = useNotification();

  const [passwordShow, setPasswordShow] = useState(false);
  const [formData, setFormData] = useState({
    isChannelNameChanged: false,
    isDescriptionChanged: false,
    isPasswordChanged: false,
    channelName: initialChannelName,
    description: initialDescription,
    password: "",
    denyGuests: initialDenyGuests,
    numberOfPlayers: initialNumberOfPlayers,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNumberChange = (value) => {
    setFormData((prev) => ({ ...prev, numberOfPlayers: parseInt(value) }));
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      const validate = () => {
        const errors = {};
        if (formData.isChannelNameChanged && !formData.channelName) {
          errors.channelName = "チャンネル名を入力してください";
        }
        if (
          formData.isDescriptionChanged &&
          formData.description.length > 500
        ) {
          errors.description = "説明は500文字以内で入力してください";
        }
        if (
          formData.isPasswordChanged &&
          formData.password.length > 0 &&
          formData.password.length < 4
        ) {
          errors.password = "パスワードは4文字以上必要です";
        }
        if (formData.numberOfPlayers < 5 || formData.numberOfPlayers > 20) {
          errors.numberOfPlayers = "5～20人で指定してください";
        }
        return errors;
      };

      const errors = validate();
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      if (channelAdmin !== user.userId) return;
      setIsSubmitting(true);

      const payload = {
        channelName: formData.isChannelNameChanged
          ? formData.channelName
          : null,
        channelDescription: formData.isDescriptionChanged
          ? formData.description
          : null,
        passwordEnabled: formData.isPasswordChanged,
        password: formData.isPasswordChanged ? formData.password : null,
        denyGuests: formData.denyGuests,
        numberOfPlayers: formData.numberOfPlayers,
      };

      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.put(`/api/channel/settings/${channelId}`, payload, config);
        showToast(messages.CHANNEL_SETTINGS_CHANGED, "success");
      } catch (error) {
        showToast(
          error?.response?.data?.message || errors.CHANNEL_SETTINGS_FAILED,
          "error"
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [channelAdmin, channelId, user.userId, user.token, showToast, formData]
  );

  return (
    <ModalTemplete isOpen={isOpen} onClose={onClose} title={"チャンネル設定"}>
      <Stack as="form" onSubmit={handleSubmit} gap={6}>
        <Stack spacing={6} overflow="auto">
          <FormControl id="channelName">
            <FormLabel>
              <FormControl id="isChannelNameChanged">
                <Checkbox
                  name="isChannelNameChanged"
                  isChecked={formData.isChannelNameChanged}
                  onChange={handleChange}
                >
                  <EllipsisText>チャンネル名を変更する</EllipsisText>
                </Checkbox>
              </FormControl>
            </FormLabel>
            <Input
              name="channelName"
              value={formData.channelName}
              onChange={handleChange}
              placeholder="チャンネル名を入力してください"
              autoComplete="off"
              isDisabled={!formData.isChannelNameChanged}
              {...formProps}
            />
            {formErrors.channelName && (
              <Box color="red.500" fontSize="sm" mt={1}>
                {formErrors.channelName}
              </Box>
            )}
          </FormControl>

          <FormControl id="description">
            <FormLabel>
              <FormControl id="isDescriptionChanged">
                <Checkbox
                  name="isDescriptionChanged"
                  isChecked={formData.isDescriptionChanged}
                  onChange={handleChange}
                >
                  <EllipsisText>チャンネル説明を変更する</EllipsisText>
                </Checkbox>
              </FormControl>
            </FormLabel>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="チャンネルの説明を入力してください"
              autoComplete="off"
              resize="none"
              as={TextareaAutosize}
              isDisabled={!formData.isDescriptionChanged}
              maxH="350px"
              {...formProps}
            />
            {formErrors.description && (
              <Box color="red.500" fontSize="sm" mt={1}>
                {formErrors.description}
              </Box>
            )}
          </FormControl>

          <Divider borderColor="gray.500" />

          <Stack spacing={6}>
            <FormControl id="numberOfPlayers">
              <FormLabel>
                <EllipsisText>プレイ人数</EllipsisText>
              </FormLabel>
              <NumberInput
                min={5}
                max={20}
                value={formData.numberOfPlayers}
                onChange={handleNumberChange}
              >
                <NumberInputField {...formProps} />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              {formErrors.numberOfPlayers && (
                <Box color="red.500" fontSize="sm" mt={1}>
                  {formErrors.numberOfPlayers}
                </Box>
              )}
            </FormControl>

            <FormControl id="denyGuests" display="flex" alignItems="center">
              <FormLabel mb="0">
                <EllipsisText>ゲスト入室不可</EllipsisText>
              </FormLabel>
              <Switch
                name="denyGuests"
                isChecked={formData.denyGuests}
                onChange={handleChange}
                colorScheme="blue"
                size="lg"
              />
            </FormControl>
          </Stack>

          <Divider borderColor="gray.500" />

          <FormControl id="password">
            <FormLabel>
              <FormControl id="isPasswordChanged">
                <Checkbox
                  name="isPasswordChanged"
                  isChecked={formData.isPasswordChanged}
                  onChange={handleChange}
                >
                  <EllipsisText>パスワードを設定する</EllipsisText>
                </Checkbox>
              </FormControl>
            </FormLabel>
            {formData.isPasswordChanged && (
              <>
                <Box fontSize="sm" color="gray.600" mb={2}>
                  パスワードを変更しない場合は、空欄のまま送信してください
                </Box>
                <InputGroup>
                  <Input
                    name="password"
                    type={passwordShow ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="パスワードを入力してください"
                    autoComplete="off"
                    pr="4rem"
                    {...formProps}
                  />
                  <InputRightElement width="4.5rem">
                    <Button
                      h="1.75rem"
                      size="sm"
                      onClick={() => setPasswordShow(!passwordShow)}
                      variant="ghost"
                      aria-label={
                        passwordShow ? "パスワードを隠す" : "パスワードを表示"
                      }
                      color="gray.700"
                    >
                      <FontAwesomeIcon
                        icon={passwordShow ? faEyeSlash : faEye}
                      />
                    </Button>
                  </InputRightElement>
                </InputGroup>
                {formErrors.password && (
                  <Box color="red.500" fontSize="sm" mt={1}>
                    {formErrors.password}
                  </Box>
                )}
              </>
            )}
          </FormControl>
        </Stack>

        <CustomButton
          type="submit"
          isLoading={isSubmitting}
          isDisabled={isSubmitting}
        >
          送信
        </CustomButton>
      </Stack>
    </ModalTemplete>
  );
};

export default ChannelSettingsModal;
