import { useState } from "react";

import {
  Stack,
  Divider,
  FormControl,
  Input,
  Flex,
  Text,
  FormLabel,
} from "@chakra-ui/react";

import { useUserState } from "../../../context/UserProvider";
import { useJoinChannel } from "../../../commonHooks/useJoinChannel";
import {
  CustomButton,
  EllipsisText,
  formProps,
} from "../../../components/CustomComponents";
import ModalTemplete from "../../../components/ModalTemplete";
import { PasswordBadge, DenyGuestsBadge } from "../../../components/Badge";

const ChannelInfo = ({ selectedChannel, isOpen, onClose }) => {
  const { user } = useUserState();
  const [password, setPassword] = useState("");
  const joinChannel = useJoinChannel();

  const { isBlocked, isJoined } = selectedChannel;

  return (
    <ModalTemplete isOpen={isOpen} onClose={onClose} title={"チャンネル情報"}>
      <Stack gap={6}>
        <Stack overflow="auto" gap={6}>
          <Stack>
            <Text fontSize="lg" fontWeight="bold" textAlign="center">
              {selectedChannel.channelName}
            </Text>
            <Flex gap={2} justifyContent="center">
              {selectedChannel.passwordEnabled && <PasswordBadge />}
              {selectedChannel.denyGuests && <DenyGuestsBadge />}
            </Flex>
          </Stack>

          <Divider borderColor="gray.500" />

          <Stack>
            <Text fontWeight="bold">説明：</Text>
            <Text
              overflow="auto"
              whiteSpace="pre-wrap"
              bg="gray.50"
              p="2"
              borderRadius="md"
              maxH="300px"
              color="gray.800"
            >
              {selectedChannel.channelDescription}
            </Text>
          </Stack>

          <Divider borderColor="gray.500" />

          <Flex>
            <Text fontWeight="bold" flexShrink={0}>
              作成者：
            </Text>
            <EllipsisText color="gray.600">
              {selectedChannel.channelAdmin.userName}
            </EllipsisText>
          </Flex>

          <Flex>
            <Text fontWeight="bold" flexShrink={0}>
              プレイ人数：
            </Text>
            <Text color="gray.600">{selectedChannel.numberOfPlayers}人</Text>
          </Flex>

          {selectedChannel.passwordEnabled && !isJoined && (
            <Stack spacing={6}>
              <Divider borderColor="gray.500" />

              <FormControl id="password">
                <FormLabel fontWeight="bold">パスワード</FormLabel>
                <Input
                  placeholder="パスワードを入力してください"
                  value={password}
                  type="password"
                  onChange={(e) => setPassword(e.target.value)}
                  size="lg"
                  {...formProps}
                />
              </FormControl>
            </Stack>
          )}
        </Stack>

        <CustomButton
          data-testid="enter-button"
          colorScheme={isBlocked ? "pink" : "teal"}
          onClick={() => joinChannel(selectedChannel._id, password)}
          isDisabled={isBlocked || (user.isGuest && selectedChannel.denyGuests)}
        >
          {isBlocked
            ? "ブロックされています"
            : user.isGuest && selectedChannel.denyGuests
              ? "ゲストは入室できません"
              : "入室"}
        </CustomButton>
      </Stack>
    </ModalTemplete>
  );
};

export default ChannelInfo;
