import { Suspense, lazy } from "react";
import { Flex, IconButton, useDisclosure } from "@chakra-ui/react";

import { FaBars } from "react-icons/fa";

import { useUserState } from "../../context/UserProvider";
import ChannelListHeader from "../channelList/ChannelListHeader";

const SideDrawer = lazy(() => import("./SideDrawer"));
const EntryCounter = lazy(() => import("../channel/EntryCounter"));
const GameTimer = lazy(() => import("../channel/GameTimer"));

export const ChannelHeader = ({ mode, showJoinedCh, setShowJoinedCh }) => {
  const { isMobile } = useUserState();
  const sideDrawer = useDisclosure();

  const modeConfig = {
    channelList: (
      <ChannelListHeader
        showJoinedCh={showJoinedCh} setShowJoinedCh={setShowJoinedCh}
      />
    ),
    channel: <EntryCounter />,
    game: <GameTimer />,
  };
  
  return(
    <Flex alignItems="center" w="100%" p={2}>
      {isMobile && (
        <Suspense fallback={<div>Loading...</div>}>
          <IconButton
            size="sm"
            bg="white"
            icon={<FaBars />}
            aria-label="サイドメニューを開く"
            onClick={sideDrawer.onOpen}
          />
          <SideDrawer
            mode={mode}
            isOpen={sideDrawer.isOpen}
            onClose={sideDrawer.onClose}
          />
        </Suspense>
      )}
      <Flex justifyContent="space-between" alignItems="center" w="100%">
        <Suspense fallback={<div>Loading...</div>}>{modeConfig[mode]}</Suspense>
      </Flex>
    </Flex>
  );
};