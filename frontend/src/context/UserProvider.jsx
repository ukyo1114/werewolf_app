import { createContext, useReducer, useContext } from "react";
import { useMediaQuery } from "react-responsive";

import { userReducer, initialUserState } from "../reducers/userReducer";
import {
  channelReducer,
  initialChannelState,
} from "../reducers/channelReducer";

const UserContext = createContext();

const UserProvider = ({ children }) => {
  const [user, uDispatch] = useReducer(userReducer, initialUserState);
  const [currentChannel, chDispatch] = useReducer(
    channelReducer,
    initialChannelState
  );
  const isMobile = useMediaQuery({ maxWidth: 767 });

  return (
    <UserContext.Provider
      value={{ user, uDispatch, currentChannel, chDispatch, isMobile }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserState = () => {
  return useContext(UserContext);
};

export default UserProvider;
