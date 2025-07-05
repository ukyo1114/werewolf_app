import { useNavigate } from "react-router-dom";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  useDisclosure,
} from "@chakra-ui/react";
import {
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaEnvelope,
  FaLock,
} from "react-icons/fa";

import { useUserState } from "../../context/UserProvider";
import ProfileModal from "./ProfileModal";
import ProfileSettingsModal from "./ProfileSettingsModal";
import EmailChangeModal from "./EmailChangeModal/EmailChangeModal";
import PasswordChangeModal from "./PasswordChangeModal/PasswordChangeModal";

const ProfileMenu = () => {
  const pModal = useDisclosure();
  const psModal = useDisclosure();
  const emailModal = useDisclosure();
  const passwordModal = useDisclosure();

  const navigate = useNavigate();
  const { user, uDispatch } = useUserState();

  const logoutHandler = () => {
    localStorage.removeItem("userInfo");
    uDispatch({ type: "LOGOUT" });
    navigate("/");
  };

  return (
    <Menu>
      <MenuButton
        as={Avatar}
        size="sm"
        src={user.pic}
        borderRadius="md"
        boxShadow="md"
        _hover={{
          transform: "translateY(-2px)",
          boxShadow: "lg",
        }}
        cursor="pointer"
      />
      <MenuList boxShadow="lg">
        <MenuItem onClick={pModal.onOpen}>
          <FaUser style={{ marginRight: 8 }} />
          プロフィール
        </MenuItem>

        <MenuDivider borderColor="gray.700" />

        <MenuItem onClick={psModal.onOpen}>
          <FaCog style={{ marginRight: 8 }} />
          プロフィール設定
        </MenuItem>

        {!user.isGuest && <MenuDivider borderColor="gray.700" />}

        {!user.isGuest && (
          <MenuItem onClick={emailModal.onOpen}>
            <FaEnvelope style={{ marginRight: 8 }} />
            メールアドレス変更
          </MenuItem>
        )}

        {!user.isGuest && <MenuDivider borderColor="gray.700" />}

        {!user.isGuest && (
          <MenuItem onClick={passwordModal.onOpen}>
            <FaLock style={{ marginRight: 8 }} />
            パスワード変更
          </MenuItem>
        )}

        <MenuDivider borderColor="gray.700" />

        <MenuItem onClick={logoutHandler}>
          <FaSignOutAlt style={{ marginRight: 8 }} />
          ログアウト
        </MenuItem>

        <ProfileModal isOpen={pModal.isOpen} onClose={pModal.onClose} />
        <ProfileSettingsModal
          isOpen={psModal.isOpen}
          onClose={psModal.onClose}
        />
        {!user.isGuest && (
          <EmailChangeModal
            isOpen={emailModal.isOpen}
            onClose={emailModal.onClose}
          />
        )}
        {!user.isGuest && (
          <PasswordChangeModal
            isOpen={passwordModal.isOpen}
            onClose={passwordModal.onClose}
          />
        )}
      </MenuList>
    </Menu>
  );
};

export default ProfileMenu;
