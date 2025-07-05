import { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import useNotification from "../../commonHooks/useNotification";
import PasswordForm from "./PasswordForm";
import SuccessView from "./SuccessView";

const ReconfigPassword = () => {
  const { token } = useParams();
  const showToast = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = "パスワードは必須です";
    } else if (formData.password.length < 8) {
      newErrors.password = "パスワードは8文字以上で入力してください";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "パスワードの確認は必須です";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "パスワードが一致しません";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!token) {
      showToast("無効なリンクです", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.put("/api/user/reset-password", {
        token,
        password: formData.password,
      });

      setIsSuccess(true);
    } catch (error) {
      showToast(
        error.response?.data?.message || "パスワードの再設定に失敗しました",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return <SuccessView />;
  }

  return (
    <PasswordForm
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      errors={errors}
      formData={formData}
      handleChange={handleChange}
    />
  );
};

export default ReconfigPassword;
