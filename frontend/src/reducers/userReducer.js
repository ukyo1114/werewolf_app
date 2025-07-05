const initialUserState = {
  userId: "",
  userName: "",
  pic: "",
  token: "",
  status: "",
  role: "",
  isGuest: false,
  teammates: [],
};

function userReducer(state = initialUserState, action) {
  switch (action.type) {
    case "LOGIN":
      return { ...state, ...action.payload };
    case "JOIN_GAME":
      return { ...state, ...action.payload };
    case "LEAVE_GAME":
      return { ...state, status: "", role: "", teammates: [] };
    case "LOGOUT":
      return initialUserState;
    case "CHANGE_NAME":
      return { ...state, userName: action.payload };
    case "CHANGE_PIC":
      return { ...state, pic: action.payload };
    case "UPDATE_STATUS": {
      const user = action.payload.users[state.userId];
      return user ? { ...state, status: user.status } : state;
    }
    default:
      return state;
  }
}

export { userReducer, initialUserState };
