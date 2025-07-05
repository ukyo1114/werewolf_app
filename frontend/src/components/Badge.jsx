import { Badge, Text } from "@chakra-ui/react";
import {
  FaLock,
  FaUserSlash,
  FaHeart,
  FaSkull,
  FaEye,
  FaUser,
  FaUserCircle,
  FaBinoculars,
  FaWolfPackBattalion,
  FaFirefox,
  FaCog,
} from "react-icons/fa";

export const PasswordBadge = () => {
  return (
    <Badge colorScheme="blue" fontSize="sm">
      <span style={{ display: "inline-flex", alignItems: "center" }}>
        <FaLock style={{ marginRight: 4 }} />
        <Text>パスワード付き</Text>
      </span>
    </Badge>
  );
};

export const DenyGuestsBadge = () => {
  return (
    <Badge colorScheme="purple" fontSize="sm">
      <span style={{ display: "inline-flex", alignItems: "center" }}>
        <FaUserSlash style={{ marginRight: 4 }} />
        <Text>ゲスト入室不可</Text>
      </span>
    </Badge>
  );
};

export const GuestBadge = () => {
  return (
    <Badge colorScheme="teal" fontSize="sm">
      <span style={{ display: "inline-flex", alignItems: "center" }}>
        <FaUserCircle style={{ marginRight: 4 }} />
        <Text>ゲスト</Text>
      </span>
    </Badge>
  );
};

export const StatusBadge = ({ status }) => {
  const USER_STATUS = {
    alive: "生存",
    dead: "死亡",
    spectator: "観戦者",
  };

  const getStatusIcon = () => {
    switch (status) {
      case "alive":
        return <FaHeart style={{ marginRight: 4 }} />;
      case "dead":
        return <FaSkull style={{ marginRight: 4 }} />;
      case "spectator":
        return <FaEye style={{ marginRight: 4 }} />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "alive":
        return "green";
      case "dead":
        return "red";
      case "spectator":
        return "gray";
      default:
        return "gray";
    }
  };

  return (
    <Badge colorScheme={getStatusColor()} fontSize="sm">
      <span style={{ display: "inline-flex", alignItems: "center" }}>
        {getStatusIcon()}
        <Text>{USER_STATUS[status] || status}</Text>
      </span>
    </Badge>
  );
};

export const RoleBadge = ({ role }) => {
  const ROLE_MAP = {
    villager: "村人",
    seer: "占い師",
    medium: "霊能者",
    hunter: "狩人",
    freemason: "共有者",
    werewolf: "人狼",
    madman: "狂人",
    fox: "妖狐",
    immoralist: "背徳者",
    fanatic: "狂信者",
    spectator: "観戦者",
  };

  const getRoleIcon = () => {
    switch (role) {
      // 村人陣営
      case "villager":
      case "seer":
      case "medium":
      case "hunter":
      case "freemason":
        return <FaUser style={{ marginRight: 4 }} />;

      // 人狼陣営
      case "werewolf":
      case "madman":
      case "fanatic":
        return <FaWolfPackBattalion style={{ marginRight: 4 }} />;

      // 妖狐陣営
      case "fox":
      case "immoralist":
        return <FaFirefox style={{ marginRight: 4 }} />;

      case "spectator":
        return <FaBinoculars style={{ marginRight: 4 }} />;
      default:
        return null;
    }
  };

  const getRoleColor = () => {
    switch (role) {
      // 村人陣営
      case "villager":
      case "seer":
      case "medium":
      case "hunter":
      case "freemason":
        return "blue";

      // 人狼陣営
      case "werewolf":
      case "madman":
      case "fanatic":
        return "red";

      // 妖狐陣営
      case "fox":
      case "immoralist":
        return "purple";

      // 観戦者
      case "spectator":
        return "gray";

      default:
        return "gray";
    }
  };

  return (
    <Badge colorScheme={getRoleColor()} fontSize="sm">
      <span style={{ display: "inline-flex", alignItems: "center" }}>
        {getRoleIcon()}
        <Text>{ROLE_MAP[role] || role}</Text>
      </span>
    </Badge>
  );
};

export const NonExistentUserBadge = () => {
  return (
    <Badge colorScheme="gray" fontSize="sm">
      <span style={{ display: "inline-flex", alignItems: "center" }}>
        <FaCog style={{ marginRight: 4 }} />
        <Text>システム</Text>
      </span>
    </Badge>
  );
};
