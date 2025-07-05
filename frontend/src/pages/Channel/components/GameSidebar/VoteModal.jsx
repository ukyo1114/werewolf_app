import { useState, useEffect, useCallback } from "react";
import axios from "axios";

import { Stack } from "@chakra-ui/react";

import { useUserState } from "../../../../context/UserProvider.jsx";
import useNotification from "../../../../commonHooks/useNotification";
import DisplayUser from "../../../../components/DisplayUser.jsx";
import { CustomButton } from "../../../../components/CustomComponents.jsx";
import ModalTemplete from "../../../../components/ModalTemplete.jsx";
import { TITLE_MAP } from "../../../../constants.js";
import mockUserList from "../../../../../__tests__/userList.js";

const VoteModal = ({ mode, isOpen, onClose }) => {
  const { user, currentChannel } = useUserState();
  const { /* users,  */ phase } = currentChannel;
  const users = mockUserList;
  const [button, setButton] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    setSelectedUser(null);
    onClose();
  }, [setSelectedUser, onClose, currentChannel.phase]);

  useEffect(() => {
    const buttons = {
      vote: <VoteButton selectedUser={selectedUser} onClose={onClose} />,
      fortune: <FortuneButton selectedUser={selectedUser} onClose={onClose} />,
      guard: <GuardButton selectedUser={selectedUser} onClose={onClose} />,
      attack: <AttackButton selectedUser={selectedUser} onClose={onClose} />,
    };
    setButton(buttons[mode]);
  }, [selectedUser, onClose, phase, setButton, mode]);

  return (
    <ModalTemplete isOpen={isOpen} onClose={onClose} title={TITLE_MAP[mode]}>
      <Stack gap={6} flex="1" overflow="auto" p={4} mb={4}>
        {users.map((u) => {
          const hidden =
            u._id === user.userId ||
            u.status !== "alive" ||
            (phase.currentPhase === "night" &&
              user.role === "werewolf" &&
              user.teammates.includes(u._id));
          if (hidden) return null;

          return (
            <DisplayUser
              key={u._id}
              user={u}
              cursor="pointer"
              onClick={() => setSelectedUser(u._id)}
              borderColor={selectedUser === u._id ? "blue.500" : "white"}
              borderWidth={selectedUser === u._id ? "2px" : "0px"}
              _hover={{
                transform: "translateY(-2px)",
                boxShadow: "lg",
              }}
            />
          );
        })}
      </Stack>
      {button}
    </ModalTemplete>
  );
};

const VoteButton = ({ selectedUser, onClose }) => {
  const { user, currentChannel } = useUserState();
  const { _id: gameId } = currentChannel;
  const showToast = useNotification();

  const handleSubmit = useCallback(async () => {
    if (selectedUser) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };

        await axios.post(`/api/game/vote/${gameId}`, { selectedUser }, config);

        showToast("投票しました", "success");
      } catch (error) {
        showToast(
          error?.response?.data?.message || "送信に失敗しました",
          "error"
        );
      } finally {
        onClose();
      }
    } else {
      showToast("投票先が選択されていません", "warning");
    }
  }, [selectedUser, user.token, gameId, showToast, onClose]);

  return (
    <CustomButton onClick={handleSubmit} isDisabled={!selectedUser}>
      投票
    </CustomButton>
  );
};

const FortuneButton = ({ selectedUser, onClose }) => {
  const { user, currentChannel } = useUserState();
  const { _id: gameId } = currentChannel;
  const showToast = useNotification();

  const handleSubmit = useCallback(async () => {
    if (selectedUser) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };

        await axios.post(
          `/api/game/fortune/${gameId}`,
          { selectedUser },
          config
        );

        showToast("送信しました", "success");
      } catch (error) {
        showToast(
          error?.response?.data?.message || "送信に失敗しました",
          "error"
        );
      } finally {
        onClose();
      }
    } else {
      showToast("占い先が選択されていません", "warning");
    }
  }, [selectedUser, user.token, gameId, showToast, onClose]);

  return (
    <CustomButton onClick={handleSubmit} isDisabled={!selectedUser}>
      占う
    </CustomButton>
  );
};

const GuardButton = ({ selectedUser, onClose }) => {
  const { user, currentChannel } = useUserState();
  const { _id: gameId } = currentChannel;
  const showToast = useNotification();

  const handleSubmit = useCallback(async () => {
    if (selectedUser) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };

        await axios.post(`/api/game/guard/${gameId}`, { selectedUser }, config);

        showToast("送信しました", "success");
      } catch (error) {
        showToast(
          error?.response?.data?.message || "送信に失敗しました",
          "error"
        );
      } finally {
        onClose();
      }
    } else {
      showToast("護衛先が選択されていません", "warning");
    }
  }, [selectedUser, user.token, gameId, showToast, onClose]);

  return (
    <CustomButton onClick={handleSubmit} isDisabled={!selectedUser}>
      護衛する
    </CustomButton>
  );
};

const AttackButton = ({ selectedUser, onClose }) => {
  const { user, currentChannel } = useUserState();
  const { _id: gameId } = currentChannel;
  const showToast = useNotification();

  const handleSubmit = useCallback(async () => {
    if (selectedUser) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };

        await axios.post(
          `/api/game/attack/${gameId}`,
          { selectedUser },
          config
        );

        showToast("送信しました", "success");
      } catch (error) {
        showToast(
          error?.response?.data?.message || "送信に失敗しました",
          "error"
        );
      } finally {
        onClose();
      }
    } else {
      showToast("襲撃先が選択されていません", "warning");
    }
  }, [selectedUser, user.token, gameId, showToast, onClose]);

  return (
    <CustomButton onClick={handleSubmit} isDisabled={!selectedUser}>
      襲撃する
    </CustomButton>
  );
};

export default VoteModal;
