import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserState } from "../context/UserProvider";

export const useAuthCheck = () => {
  const navigate = useNavigate();
  const { uDispatch, chDispatch } = useUserState();

  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");

    if (!userInfo) {
      navigate("/");
    } else {
      const userIn = JSON.parse(userInfo);
      uDispatch({ type: "LOGIN", payload: userIn });
      chDispatch({ type: "LEAVE_CHANNEL" });
    }
  }, [navigate, uDispatch, chDispatch]);
};
