import * as Yup from "yup";

export const pResetInitialValues = {
  password: "",
  confirmPassword: "",
};

export const pResetSchema = Yup.object({
  password: Yup.string()
    .trim()
    .min(8, "パスワードは8文字以上である必要があります")
    .max(20, "パスワードは20文字以内である必要があります")
    .required("パスワードは必須です"),

  confirmPassword: Yup.string()
    .trim()
    .oneOf([Yup.ref("password"), null], "パスワードが一致しません")
    .required("確認用パスワードは必須です"),
});