import { Stack, Text } from "@chakra-ui/react";

import DisplayUser from "./DisplayUser.jsx";
import { StyledText } from "./CustomComponents.jsx";
import { USER_STATUS, ROLE_MAP } from "../../constants";
import { useUserState } from "../../context/UserProvider.jsx";
import { useEffect } from "react";

const UserList = ({ userList }) => {
  const { user, currentChannel } = useUserState();
  const { isGame } = currentChannel;

  useEffect(() => {
    console.log("user", user);
  }, [user]);

  return (
    <Stack w="100%" p={2} gap={4} overflow="auto">
      {userList.length > 0 ? (
        userList.map((u) => {
          if (isGame && !u.status) return null;

          return (
            <DisplayUser
              key={u._id}
              user={u}
              bg={
                u.status &&
                (u.status === "dead"
                  ? "purple.100"
                  : u._id === user.partnerId
                    ? "pink.100"
                    : "white")
              }
            >
              {u.status && (
                <Text>
                  {USER_STATUS[u.status]}
                  {u.role && ` 【${ROLE_MAP[u.role]}】`}
                  {!u.role &&
                    u._id === user.partnerId &&
                    ` 【${ROLE_MAP.werewolf}】`}
                </Text>
              )}
            </DisplayUser>
          );
        })
      ) : (
        <StyledText>ユーザーがいません</StyledText>
      )}
    </Stack>
  );
};

export default UserList;
