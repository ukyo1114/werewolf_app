import { MenuItem, MenuDivider, useDisclosure } from "@chakra-ui/react";
import {
  FaUsers,
  FaBinoculars,
  FaArrowLeft,
  FaSignOutAlt,
  FaCog,
  FaUserSlash,
  FaInfoCircle,
} from "react-icons/fa";

import { useUserState } from "../../../context/UserProvider";
import useLeaveChannel from "../hooks/useLeaveChannel";
import MenuTemp from "./MenuTemp";
import DisplayChDescription from "../../../components/DisplayChDescription";
import UserList from "../../../components/UserList";
import SpectatorModal from "../components/ChannelSidebar/SpectatorModal";
import BlockModal from "../components/ChannelSidebar/BlockModal";
import ChannelSettingsModal from "../components/ChannelSidebar/ChannelSettingsModal";

const ChannelMenu = () => {
  const { user, currentChannel, chDispatch } = useUserState();
  const { channelAdmin, users } = currentChannel;
  const isAdmin = channelAdmin === user.userId;

  const userListModal = useDisclosure();
  const blockModal = useDisclosure();
  const chSettingsModal = useDisclosure();
  const spectator = useDisclosure();
  const chDescription = useDisclosure();

  const [leaveChannel] = useLeaveChannel();

  return (
    <MenuTemp>
      <MenuItem onClick={chDescription.onOpen}>
        <FaInfoCircle style={{ marginRight: 8 }} />
        チャンネル情報
      </MenuItem>

      <MenuDivider borderColor="gray.700" />

      <MenuItem onClick={userListModal.onOpen}>
        <FaUsers style={{ marginRight: 8 }} />
        ユーザーリスト
      </MenuItem>

      <MenuDivider borderColor="gray.700" />

      <MenuItem onClick={spectator.onOpen}>
        <FaBinoculars style={{ marginRight: 8 }} />
        観戦
      </MenuItem>

      {isAdmin && <MenuDivider borderColor="gray.700" />}

      {isAdmin && (
        <MenuItem onClick={chSettingsModal.onOpen}>
          <FaCog style={{ marginRight: 8 }} />
          チャンネル設定
        </MenuItem>
      )}

      {isAdmin && <MenuDivider borderColor="gray.700" />}

      {isAdmin && (
        <MenuItem onClick={blockModal.onOpen}>
          <FaUserSlash style={{ marginRight: 8 }} />
          ブロック/解除
        </MenuItem>
      )}

      <MenuDivider borderColor="gray.700" />

      <MenuItem onClick={() => chDispatch({ type: "LEAVE_CHANNEL" })}>
        <FaArrowLeft style={{ marginRight: 8 }} />
        戻る
      </MenuItem>

      {!isAdmin && <MenuDivider borderColor="gray.700" />}

      {!isAdmin && (
        <MenuItem onClick={() => leaveChannel()}>
          <FaSignOutAlt style={{ marginRight: 8 }} />
          退出
        </MenuItem>
      )}

      <DisplayChDescription
        isOpen={chDescription.isOpen}
        onClose={chDescription.onClose}
      />

      <UserList
        userList={users}
        isOpen={userListModal.isOpen}
        onClose={userListModal.onClose}
      />

      <SpectatorModal isOpen={spectator.isOpen} onClose={spectator.onClose} />

      {isAdmin && (
        <BlockModal isOpen={blockModal.isOpen} onClose={blockModal.onClose} />
      )}

      {isAdmin && (
        <ChannelSettingsModal
          isOpen={chSettingsModal.isOpen}
          onClose={chSettingsModal.onClose}
        />
      )}
    </MenuTemp>
  );
};

export default ChannelMenu;
