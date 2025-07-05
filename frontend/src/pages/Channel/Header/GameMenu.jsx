import { useState, useCallback } from "react";
import { MenuItem, MenuDivider, useDisclosure } from "@chakra-ui/react";

import { useUserState } from "../../../context/UserProvider";
import { useJoinChannel } from "../../../commonHooks/useJoinChannel";
import MenuTemp from "./MenuTemp";
import { MODE_MAP } from "../../../constants";
import DisplayChDescription from "../../../components/DisplayChDescription";
import UserList from "../../../components/UserList";
import VoteHistoryModal from "../components/GameSidebar/VoteHistoryModal";
import VoteModal from "../components/GameSidebar/VoteModal";

const GameMenu = () => {
  const { user, currentChannel } = useUserState();
  const { channel, users, phase } = currentChannel;

  const userList = useDisclosure();
  const voteModal = useDisclosure();
  const vHistoryModal = useDisclosure();
  const chDescription = useDisclosure();

  const [mode, setMode] = useState("");
  const joinChannel = useJoinChannel();

  const handleVoteModalOpen = useCallback(
    (str) => {
      setMode(str);
      voteModal.onOpen();
    },
    [setMode, voteModal]
  );

  const backToChannel = useCallback(async () => {
    await joinChannel(channel._id);
  }, [channel, joinChannel]);

  return (
    <MenuTemp>
      <MenuItem onClick={chDescription.onOpen}>チャンネル情報</MenuItem>

      <MenuDivider borderColor="gray.700" />

      <MenuItem onClick={userList.onOpen}>ユーザーリスト</MenuItem>

      <MenuDivider borderColor="gray.700" />

      <MenuItem
        onClick={() => handleVoteModalOpen("vote")}
        isDisabled={phase.currentPhase !== "day" || user.status !== "alive"}
      >
        投票
      </MenuItem>

      <MenuDivider borderColor="gray.700" />

      <MenuItem
        onClick={() => handleVoteModalOpen("fortune")}
        isDisabled={
          phase.currentPhase !== "night" ||
          user.status !== "alive" ||
          user.role !== "seer"
        }
      >
        占い
      </MenuItem>

      <MenuDivider borderColor="gray.700" />

      <MenuItem
        onClick={() => handleVoteModalOpen("guard")}
        isDisabled={
          phase.currentPhase !== "night" ||
          user.status !== "alive" ||
          user.role !== "hunter"
        }
      >
        護衛
      </MenuItem>

      <MenuDivider borderColor="gray.700" />

      <MenuItem
        onClick={() => handleVoteModalOpen("attack")}
        isDisabled={
          phase.currentPhase !== "night" ||
          user.status !== "alive" ||
          user.role !== "werewolf"
        }
      >
        襲撃
      </MenuItem>

      <MenuDivider borderColor="gray.700" />

      <MenuItem onClick={vHistoryModal.onOpen}>投票履歴</MenuItem>

      <MenuDivider borderColor="gray.700" />

      <MenuItem
        onClick={backToChannel}
        isDisabled={
          phase.currentPhase !== "finished" && user.status === "alive"
        }
      >
        チャンネルへ
      </MenuItem>

      <DisplayChDescription
        mode="game"
        isOpen={chDescription.isOpen}
        onClose={chDescription.onClose}
      />

      <UserList
        userList={users}
        isOpen={userList.isOpen}
        onClose={userList.onClose}
      />

      <VoteHistoryModal
        mode={MODE_MAP[user.role] || "others"}
        isOpen={vHistoryModal.isOpen}
        onClose={vHistoryModal.onClose}
      />

      <VoteModal
        mode={mode}
        isOpen={voteModal.isOpen}
        onClose={voteModal.onClose}
      />
    </MenuTemp>
  );
};

export default GameMenu;
