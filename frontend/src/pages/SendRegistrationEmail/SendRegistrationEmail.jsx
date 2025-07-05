import { useState } from "react";
import axios from "axios";
import SuccessView from "./SuccessView";
import EmailForm from "./EmailForm";
import useNotification from "../../commonHooks/useNotification";

const SendRegistrationEmail = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const showToast = useNotification();

  const handleSubmit = async (email, confirmEmail) => {
    if (email !== confirmEmail) {
      showToast("メールアドレスが一致しません", "error");
      return;
    }
    try {
      setIsLoading(true);
      await axios.post("/api/verify-email/register-user", { email });
      setSubmittedEmail(email);
      setIsSuccess(true);
    } catch (error) {
      showToast(
        error.response?.data?.message || "メールの送信に失敗しました。",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return isSuccess ? (
    <SuccessView email={submittedEmail} />
  ) : (
    <EmailForm onSubmit={handleSubmit} isLoading={isLoading} />
  );
};

export default SendRegistrationEmail;
