import unionBy from "lodash-es/unionBy";
import reject from "lodash-es/reject";
import union from "lodash-es/union";
import without from "lodash-es/without";

const initialChannelState = {
  _id: "",
  channelName: "",
  channelDescription: "",
  users: [],
  channelAdmin: "",
  blockUsers: [],
  numberOfPlayers: 0,
  channel: {
    _id: "",
    channelName: "",
    channelDescription: "",
  },
  isGame: false,
  phase: {
    currentDay: 0,
    currentPhase: "",
    changedAt: null,
  },
};

function channelReducer(state = initialChannelState, action) {
  switch (action.type) {
    case "JOIN_CHANNEL":
      return { ...initialChannelState, ...action.payload };
    case "JOIN_GAME":
      return { ...state, ...action.payload, isGame: true };
    case "LEAVE_CHANNEL":
      return initialChannelState;
    case "USER_JOINED": {
      const users = unionBy(state.users, [action.payload], "_id");
      return { ...state, users };
    }
    case "USER_LEFT": {
      const users = reject(state.users, { _id: action.payload });
      return { ...state, users };
    }
    case "USER_BLOCKED": {
      const users = reject(state.users, { _id: action.payload });
      const blockUsers = union(state.blockUsers, [action.payload]);
      return { ...state, users, blockUsers };
    }
    case "CANCEL_BLOCK": {
      const blockUsers = without(state.blockUsers, action.payload);
      return { ...state, blockUsers };
    }
    case "CHANNEL_SETTINGS": {
      const { channelName, channelDescription } = action.payload;
      return { ...state, channelName, channelDescription };
    }
    case "UPDATE_GAME_STATE": {
      const updatedUsersObj = action.payload.users;

      const users = state.users.map((user) => {
        const updatedUser = updatedUsersObj[user._id];
        return updatedUser ? { ...user, ...updatedUser } : user;
      });
      const phase = action.payload.phase;
      return { ...state, users, phase };
    }
    default:
      return state;
  }
}

export { channelReducer, initialChannelState };
