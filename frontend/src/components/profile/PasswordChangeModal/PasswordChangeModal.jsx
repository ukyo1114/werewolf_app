import { useState } from "react";
import ModalTemplete from "../../ModalTemplete.jsx";
import PasswordChangeForm from "./PasswordChangeForm.jsx";
import SuccessView from "./SuccessView.jsx";

const PasswordChangeModal = ({ isOpen, onClose }) => {
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSuccess = () => {
    setIsSuccess(true);
  };

  const handleClose = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <ModalTemplete
      isOpen={isOpen}
      onClose={handleClose}
      title={isSuccess ? "パスワード変更完了" : "パスワード変更"}
    >
      {isSuccess ? (
        <SuccessView onClose={handleClose} />
      ) : (
        <PasswordChangeForm onSuccess={handleSuccess} />
      )}
    </ModalTemplete>
  );
};

export default PasswordChangeModal;
