import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Stack,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Text,
} from "@chakra-ui/react";

import { useUserState } from "../../../../context/UserProvider.jsx";
import useNotification from "../../../../commonHooks/useNotification";
import { errors } from "../../../../messages";
import {
  DisplayDay,
  StyledText,
} from "../../../../components/CustomComponents.jsx";
import ModalTemplete from "../../../../components/ModalTemplete.jsx";
import DisplayUser from "../../../../components/DisplayUser.jsx";
import { RoleBadge } from "../../../../components/Badge.jsx";

const VoteHistoryModal = ({ mode, isOpen, onClose }) => {
  const modeConfig = {
    others: {
      tabs: ["投票履歴"],
      components: [<VoteHistory key="vote" />],
    },
    fortune: {
      tabs: ["投票履歴", "占い結果"],
      components: [<VoteHistory key="vote" />, <FortuneResult key="fortune" />],
    },
    medium: {
      tabs: ["投票履歴", "霊能結果"],
      components: [<VoteHistory key="vote" />, <MediumResult key="medium" />],
    },
    guard: {
      tabs: ["投票履歴", "護衛履歴"],
      components: [<VoteHistory key="vote" />, <GuardHistory key="guard" />],
    },
    attack: {
      tabs: ["投票履歴", "襲撃履歴"],
      components: [<VoteHistory key="vote" />, <AttackHistory key="attack" />],
    },
  };

  const { tabs, components } = modeConfig[mode] || modeConfig["others"];

  return (
    <ModalTemplete isOpen={isOpen} onClose={onClose} title={"投票履歴"}>
      <Tabs display="flex" flexDir="column" overflow="hidden">
        <TabList>
          {tabs.map((tabName) => (
            <Tab key={tabName} w={`${100 / tabs.length}%`}>
              {tabName}
            </Tab>
          ))}
        </TabList>
        <TabPanels display="flex" overflow="hidden">
          {components.map((Component, index) => (
            <TabPanel
              key={index}
              w="100%"
              p={0}
              display="flex"
              overflow="hidden"
            >
              {Component}
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </ModalTemplete>
  );
};

const VoteHistory = () => {
  const { user, currentChannel } = useUserState();
  const { _id: gameId, users, phase } = currentChannel;
  const [voteHistory, setVoteHistory] = useState({});
  const showToast = useNotification();

  const fetchVoteHistory = useCallback(async () => {
    if (phase.currentPhase !== "pre") {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };

        const { data } = await axios.get(
          `/api/game/vote-history/${gameId}`,
          config
        );

        setVoteHistory(data);
      } catch (error) {
        showToast(
          error?.response?.data?.message || errors.FETCH_VOTE_HISTORY_FAILED,
          "error"
        );
      }
    }
  }, [user.token, gameId, phase.currentPhase, setVoteHistory, showToast]);

  useEffect(() => {
    fetchVoteHistory();
  }, [fetchVoteHistory]);

  return (
    <Stack p={4} gap={6} flex="1" overflow="auto">
      {Object.entries(voteHistory).length > 0 ? (
        Object.entries(voteHistory)
          .reverse()
          .map(([day, vote]) => (
            <Stack key={day}>
              <DisplayDay day={day} />
              <Stack gap={6}>
                {Object.entries(vote).map(([votee, voters]) => {
                  const user = users.find((u) => u._id === votee);

                  return user ? (
                    <DisplayUser key={user._id} user={user}>
                      <Stack gap={0}>
                        <Text>投票数：{voters.length}票</Text>
                        <Text>
                          投票者：
                          {voters
                            .map((voter) => {
                              const voteUser = users.find(
                                (u) => u._id === voter
                              );
                              return voteUser
                                ? `【${voteUser.userName}】`
                                : null;
                            })
                            .filter(Boolean)
                            .join("、")}
                        </Text>
                      </Stack>
                    </DisplayUser>
                  ) : null;
                })}
              </Stack>
            </Stack>
          ))
      ) : (
        <StyledText>投票履歴がありません</StyledText>
      )}
    </Stack>
  );
};

const FortuneResult = () => {
  const { user, currentChannel } = useUserState();
  const { _id: gameId, users, phase } = currentChannel;
  const [fortuneResult, setFortuneResult] = useState({});
  const showToast = useNotification();

  const teams = {
    unknown: "【不明】",
    villagers: <RoleBadge role="villager" />,
    werewolves: <RoleBadge role="werewolf" />,
  };

  const fetchFortuneResult = useCallback(async () => {
    if (phase.currentPhase !== "pre" && user.role === "seer") {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };

        const { data } = await axios.get(
          `/api/game/fortune-result/${gameId}`,
          config
        );
        setFortuneResult(data);
      } catch (error) {
        showToast(
          error?.response?.data?.message || errors.FETCH_FORTUNE_RESULT_FAILED,
          "error"
        );
      }
    }
  }, [user, gameId, phase.currentPhase, setFortuneResult, showToast]);

  useEffect(() => {
    fetchFortuneResult();
  }, [fetchFortuneResult]);

  return (
    <Stack p={4} gap={6} flex="1" overflow="auto">
      {fortuneResult && Object.entries(fortuneResult).length > 0 ? (
        Object.entries(fortuneResult)
          .reverse()
          .map(([day, result]) => {
            const player = users.find((u) => u._id === result.playerId);
            return player ? (
              <Stack key={day}>
                <DisplayDay day={day} />
                <DisplayUser user={player}>
                  <Text>占い結果：{teams[result.team]}</Text>
                </DisplayUser>
              </Stack>
            ) : null;
          })
      ) : (
        <StyledText>占い結果がありません</StyledText>
      )}
    </Stack>
  );
};

