import { useState } from "react";
import axios from "axios";
import EmailForm from "./EmailForm";
import SuccessView from "./SuccessView";
import useNotification from "../../commonHooks/useNotification";

const RequestPasswordReconfig = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const showToast = useNotification();

  const handleSubmit = async (email) => {
    try {
      setIsLoading(true);
      await axios.post("/api/verify-email/forgot-password", { email });
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

export default RequestPasswordReconfig;
