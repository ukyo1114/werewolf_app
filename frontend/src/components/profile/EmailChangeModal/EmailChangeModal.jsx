import { useState } from "react";
import ModalTemplete from "../../ModalTemplete.jsx";
import EmailChangeForm from "./EmailChangeForm.jsx";
import SuccessView from "./SuccessView.jsx";

const EmailChangeModal = ({ isOpen, onClose }) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const handleSuccess = (email) => {
    setSubmittedEmail(email);
    setIsSuccess(true);
  };

  const handleClose = () => {
    setIsSuccess(false);
    setSubmittedEmail("");
    onClose();
  };

  return (
    <ModalTemplete
      isOpen={isOpen}
      onClose={handleClose}
      title={isSuccess ? "メールアドレス変更完了" : "メールアドレス変更"}
    >
      {isSuccess ? (
        <SuccessView onClose={handleClose} email={submittedEmail} />
      ) : (
        <EmailChangeForm onSuccess={handleSuccess} />
      )}
    </ModalTemplete>
  );
};

export default EmailChangeModal;
