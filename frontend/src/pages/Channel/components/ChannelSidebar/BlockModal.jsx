import { useState, useEffect, useCallback } from "react";
import axios from "axios";

import { Stack, Tabs, TabList, Tab } from "@chakra-ui/react";

import { useUserState } from "../../../../context/UserProvider.jsx";
import useNotification from "../../../../commonHooks/useNotification";
import DisplayUser from "../../../../components/DisplayUser.jsx";
import { CustomButton } from "../../../../components/CustomComponents.jsx";
import { messages } from "../../../../messages.js";
import ModalTemplete from "../../../../components/ModalTemplete.jsx";
import mockUserList from "../../../../../__tests__/userList.js";
import { NonExistentUserBadge } from "../../../../components/Badge.jsx";

const BlockModal = ({ isOpen, onClose }) => {
  const { user, currentChannel } = useUserState();
  const [blockUserList, setBlockUserList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedBUser, setSelectedBUser] = useState(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const showToast = useNotification();
  const { _id: channelId, channelAdmin } = currentChannel;

  const fetchBlockUserList = useCallback(async () => {
    if (channelAdmin !== user.userId) return;

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };

      const {
        data: { blockUsers },
      } = await axios.get(`api/block/list/${channelId}`, config);

      setBlockUserList(blockUsers || []);
    } catch (error) {
      showToast(
        error?.response?.data?.message || "ブロックリストの取得に失敗しました",
        "error"
      );
    }
  }, [user, channelId, channelAdmin, setBlockUserList, showToast]);

  useEffect(() => {
    fetchBlockUserList();
  }, [fetchBlockUserList]);

  const handleTabChange = (index) => {
    setActiveTabIndex(index);
    // タブ切り替え時に選択状態をリセット
    setSelectedUser(null);
    setSelectedBUser(null);
  };

  return (
    <ModalTemplete isOpen={isOpen} onClose={onClose} title={"ブロック/解除"}>
      <Tabs display="flex" flexDir="column" onChange={handleTabChange}>
        <TabList>
          <Tab w="50%">ブロック</Tab>
          <Tab w="50%">解除</Tab>
        </TabList>
      </Tabs>

      {/* タブに応じてコンテンツを切り替え */}
      {activeTabIndex === 0 ? (
        <UserListTab
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          setBlockUserList={setBlockUserList}
        />
      ) : (
        <BlockedUserListTab
          selectedBUser={selectedBUser}
          setSelectedBUser={setSelectedBUser}
          blockUserList={blockUserList}
          setBlockUserList={setBlockUserList}
        />
      )}

      {/* タブに応じてボタンを切り替え */}
      {activeTabIndex === 0 && (
        <BlockButton
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          setBlockUserList={setBlockUserList}
          users={mockUserList}
        />
      )}
      {activeTabIndex === 1 && (
        <UnblockButton
          selectedBUser={selectedBUser}
          setSelectedBUser={setSelectedBUser}
          setBlockUserList={setBlockUserList}
        />
      )}
    </ModalTemplete>
  );
};

const UserListTab = ({ selectedUser, setSelectedUser, setBlockUserList }) => {
  const { user, currentChannel } = useUserState();
  const { users } = currentChannel;

  return (
    <Stack gap={6} flex="1" overflow="auto" p={4} my={4}>
      {users.length > 1 ? (
        users
          .filter((u) => u._id !== user.userId)
          .map((u) => (
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
          ))
      ) : (
        <DisplayUser
          user={{
            userName: "対象ユーザーがいません",
            pic: "/hatakekakashi.jpg",
          }}
        >
          <NonExistentUserBadge />
        </DisplayUser>
      )}
    </Stack>
  );
};

const BlockButton = ({
  selectedUser,
  setSelectedUser,
  setBlockUserList,
  users,
}) => {
  const { user, currentChannel } = useUserState();
  const { _id: channelId, channelAdmin } = currentChannel;
  const showToast = useNotification();

  const block = useCallback(async () => {
    if (channelAdmin !== user.userId) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };

      await axios.put(
        `api/block/register/${channelId}`,
        { selectedUser },
        config
      );

      setBlockUserList((prevBlockUserList) => {
        if (!prevBlockUserList.some((user) => user._id === selectedUser)) {
          const blockedUser = users.find((user) => user._id === selectedUser);
          return [...prevBlockUserList, blockedUser];
        }
      });

      showToast(messages.BLOCK_COMPLETED, "success");
      setSelectedUser(null);
    } catch (error) {
      showToast(
        error?.response?.data?.message || "ブロックに失敗しました",
        "error"
      );
    }
  }, [
    user,
    channelId,
    channelAdmin,
    users,
    selectedUser,
    setSelectedUser,
    setBlockUserList,
    showToast,
  ]);

  return (
    <CustomButton onClick={block} isDisabled={!selectedUser}>
      ブロック
    </CustomButton>
  );
};

const BlockedUserListTab = ({
  selectedBUser,
  setSelectedBUser,
  blockUserList,
}) => {
  return (
    <Stack gap={6} flex="1" overflow="auto" p={4} my={4}>
      {blockUserList.length > 0 ? (
        blockUserList.map((u) => (
          <DisplayUser
            key={u._id}
            user={u}
            cursor="pointer"
            onClick={() => setSelectedBUser(u._id)}
            borderColor={selectedBUser === u._id ? "blue.500" : "white"}
            borderWidth={selectedBUser === u._id ? "2px" : "0px"}
            _hover={{
              transform: "translateY(-2px)",
              boxShadow: "lg",
            }}
          />
        ))
      ) : (
        <DisplayUser
          user={{
            userName: "対象ユーザーがいません",
            pic: "/hatakekakashi.jpg",
          }}
        >
          <NonExistentUserBadge />
        </DisplayUser>
      )}
    </Stack>
  );
};

const UnblockButton = ({
  selectedBUser,
  setSelectedBUser,
  setBlockUserList,
}) => {
  const { user, currentChannel } = useUserState();
  const { _id: channelId, channelAdmin } = currentChannel;
  const showToast = useNotification();

  const cancelBlock = useCallback(async () => {
    if (channelAdmin !== user.userId) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };

      await axios.put(
        `api/block/cancel/${channelId}`,
        { selectedUser: selectedBUser },
        config
      );

      setBlockUserList((prevBlockUserList) => {
        const updatedBUserList = prevBlockUserList.filter(
          (user) => user._id !== selectedBUser
        );
        return updatedBUserList;
      });

      showToast(messages.BLOCK_CANCEL_COMPLETED, "success");
      setSelectedBUser(null);
    } catch (error) {
      showToast(
        error.response?.data?.message || "ブロック解除に失敗しました",
        "error"
      );
    }
  }, [
    user,
    channelId,
    channelAdmin,
    selectedBUser,
    setSelectedBUser,
    setBlockUserList,
    showToast,
  ]);

  return (
    <CustomButton onClick={cancelBlock} isDisabled={!selectedBUser}>
      解除
    </CustomButton>
  );
};

export default BlockModal;
