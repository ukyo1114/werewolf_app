import * as Yup from "yup";

export const profileSettingsValidationSchema = Yup.object({
  isUserNameChanged: Yup.boolean(),

  userName: Yup.string().when("isUserNameChanged", {
    is: true,
    then: (schema) =>
      schema
        .trim()
        .min(2, "ユーザー名は2文字以上である必要があります")
        .max(12, "ユーザー名は12文字以内である必要があります")
        .required("ユーザー名は必須です"),
    otherwise: (schema) => schema.notRequired(),
  }),
});

export const userSettingsValidationSchema = Yup.object({
  isEmailChanged: Yup.boolean(),
  isPasswordChanged: Yup.boolean(),

  email: Yup.string().when("isEmailChanged", {
    is: true,
    then: (schema) =>
      schema
        .trim()
        .email("有効なメールアドレスを入力してください")
        .required("メールアドレスは必須です"),
    otherwise: (schema) => schema.notRequired(),
  }),

  currentPassword: Yup.string().when(["isEmailChanged", "isPasswordChanged"], {
    is: (isEmailChanged, isPasswordChanged) => isEmailChanged || isPasswordChanged,
    then: (schema) =>
      schema
        .trim()
        .min(8, "パスワードは8文字以上である必要があります")
        .max(20, "パスワードは20文字以内である必要があります")
        .required("現在のパスワードは必須です"),
    otherwise: (schema) => schema.notRequired(),
  }),

  newPassword: Yup.string().when("isPasswordChanged", {
    is: true,
    then: (schema) =>
      schema
        .trim()
        .min(8, "パスワードは8文字以上である必要があります")
        .max(20, "パスワードは20文字以内である必要があります")
        .required("新しいパスワードは必須です"),
    otherwise: (schema) => schema.notRequired(),
  }),

  confirmNewPass: Yup.string().when("isPasswordChanged", {
    is: true,
    then: (schema) =>
      schema
        .trim()
        .oneOf([Yup.ref("newPassword"), null], "パスワードが一致しません")
        .required("確認用パスワードは必須です"),
    otherwise: (schema) => schema.notRequired(),
  }),
});

export const userSettingsInitialValues = {
  isEmailChanged: false,
  isPasswordChanged: false,
  email: "",
  currentPassword: "",
  newPassword: "",
  confirmNewPass: "",
};

