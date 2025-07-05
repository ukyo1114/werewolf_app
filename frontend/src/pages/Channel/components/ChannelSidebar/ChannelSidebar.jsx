import SidebarTemp from "../SidebarTemp.jsx";
import { useDisclosure } from "@chakra-ui/react";

import {
  FaUsers,
  FaBinoculars,
  FaArrowLeft,
  FaSignOutAlt,
  FaCog,
  FaUserSlash,
  FaInfoCircle,
} from "react-icons/fa";

import { useUserState } from "../../../../context/UserProvider.jsx";
import UserList from "../../../../components/UserList.jsx";
import BlockModal from "./BlockModal.jsx";
import ChannelSettingsModal from "./ChannelSettingsModal.jsx";
import {
  SidebarButton,
  iconProps,
} from "../../../../components/CustomComponents.jsx";
import SpectatorModal from "./SpectatorModal.jsx";
import DisplayChDescription from "../../../../components/DisplayChDescription.jsx";
import useLeaveChannel from "../../hooks/useLeaveChannel";

const ChannelSidebar = () => {
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
    <SidebarTemp>
      <SidebarButton
        label="チャンネル情報"
        onClick={chDescription.onOpen}
        leftIcon={<FaInfoCircle {...iconProps} />}
      ></SidebarButton>

      <SidebarButton
        label="ユーザーリスト"
        onClick={userListModal.onOpen}
        leftIcon={<FaUsers {...iconProps} />}
      ></SidebarButton>

      <SidebarButton
        label="観戦"
        onClick={spectator.onOpen}
        leftIcon={<FaBinoculars {...iconProps} />}
      ></SidebarButton>

      <SidebarButton
        label="戻る"
        onClick={() => chDispatch({ type: "LEAVE_CHANNEL" })}
        leftIcon={<FaArrowLeft {...iconProps} />}
      ></SidebarButton>

      <SidebarButton
        label="退出"
        onClick={() => leaveChannel()}
        isDisabled={isAdmin}
        leftIcon={<FaSignOutAlt {...iconProps} />}
      ></SidebarButton>

      <SidebarButton
        label="ブロック/解除"
        onClick={blockModal.onOpen}
        isDisabled={!isAdmin}
        leftIcon={<FaUserSlash {...iconProps} />}
      ></SidebarButton>

      <SidebarButton
        label="チャンネル設定"
        onClick={chSettingsModal.onOpen}
        isDisabled={!isAdmin}
        leftIcon={<FaCog {...iconProps} />}
      ></SidebarButton>

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
    </SidebarTemp>
  );
};

export default ChannelSidebar;
