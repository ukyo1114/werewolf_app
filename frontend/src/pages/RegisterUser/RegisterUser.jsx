import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import useNotification from "../../commonHooks/useNotification";
import RegisterForm from "./RegisterForm";

const RegisterUser = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const showToast = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    userName: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.userName) {
      newErrors.userName = "ユーザー名は必須です";
    } else if (formData.userName.length > 20) {
      newErrors.userName = "ユーザー名は20文字以内で入力してください";
    }

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
      navigate("/");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data } = await axios.post("/api/user/register", {
        token,
        userName: formData.userName,
        password: formData.password,
      });

      showToast("ユーザー登録が完了しました", "success");

      localStorage.setItem(
        "userInfo",
        JSON.stringify({
          ...data,
          userName: formData.userName,
          pic: null,
        })
      );
      navigate("/channel-list");
    } catch (error) {
      showToast(error.response?.data?.message || "登録に失敗しました", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RegisterForm
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      errors={errors}
      formData={formData}
      handleChange={handleChange}
    />
  );
};

export default RegisterUser;