const MediumResult = () => {
  const { user, currentChannel } = useUserState();
  const { _id: gameId, users, phase } = currentChannel;
  const [mediumResult, setMediumResult] = useState({});
  const showToast = useNotification();

  const teams = {
    unknown: "【不明】",
    villagers: <RoleBadge role="villager" />,
    werewolves: <RoleBadge role="werewolf" />,
  };

  const fetchMediumResult = useCallback(async () => {
    if (phase.currentPhase !== "pre" && user.role === "medium") {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };

        const { data } = await axios.get(
          `/api/game/medium-result/${gameId}`,
          config
        );
        setMediumResult(data);
      } catch (error) {
        showToast(
          error?.response?.data?.message || errors.FETCH_MEDIUM_RESULT_FAILED,
          "error"
        );
      }
    }
  }, [user, gameId, phase.currentPhase, setMediumResult, showToast]);

  useEffect(() => {
    fetchMediumResult();
  }, [fetchMediumResult]);

  return (
    <Stack p={4} gap={6} flex="1" overflow="auto">
      {mediumResult && Object.entries(mediumResult).length > 0 ? (
        Object.entries(mediumResult)
          .reverse()
          .map(([day, result]) => {
            const player = users.find((u) => u._id === result.playerId);
            return player ? (
              <Stack key={day}>
                <DisplayDay day={day} />
                <DisplayUser user={player}>
                  <Text>霊能結果：{teams[result.team]}</Text>
                </DisplayUser>
              </Stack>
            ) : null;
          })
      ) : (
        <StyledText>霊能結果がありません</StyledText>
      )}
    </Stack>
  );
};

const GuardHistory = () => {
  const { user, currentChannel } = useUserState();
  const { _id: gameId, users, phase } = currentChannel;
  const [guardHistory, setGuardHistory] = useState({});
  const showToast = useNotification();

  const fetchGuardHistory = useCallback(async () => {
    if (phase.currentPhase !== "pre" && user.role === "hunter") {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };

        const { data } = await axios.get(
          `/api/game/guard-history/${gameId}`,
          config
        );
        setGuardHistory(data);
      } catch (error) {
        showToast(
          error?.response?.data?.message || errors.FETCH_GUARD_HISTORY_FAILED,
          "error"
        );
      }
    }
  }, [user, gameId, phase.currentPhase, setGuardHistory, showToast]);

  useEffect(() => {
    fetchGuardHistory();
  }, [fetchGuardHistory]);

  return (
    <Stack p={4} gap={6} flex="1" overflow="auto">
      {guardHistory && Object.entries(guardHistory).length > 0 ? (
        Object.entries(guardHistory)
          .reverse()
          .map(([day, result]) => {
            const player = users.find((u) => u._id === result.playerId);

            return player ? (
              <Stack key={day}>
                <DisplayDay day={day} />
                <DisplayUser user={player} />
              </Stack>
            ) : null;
          })
      ) : (
        <StyledText>護衛履歴がありません</StyledText>
      )}
    </Stack>
  );
};

const AttackHistory = () => {
  const { user, currentChannel } = useUserState();
  const { _id: gameId, users, phase } = currentChannel;
  const [attackHistory, setAttackHistory] = useState({});
  const showToast = useNotification();

  const fetchAttackHistory = useCallback(async () => {
    if (phase.currentPhase !== "pre" && user.role === "werewolf") {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };

        const { data } = await axios.get(
          `/api/game/attack-history/${gameId}`,
          config
        );
        setAttackHistory(data);
      } catch (error) {
        showToast(
          error?.response?.data?.message || errors.FETCH_ATTACK_HISTORY_FAILED,
          "error"
        );
      }
    }
  }, [user, gameId, phase.currentPhase, setAttackHistory, showToast]);

  useEffect(() => {
    fetchAttackHistory();
  }, [fetchAttackHistory]);

  return (
    <Stack p={4} gap={6} flex="1" overflow="auto">
      {attackHistory && Object.entries(attackHistory).length > 0 ? (
        Object.entries(attackHistory)
          .reverse()
          .map(([day, result]) => {
            const player = users.find((u) => u._id === result.playerId);

            return player ? (
              <Stack key={day}>
                <DisplayDay day={day} />
                <DisplayUser user={player} />
              </Stack>
            ) : null;
          })
      ) : (
        <StyledText>襲撃履歴がありません</StyledText>
      )}
    </Stack>
  );
};

export default VoteHistoryModal;
