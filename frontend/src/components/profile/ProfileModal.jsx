import { useUserState } from "../../context/UserProvider.jsx";
import DisplayUser from "../DisplayUser.jsx";
import ModalTemplete from "../ModalTemplete.jsx";

const ProfileModal = ({ isOpen, onClose }) => {
  const { user } = useUserState();

  return (
    <ModalTemplete isOpen={isOpen} onClose={onClose} title={"プロフィール"}>
      <DisplayUser key={user.userId} user={user}></DisplayUser>
    </ModalTemplete>
  );
};

export default ProfileModal;
