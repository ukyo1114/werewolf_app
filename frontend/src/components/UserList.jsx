import { Stack, Flex } from "@chakra-ui/react";

import DisplayUser from "./DisplayUser.jsx";
import { useUserState } from "../context/UserProvider.jsx";
import ModalTemplete from "./ModalTemplete.jsx";
import { StatusBadge, RoleBadge, NonExistentUserBadge } from "./Badge.jsx";

const teammateMapping = {
  werewolf: "werewolf",
  freemason: "freemason",
  immoralist: "fox",
  fanatic: "werewolf",
};

const UserList = ({ userList, isOpen, onClose, title = "ユーザーリスト" }) => {
  const { user, currentChannel } = useUserState();
  const { isGame } = currentChannel;

  return (
    <ModalTemplete isOpen={isOpen} onClose={onClose} title={title}>
      <Stack w="100%" gap={6}>
        {userList.length > 0 ? (
          userList.map((u) => {
            if (isGame && u.status === "spectator") return null;

            return (
              <DisplayUser key={u._id} user={u}>
                {u.status && (
                  <Flex gap={4}>
                    {u.status && <StatusBadge status={u.status} />}
                    {(u.role || user.teammates.includes(u._id)) && (
                      <RoleBadge role={u.role || teammateMapping[user.role]} />
                    )}
                  </Flex>
                )}
              </DisplayUser>
            );
          })
        ) : (
          <DisplayUser
            user={{ userName: "ユーザーがいません", pic: "/hatakekakashi.jpg" }}
          >
            <NonExistentUserBadge />
          </DisplayUser>
        )}
      </Stack>
    </ModalTemplete>
  );
};

export default UserList;
